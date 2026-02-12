from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    dna = Column(JSON)  # Stores strategy parameters like RSI period, etc.
    status = Column(String, default="active")  # active, terminated
    generation = Column(Integer, default=1)
    
    # Portfolio State
    current_cash = Column(Float, default=100000.0)
    current_positions = Column(JSON, default={}) # { "AAPL": 10, "AAPL_avg_price": 150.0 }

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    trades = relationship("Trade", back_populates="agent")
    snapshots = relationship("PortfolioSnapshot", back_populates="agent")

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    symbol = Column(String, index=True)
    side = Column(String)  # BUY, SELL
    qty = Column(Float)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="trades")

class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    total_equity = Column(Float)
    cash = Column(Float)
    pnl = Column(Float)
    
    agent = relationship("Agent", back_populates="snapshots")
