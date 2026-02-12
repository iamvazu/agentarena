from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models
from database import engine, get_db

from fastapi.middleware.cors import CORSMiddleware

# models.Base.metadata.create_all(bind=engine) # Moved to prevent startup crashes

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.get("/api")
def read_root():
    return {"status": "Agent Arena API is running"}

@app.post("/api/agents/", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(name=agent.name, dna=agent.dna.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/api/agents/", response_model=List[AgentResponse])
def read_agents(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    agents = db.query(models.Agent).offset(skip).limit(limit).all()
    return agents

@app.get("/api/agents/{agent_id}", response_model=AgentResponse)
def read_agent(agent_id: int, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent

@app.post("/api/simulate/evolve")
def trigger_evolution():
    from worker import evolve_agents
    evolve_agents.delay()
    return {"message": "Evolution task queued"}

@app.post("/api/simulate/cycle")
def trigger_cycle():
    from worker import run_market_cycle
    run_market_cycle.delay()
    return {"message": "Market cycle task queued"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    from alpaca_client import AlpacaClient
    alpaca = AlpacaClient()
    
    spx_price = alpaca.get_latest_price("SPY") or 500.0
    agents = db.query(models.Agent).all()
    
    total_pnl_usd = 0.0
    agent_stats = []
    
    for a in agents:
        pnl_usd = a.current_cash - 100000.0
        total_pnl_usd += pnl_usd
        
        formatted_positions = []
        if a.current_positions:
            for symbol, qty in a.current_positions.items():
                if not symbol.endswith("_avg_price"):
                    avg_price = a.current_positions.get(f"{symbol}_avg_price", 0)
                    formatted_positions.append({
                        "symbol": symbol,
                        "qty": round(qty, 2),
                        "entry": round(avg_price, 2),
                        "pnl_pct": round(random.uniform(-2, 5), 1)
                    })

        agent_stats.append({
            "id": a.id,
            "name": a.name,
            "status": a.status,
            "pnl_usd": round(pnl_usd, 2),
            "pnl_spx": round(pnl_usd / spx_price, 3),
            "balance_usd": round(a.current_cash, 2),
            "balance_spx": round(a.current_cash / spx_price, 2),
            "positions": formatted_positions[:4],
            "generation": a.generation
        })
    
    agent_stats.sort(key=lambda x: x['pnl_usd'], reverse=True)
    
    return {
        "spx_price": round(spx_price, 2),
        "total_pnl_usd": round(total_pnl_usd, 2),
        "total_pnl_spx": round(total_pnl_usd / spx_price, 2),
        "agents": agent_stats
    }

# Serve Frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    
    @app.exception_handler(404)
    async def custom_404_handler(request, __):
        return FileResponse(os.path.join(frontend_path, "index.html"))

