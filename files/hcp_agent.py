"""
LangGraph AI Agent for HCP CRM
Tools:
  1. log_interaction      - Capture & AI-enhance interaction data
  2. edit_interaction     - Modify existing logged interactions
  3. search_hcp           - Search HCP profiles and history
  4. schedule_followup    - Create follow-up tasks
  5. analyze_sentiment    - Analyze interaction sentiment & engagement score
"""

import os
import json
from typing import TypedDict, Annotated, Any
from datetime import datetime

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ─── Shared DB accessor (injected at runtime) ────────────────────────────────
_db_session = None

def set_db(db):
    global _db_session
    _db_session = db


# ─── Tool 1: Log Interaction ──────────────────────────────────────────────────
@tool
def log_interaction(
    hcp_id: int,
    hcp_name: str,
    rep_name: str,
    interaction_type: str,
    location: str,
    products_discussed: str,
    topics_discussed: str,
    samples_given: str,
    notes: str,
    raw_transcript: str = ""
) -> dict:
    """
    Logs a new HCP interaction. Uses LLM to generate a professional summary,
    extract key entities, and assign an engagement score.
    Returns the saved interaction ID and AI-enhanced fields.
    """
    from db.database import Interaction, SessionLocal

    llm = ChatGroq(model="gemma2-9b-it", api_key=GROQ_API_KEY, temperature=0.3)

    # AI: summarize + extract + score
    prompt = f"""You are a pharma CRM assistant. Given this HCP interaction data, return ONLY valid JSON.

HCP: {hcp_name}
Type: {interaction_type}
Products: {products_discussed}
Topics: {topics_discussed}
Samples: {samples_given}
Notes: {notes}
Transcript: {raw_transcript}

Return JSON with keys:
- summary: 2-3 sentence professional summary
- sentiment: "positive" | "neutral" | "negative"
- engagement_score: float 0-10
- next_steps: suggested next steps string
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        text = response.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        ai_data = json.loads(text)
    except Exception:
        ai_data = {
            "summary": f"Interaction with {hcp_name} regarding {products_discussed}.",
            "sentiment": "neutral",
            "engagement_score": 5.0,
            "next_steps": "Follow up in 2 weeks."
        }

    db = SessionLocal()
    try:
        interaction = Interaction(
            hcp_id=hcp_id,
            hcp_name=hcp_name,
            rep_name=rep_name,
            interaction_type=interaction_type,
            date=datetime.utcnow(),
            location=location,
            products_discussed=products_discussed,
            topics_discussed=topics_discussed,
            samples_given=samples_given,
            notes=notes,
            raw_transcript=raw_transcript,
            ai_summary=ai_data.get("summary", ""),
            sentiment=ai_data.get("sentiment", "neutral"),
            engagement_score=float(ai_data.get("engagement_score", 5.0)),
            next_steps=ai_data.get("next_steps", ""),
            status="logged"
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return {
            "success": True,
            "interaction_id": interaction.id,
            "ai_summary": interaction.ai_summary,
            "sentiment": interaction.sentiment,
            "engagement_score": interaction.engagement_score,
            "next_steps": interaction.next_steps
        }
    finally:
        db.close()


# ─── Tool 2: Edit Interaction ─────────────────────────────────────────────────
@tool
def edit_interaction(
    interaction_id: int,
    field: str,
    new_value: str
) -> dict:
    """
    Edits a specific field of an existing interaction.
    Allowed fields: notes, products_discussed, topics_discussed,
    samples_given, location, next_steps, status.
    Re-runs AI summary if notes or topics change.
    """
    from db.database import Interaction, SessionLocal

    allowed = {"notes", "products_discussed", "topics_discussed",
               "samples_given", "location", "next_steps", "status"}

    if field not in allowed:
        return {"success": False, "error": f"Field '{field}' is not editable."}

    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return {"success": False, "error": "Interaction not found."}

        setattr(interaction, field, new_value)
        interaction.updated_at = datetime.utcnow()

        # Re-generate summary if content changed
        if field in {"notes", "topics_discussed", "products_discussed"}:
            llm = ChatGroq(model="gemma2-9b-it", api_key=GROQ_API_KEY, temperature=0.3)
            prompt = f"""Rewrite the professional summary for this HCP interaction. Return ONLY the summary text (2-3 sentences).
HCP: {interaction.hcp_name}
Products: {interaction.products_discussed}
Topics: {interaction.topics_discussed}
Notes: {interaction.notes}"""
            resp = llm.invoke([HumanMessage(content=prompt)])
            interaction.ai_summary = resp.content.strip()

        db.commit()
        return {
            "success": True,
            "interaction_id": interaction_id,
            "updated_field": field,
            "new_value": new_value,
            "ai_summary": interaction.ai_summary
        }
    finally:
        db.close()


# ─── Tool 3: Search HCP ───────────────────────────────────────────────────────
@tool
def search_hcp(query: str) -> dict:
    """
    Searches HCP profiles by name, specialty, or hospital.
    Also returns recent interaction history for matched HCPs.
    """
    from db.database import HCP, Interaction, SessionLocal

    db = SessionLocal()
    try:
        q = f"%{query}%"
        hcps = db.query(HCP).filter(
            (HCP.name.ilike(q)) |
            (HCP.specialty.ilike(q)) |
            (HCP.hospital.ilike(q))
        ).limit(10).all()

        results = []
        for hcp in hcps:
            recent = db.query(Interaction)\
                .filter(Interaction.hcp_id == hcp.id)\
                .order_by(Interaction.date.desc())\
                .limit(3).all()
            results.append({
                "id": hcp.id,
                "name": hcp.name,
                "specialty": hcp.specialty,
                "hospital": hcp.hospital,
                "city": hcp.city,
                "tier": hcp.tier,
                "recent_interactions": [
                    {
                        "id": i.id,
                        "date": i.date.isoformat() if i.date else "",
                        "type": i.interaction_type,
                        "summary": i.ai_summary or i.notes or ""
                    } for i in recent
                ]
            })

        return {"success": True, "count": len(results), "hcps": results}
    finally:
        db.close()


# ─── Tool 4: Schedule Follow-Up ───────────────────────────────────────────────
@tool
def schedule_followup(
    interaction_id: int,
    hcp_id: int,
    task: str,
    due_date: str,
    priority: str = "medium"
) -> dict:
    """
    Creates a follow-up task linked to an interaction.
    due_date format: YYYY-MM-DD.
    priority: low | medium | high.
    Uses LLM to suggest the best follow-up action if task is vague.
    """
    from db.database import FollowUp, Interaction, SessionLocal

    db = SessionLocal()
    try:
        # Enrich vague tasks with LLM
        if len(task) < 20:
            interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
            if interaction:
                llm = ChatGroq(model="gemma2-9b-it", api_key=GROQ_API_KEY, temperature=0.4)
                prompt = f"""Suggest a specific follow-up action for a pharma rep.
Context: Interaction with {interaction.hcp_name} about {interaction.products_discussed}.
Vague task: "{task}"
Reply with ONE specific, actionable task (max 30 words)."""
                resp = llm.invoke([HumanMessage(content=prompt)])
                task = resp.content.strip()

        due = datetime.strptime(due_date, "%Y-%m-%d")
        followup = FollowUp(
            interaction_id=interaction_id,
            hcp_id=hcp_id,
            task=task,
            due_date=due,
            priority=priority
        )
        db.add(followup)
        db.commit()
        db.refresh(followup)
        return {
            "success": True,
            "followup_id": followup.id,
            "task": followup.task,
            "due_date": due_date,
            "priority": priority
        }
    finally:
        db.close()


# ─── Tool 5: Analyze Sentiment ────────────────────────────────────────────────
@tool
def analyze_sentiment(interaction_id: int) -> dict:
    """
    Re-analyzes the sentiment and engagement score of an interaction using LLM.
    Updates the database and returns detailed emotional breakdown.
    """
    from db.database import Interaction, SessionLocal

    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return {"success": False, "error": "Interaction not found."}

        llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
        prompt = f"""Analyze the sentiment of this pharma HCP interaction. Return ONLY valid JSON.

Notes: {interaction.notes}
Topics: {interaction.topics_discussed}
Products: {interaction.products_discussed}
Summary: {interaction.ai_summary}

JSON keys:
- overall_sentiment: "positive" | "neutral" | "negative"
- engagement_score: float 0-10
- confidence: float 0-1
- key_signals: list of 3 strings describing sentiment signals
- recommendation: one sentence rep coaching tip
"""
        response = llm.invoke([HumanMessage(content=prompt)])
        try:
            text = response.content.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            result = json.loads(text)
        except Exception:
            result = {
                "overall_sentiment": "neutral",
                "engagement_score": 5.0,
                "confidence": 0.5,
                "key_signals": ["Limited data", "No strong indicators", "Neutral tone"],
                "recommendation": "Schedule a follow-up call to gauge HCP interest."
            }

        interaction.sentiment = result.get("overall_sentiment", interaction.sentiment)
        interaction.engagement_score = float(result.get("engagement_score", interaction.engagement_score))
        db.commit()

        return {"success": True, "interaction_id": interaction_id, **result}
    finally:
        db.close()


# ─── LangGraph Agent ──────────────────────────────────────────────────────────
tools = [log_interaction, edit_interaction, search_hcp, schedule_followup, analyze_sentiment]

SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system. 
You help field sales representatives log, manage, and analyze their interactions with Healthcare Professionals (HCPs).

You have access to these tools:
1. log_interaction - Log a new HCP interaction with AI-powered summarization
2. edit_interaction - Edit fields of an existing interaction  
3. search_hcp - Search for HCP profiles and history
4. schedule_followup - Schedule follow-up tasks linked to interactions
5. analyze_sentiment - Analyze sentiment and engagement of an interaction

Always be professional, concise, and helpful. Extract relevant details from the user's message to fill tool parameters.
When the user wants to log an interaction via chat, gather all required information naturally before calling log_interaction."""


class AgentState(TypedDict):
    messages: Annotated[list, lambda x, y: x + y]


def should_continue(state: AgentState):
    messages = state["messages"]
    last = messages[-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


def call_model(state: AgentState):
    llm = ChatGroq(
        model="gemma2-9b-it",
        api_key=GROQ_API_KEY,
        temperature=0.3
    ).bind_tools(tools)

    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


def build_agent():
    tool_node = ToolNode(tools)
    graph = StateGraph(AgentState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


agent = build_agent()


def run_agent(user_message: str, history: list = None) -> dict:
    """Run the agent with a user message and optional history."""
    messages = []
    if history:
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_message))

    result = agent.invoke({"messages": messages})

    last_msg = result["messages"][-1]
    return {
        "response": last_msg.content,
        "tool_calls": [
            {"name": tc["name"], "args": tc["args"]}
            for tc in (last_msg.tool_calls if hasattr(last_msg, "tool_calls") and last_msg.tool_calls else [])
        ]
    }
