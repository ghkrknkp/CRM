from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm_hcp.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class InteractionType(str, enum.Enum):
    visit = "visit"
    call = "call"
    email = "email"
    conference = "conference"
    webinar = "webinar"


class InteractionStatus(str, enum.Enum):
    draft = "draft"
    logged = "logged"
    reviewed = "reviewed"


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    specialty = Column(String(100))
    hospital = Column(String(200))
    email = Column(String(150))
    phone = Column(String(30))
    city = Column(String(100))
    state = Column(String(50))
    npi_number = Column(String(20))
    tier = Column(String(10), default="B")  # A, B, C
    created_at = Column(DateTime, default=datetime.utcnow)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, nullable=False)
    hcp_name = Column(String(200))
    rep_name = Column(String(200))
    interaction_type = Column(String(50), default="visit")
    date = Column(DateTime, default=datetime.utcnow)
    location = Column(String(300))
    products_discussed = Column(Text)       # comma-separated
    topics_discussed = Column(Text)
    samples_given = Column(Text)
    next_steps = Column(Text)
    notes = Column(Text)
    ai_summary = Column(Text)
    sentiment = Column(String(20))          # positive, neutral, negative
    engagement_score = Column(Float, default=0.0)
    status = Column(String(30), default="logged")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    raw_transcript = Column(Text)           # original chat transcript if via chat


class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, nullable=False)
    hcp_id = Column(Integer, nullable=False)
    task = Column(Text)
    due_date = Column(DateTime)
    priority = Column(String(20), default="medium")
    completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    # Seed some HCPs
    db = SessionLocal()
    if db.query(HCP).count() == 0:
        hcps = [
            HCP(name="Dr. Priya Sharma", specialty="Cardiology", hospital="Apollo Hospitals", 
                email="priya.sharma@apollo.in", phone="+91-98765-43210", city="Chennai", state="Tamil Nadu",
                npi_number="1234567890", tier="A"),
            HCP(name="Dr. Rajesh Kumar", specialty="Endocrinology", hospital="Fortis Malar", 
                email="r.kumar@fortis.in", phone="+91-98765-12345", city="Chennai", state="Tamil Nadu",
                npi_number="2345678901", tier="A"),
            HCP(name="Dr. Anita Desai", specialty="Oncology", hospital="MIOT International", 
                email="a.desai@miot.in", phone="+91-97654-32109", city="Chennai", state="Tamil Nadu",
                npi_number="3456789012", tier="B"),
            HCP(name="Dr. Suresh Menon", specialty="Neurology", hospital="Sri Ramachandra", 
                email="s.menon@src.edu.in", phone="+91-96543-21098", city="Chennai", state="Tamil Nadu",
                npi_number="4567890123", tier="B"),
            HCP(name="Dr. Kavitha Nair", specialty="Pulmonology", hospital="Global Hospitals", 
                email="k.nair@global.in", phone="+91-95432-10987", city="Chennai", state="Tamil Nadu",
                npi_number="5678901234", tier="C"),
        ]
        db.add_all(hcps)
        db.commit()
    db.close()
