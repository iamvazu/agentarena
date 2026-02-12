from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Pydantic models
class DNA(BaseModel):
    strategy: str
    rsi_period: int
    stop_loss_pct: float
    take_profit_pct: float

class AgentCreate(BaseModel):
    name: str
    dna: DNA

class AgentResponse(BaseModel):
    id: int
    name: str
    dna: DNA
    status: str
    generation: int
    current_cash: float
    current_positions: Optional[dict] = {}
    class Config:
        orm_mode = True

@app.get("/")
def read_root():
    return {"status": "Agent Arena API is running"}

@app.post("/agents/", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(name=agent.name, dna=agent.dna.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/agents/", response_model=List[AgentResponse])
def read_agents(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    agents = db.query(models.Agent).offset(skip).limit(limit).all()
    return agents

@app.get("/agents/{agent_id}", response_model=AgentResponse)
def read_agent(agent_id: int, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent

@app.post("/simulate/evolve")
def trigger_evolution():
    from worker import evolve_agents
    evolve_agents.delay()
    return {"message": "Evolution task queued"}

@app.post("/simulate/cycle")
def trigger_cycle():
    from worker import run_market_cycle
    run_market_cycle.delay()
    return {"message": "Market cycle task queued"}
