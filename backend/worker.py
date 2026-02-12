from celery import Celery
import os
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from agent import TradingAgent
from alpaca_client import AlpacaClient
import datetime
import random

celery = Celery(__name__)
# Standard Heroku Redis URL is REDIS_URL
redis_url = os.environ.get("REDIS_URL", os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379"))
celery.conf.broker_url = redis_url
celery.conf.result_backend = redis_url

alpaca = AlpacaClient()

@celery.task(name="run_market_cycle")
def run_market_cycle():
    """
    Main loop:
    1. Fetch active agents
    2. Fetch market data for target symbols
    3. Run agent logic
    4. Save state & trades
    """
    db: Session = SessionLocal()
    try:
        # 1. Fetch Agents
        agents = db.query(models.Agent).filter(models.Agent.status == "active").all()
        if not agents:
            print("No active agents found.")
            return

        # 2. Market Data (Mocking a universe for now)
        universe = ["AAPL", "TSLA", "SPY", "NVDA", "AMZN"]
        market_snapshot = {}
        
        for symbol in universe:
            price = alpaca.get_latest_price(symbol)
            if price is None:
                 # Fallback if API fails or is mock
                 price = random.uniform(100, 200) 
            
            # TODO: Calculate indicators (RSI, SMA) here using pandas/TA-Lib
            # For now, we mock RSI and SMA for demonstration
            market_snapshot[symbol] = {
                "symbol": symbol,
                "price": price,
                "rsi": random.uniform(20, 80),
                "sma_20": price * random.uniform(0.95, 1.05),
                "sma_50": price * random.uniform(0.90, 1.10)
            }

        # 3. Agent Execution
        for db_agent in agents:
            # Initialize Logic Agent with DB State
            logic_agent = TradingAgent(db_agent.id, db_agent.dna, alpaca_client=alpaca)
            logic_agent.portfolio_value = db_agent.current_cash
            logic_agent.positions = dict(db_agent.current_positions) if db_agent.current_positions else {}
            
            # Run logic against every symbol in universe
            for symbol, data in market_snapshot.items():
                logic_agent.execute_logic(data)
            
            # 4. Persistence
            # Save Trades
            if logic_agent.pending_trades:
                for t in logic_agent.pending_trades:
                    db_trade = models.Trade(
                        agent_id=db_agent.id,
                        symbol=t['symbol'],
                        side=t['side'],
                        qty=t['qty'],
                        price=t['price'],
                        timestamp=t['timestamp']
                    )
                    db.add(db_trade)
            
            # Save State
            db_agent.current_cash = logic_agent.portfolio_value
            db_agent.current_positions = logic_agent.positions
            
            # Snapshot performance (optional, maybe once per day or hour)
            # db_snapshot = models.PortfolioSnapshot(...)
            # db.add(db_snapshot)

        db.commit()
        print(f"Market cycle completed for {len(agents)} agents.")

    except Exception as e:
        print(f"Error in market cycle: {e}")
        db.rollback()
    finally:
        db.close()

@celery.task(name="evolve_agents")
def evolve_agents():
    """
    Weekly Evolution Loop:
    1. Rank agents by Portfolio Value
    2. Kill bottom 4
    3. Breed top 4 (Mutation)
    4. Reset for next epoch (optional, or keep running)
    """
    db: Session = SessionLocal()
    try:
        # 1. Rank
        agents = db.query(models.Agent).filter(models.Agent.status == "active").all()
        if len(agents) < 10:
            print("Not enough agents to evolve. Need at least 10.")
            return

        # Sort by current cash/value (Descending)
        # Note: In real app, consider open positions value too
        ranked_agents = sorted(agents, key=lambda a: a.current_cash, reverse=True)
        
        top_performers = ranked_agents[:4]
        bottom_performers = ranked_agents[-4:]

        print(f"Top Agent: {top_performers[0].name} (${top_performers[0].current_cash})")
        print(f"Worst Agent: {bottom_performers[0].name} (${bottom_performers[0].current_cash})")

        # 2. Purge (Kill Bottom 4)
        for agent in bottom_performers:
            agent.status = "terminated"
            print(f"Terminating Agent {agent.id}...")

        # 3. Reproduce (Mutate Top 4)
        generation_id = top_performers[0].generation + 1
        
        for parent in top_performers:
            # Create a child with mutated DNA
            new_dna = mutate_dna(parent.dna)
            child_name = f"{parent.name.split('_')[0]}_Gen{generation_id}_{random.randint(100,999)}"
            
            new_agent = models.Agent(
                name=child_name,
                dna=new_dna,
                generation=generation_id,
                current_cash=100000.0, # Reset cash for fair comparison next round? 
                                       # Or inheritance? implementing reset for now per PRD "spawn new agents" implications
                current_positions={}
            )
            db.add(new_agent)
            print(f"Born: {child_name} from parent {parent.id}")
            
        db.commit()
    except Exception as e:
        print(f"Evolution failed: {e}")
        db.rollback()
    finally:
        db.close()

def mutate_dna(dna: dict) -> dict:
    """Randomly adjust DNA parameters"""
    new_dna = dna.copy()
    
    # Mutate RSI
    if 'rsi_limit' in new_dna:
        change = random.choice([-2, -1, 1, 2])
        new_dna['rsi_limit'] = max(10, min(90, new_dna['rsi_limit'] + change))
        
    # Mutate Stop Loss
    if 'stop_loss_pct' in new_dna:
        factor = random.uniform(0.9, 1.1)
        new_dna['stop_loss_pct'] = round(new_dna['stop_loss_pct'] * factor, 3)
        
    return new_dna
