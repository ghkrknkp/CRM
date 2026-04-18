from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import os

from db.database import get_db, init_db, HCP, Interaction, FollowUp, SessionLocal
from agents.hcp_agent import run_agent

app = FastAPI(title="HCP CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class InteractionCreate(BaseModel):
    hcp_id: int
    hcp_name: str
    rep_name: str
    interaction_type: str = "visit"
    location: str = ""
    products_discussed: str = ""
    topics_discussed: str = ""
    samples_given: str = ""
    notes: str = ""
    raw_transcript: str = ""

class InteractionUpdate(BaseModel):
    field: str
    new_value: str

class FollowUpCreate(BaseModel):
    interaction_id: int
    hcp_id: int
    task: str
    due_date: str
    priority: str = "medium"


# ─── HCP Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/hcps")
def list_hcps(db: Session = Depends(get_db)):
    hcps = db.query(HCP).all()
    return [
        {
            "id": h.id, "name": h.name, "specialty": h.specialty,
            "hospital": h.hospital, "email": h.email, "phone": h.phone,
            "city": h.city, "state": h.state, "tier": h.tier
        }
        for h in hcps
    ]

@app.get("/api/hcps/{hcp_id}")
def get_hcp(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    interactions = db.query(Interaction)\
        .filter(Interaction.hcp_id == hcp_id)\
        .order_by(Interaction.date.desc()).all()
    return {
        "id": hcp.id, "name": hcp.name, "specialty": hcp.specialty,
        "hospital": hcp.hospital, "email": hcp.email, "phone": hcp.phone,
        "city": hcp.city, "tier": hcp.tier,
        "interactions": [
            {
                "id": i.id, "date": i.date.isoformat() if i.date else "",
                "type": i.interaction_type, "summary": i.ai_summary or i.notes,
                "sentiment": i.sentiment, "engagement_score": i.engagement_score,
                "status": i.status
            }
            for i in interactions
        ]
    }


# ─── Interaction Endpoints ────────────────────────────────────────────────────

@app.get("/api/interactions")
def list_interactions(db: Session = Depends(get_db)):
    interactions = db.query(Interaction).order_by(Interaction.date.desc()).limit(50).all()
    return [
        {
            "id": i.id, "hcp_id": i.hcp_id, "hcp_name": i.hcp_name,
            "rep_name": i.rep_name, "interaction_type": i.interaction_type,
            "date": i.date.isoformat() if i.date else "",
            "location": i.location,
            "products_discussed": i.products_discussed,
            "topics_discussed": i.topics_discussed,
            "samples_given": i.samples_given,
            "notes": i.notes, "ai_summary": i.ai_summary,
            "sentiment": i.sentiment, "engagement_score": i.engagement_score,
            "next_steps": i.next_steps, "status": i.status
        }
        for i in interactions
    ]

@app.get("/api/interactions/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    i = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return {
        "id": i.id, "hcp_id": i.hcp_id, "hcp_name": i.hcp_name,
        "rep_name": i.rep_name, "interaction_type": i.interaction_type,
        "date": i.date.isoformat() if i.date else "",
        "location": i.location,
        "products_discussed": i.products_discussed,
        "topics_discussed": i.topics_discussed,
        "samples_given": i.samples_given,
        "notes": i.notes, "ai_summary": i.ai_summary,
        "sentiment": i.sentiment, "engagement_score": i.engagement_score,
        "next_steps": i.next_steps, "status": i.status,
        "raw_transcript": i.raw_transcript
    }

@app.post("/api/interactions")
def create_interaction(body: InteractionCreate):
    from agents.hcp_agent import log_interaction
    result = log_interaction.invoke({
        "hcp_id": body.hcp_id,
        "hcp_name": body.hcp_name,
        "rep_name": body.rep_name,
        "interaction_type": body.interaction_type,
        "location": body.location,
        "products_discussed": body.products_discussed,
        "topics_discussed": body.topics_discussed,
        "samples_given": body.samples_given,
        "notes": body.notes,
        "raw_transcript": body.raw_transcript
    })
    return result

@app.patch("/api/interactions/{interaction_id}")
def update_interaction(interaction_id: int, body: InteractionUpdate):
    from agents.hcp_agent import edit_interaction
    result = edit_interaction.invoke({
        "interaction_id": interaction_id,
        "field": body.field,
        "new_value": body.new_value
    })
    return result

@app.post("/api/interactions/{interaction_id}/analyze")
def analyze(interaction_id: int):
    from agents.hcp_agent import analyze_sentiment
    return analyze_sentiment.invoke({"interaction_id": interaction_id})


# ─── Follow-Up Endpoints ──────────────────────────────────────────────────────

@app.post("/api/followups")
def create_followup(body: FollowUpCreate):
    from agents.hcp_agent import schedule_followup
    return schedule_followup.invoke({
        "interaction_id": body.interaction_id,
        "hcp_id": body.hcp_id,
        "task": body.task,
        "due_date": body.due_date,
        "priority": body.priority
    })

@app.get("/api/followups")
def list_followups(db: Session = Depends(get_db)):
    fups = db.query(FollowUp).order_by(FollowUp.due_date.asc()).all()
    return [
        {
            "id": f.id, "interaction_id": f.interaction_id, "hcp_id": f.hcp_id,
            "task": f.task, "due_date": f.due_date.isoformat() if f.due_date else "",
            "priority": f.priority, "completed": bool(f.completed)
        }
        for f in fups
    ]


# ─── AI Chat Endpoint ─────────────────────────────────────────────────────────

@app.post("/api/chat")
def chat(body: ChatMessage):
    result = run_agent(body.message, body.history)
    return result


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total_interactions = db.query(Interaction).count()
    total_hcps = db.query(HCP).count()
    positive = db.query(Interaction).filter(Interaction.sentiment == "positive").count()
    pending_followups = db.query(FollowUp).filter(FollowUp.completed == 0).count()

    recent = db.query(Interaction).order_by(Interaction.date.desc()).limit(5).all()

    return {
        "total_interactions": total_interactions,
        "total_hcps": total_hcps,
        "positive_sentiment_pct": round((positive / total_interactions * 100) if total_interactions else 0, 1),
        "pending_followups": pending_followups,
        "recent_interactions": [
            {
                "id": i.id, "hcp_name": i.hcp_name,
                "interaction_type": i.interaction_type,
                "date": i.date.isoformat() if i.date else "",
                "sentiment": i.sentiment, "engagement_score": i.engagement_score
            }
            for i in recent
        ]
    }
