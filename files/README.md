# 🏥 PharmaRep – AI-First HCP CRM

A full-stack AI-powered Customer Relationship Management system for pharmaceutical field representatives, built with **React + Redux**, **FastAPI**, **LangGraph**, and **Groq LLMs**.

---

## 📁 Project Structure

```
crm-hcp/
├── backend/
│   ├── main.py                  # FastAPI app & all REST endpoints
│   ├── requirements.txt
│   ├── .env                     # ← Add your GROQ_API_KEY here
│   ├── db/
│   │   └── database.py          # SQLAlchemy models + SQLite/Postgres setup
│   └── agents/
│       └── hcp_agent.py         # LangGraph agent + 5 tools
└── frontend/
    ├── package.json
    ├── .env                     # REACT_APP_API_URL
    └── src/
        ├── App.js               # Router + sidebar layout
        ├── index.js             # Redux Provider entry point
        ├── index.css            # Global styles (Inter font, design tokens)
        ├── store/
        │   └── index.js         # Redux Toolkit slices + async thunks
        ├── pages/
        │   ├── Dashboard.js     # Stats + recent interactions
        │   ├── HCPList.js       # HCP search & profile cards
        │   ├── LogInteraction.js# ⭐ Core screen – Form + AI result view
        │   ├── ChatLog.js       # Conversational AI chat interface
        │   └── FollowUps.js     # Follow-up task tracker
        └── components/
            └── EditModal.js     # Edit interaction modal (Tool 2)
```

---

## ⚙️ Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Groq API Key** → https://console.groq.com/

---

## 🚀 Quick Start

### Step 1 – Configure your Groq API Key

Open `backend/.env` and set:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
DATABASE_URL=sqlite:///./crm_hcp.db
```

> SQLite is used by default (no setup needed). Switch to Postgres by changing `DATABASE_URL`.

---

### Step 2 – Start the Backend

```bash
cd backend
python -m venv venv

# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at → **http://localhost:8000**  
API docs → **http://localhost:8000/docs**

---

### Step 3 – Start the Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at → **http://localhost:3000**

---

## 🤖 LangGraph Agent & 5 Tools

All tools are defined in `backend/agents/hcp_agent.py` and exposed via FastAPI.

| # | Tool | LLM Model | Description |
|---|------|-----------|-------------|
| 1 | `log_interaction` | `gemma2-9b-it` | Logs HCP interaction; uses LLM for summarization, sentiment & engagement score |
| 2 | `edit_interaction` | `gemma2-9b-it` | Edits any field of an existing interaction; re-generates AI summary if content changes |
| 3 | `search_hcp` | _(DB query)_ | Searches HCP profiles by name/specialty/hospital; returns recent interaction history |
| 4 | `schedule_followup` | `gemma2-9b-it` | Creates follow-up tasks; uses LLM to enrich vague task descriptions |
| 5 | `analyze_sentiment` | `llama-3.3-70b-versatile` | Deep sentiment analysis with confidence score, key signals & rep coaching tip |

---

## 🖥️ Features

### Log Interaction Screen (Core)
- **Structured Form mode** – Fill fields manually; AI auto-generates summary, sentiment, and engagement score via Groq
- **AI Chat mode** – Conversational interface powered by LangGraph; log interactions using natural language
- **Edit modal** – Modify any field post-submission (Tool 2)
- **Deep Analyze** – Run deeper sentiment analysis using `llama-3.3-70b-versatile` (Tool 5)

### Dashboard
- Total interactions, HCP count, positive sentiment %, pending follow-ups
- Recent activity table with engagement score bars

### HCP Directory
- Search by name, specialty, hospital
- Tier classification (A/B/C)

### AI Chat Interface
- Full LangGraph agent with tool-calling
- Suggested prompts for quick testing
- Shows which tools were invoked per response

### Follow-Ups
- Pending / completed task tracker
- Priority levels (high/medium/low) with overdue highlighting

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hcps` | List all HCPs |
| GET | `/api/hcps/{id}` | HCP detail + interactions |
| GET | `/api/interactions` | List all interactions |
| POST | `/api/interactions` | Create (calls Tool 1) |
| PATCH | `/api/interactions/{id}` | Edit field (calls Tool 2) |
| POST | `/api/interactions/{id}/analyze` | Sentiment analysis (Tool 5) |
| GET | `/api/followups` | List follow-ups |
| POST | `/api/followups` | Create follow-up (Tool 4) |
| POST | `/api/chat` | LangGraph agent chat |
| GET | `/api/dashboard` | Dashboard stats |

---

## 🧠 Architecture Flow

```
User (React UI)
    │
    ▼
Redux Store (state management)
    │  axios calls
    ▼
FastAPI (main.py)
    │
    ├── Direct DB queries (HCP list, dashboard)
    │
    └── LangGraph Agent (hcp_agent.py)
            │
            ├── Tool 1: log_interaction   → SQLite/Postgres + Groq gemma2-9b-it
            ├── Tool 2: edit_interaction  → SQLite/Postgres + Groq gemma2-9b-it
            ├── Tool 3: search_hcp        → SQLite/Postgres
            ├── Tool 4: schedule_followup → SQLite/Postgres + Groq gemma2-9b-it
            └── Tool 5: analyze_sentiment → SQLite/Postgres + Groq llama-3.3-70b
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Redux Toolkit, React Router v6 |
| Styling | CSS-in-JS with Google Inter font |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| AI Framework | LangGraph 0.1, LangChain |
| LLMs | Groq `gemma2-9b-it`, `llama-3.3-70b-versatile` |
| Database | SQLite (default) / PostgreSQL |
| ORM | SQLAlchemy 2.0 |

---

## 📝 Notes

- The app auto-seeds 5 HCPs on first run (Chennai-based doctors)
- SQLite DB file `crm_hcp.db` is created automatically in the `backend/` folder
- All AI calls go directly to Groq; no OpenAI dependency
- CORS is open for local development; restrict in production
