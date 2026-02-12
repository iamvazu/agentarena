from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import random
import os

# Heroku DATABASE_URL patch
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    os.environ["DATABASE_URL"] = DATABASE_URL

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if agents already exist
        if db.query(models.Agent).count() > 0:
            print("Database already has agents. Skipping seed.")
            return

        names = [
            "Echo", "Sage", "Voss", "Axel", "Nova", "Ivy", "Skye", "Kade", 
            "Lynx", "Nico", "Juno", "Orion", "Vera", "Cato", "Rune", "Zara",
            "Rhea", "Milo", "Talon", "Nyx"
        ]

        strategies = ["momentum", "mean_reversion"]

        for name in names:
            dna = {
                "strategy": random.choice(strategies),
                "rsi_limit": random.randint(20, 35),
                "rsi_period": random.randint(10, 20),
                "stop_loss_pct": round(random.uniform(0.02, 0.08), 3),
                "take_profit_pct": round(random.uniform(0.05, 0.15), 3),
                "max_position_size": 0.1
            }
            
            agent = models.Agent(
                name=f"{name}_Alpha",
                dna=dna,
                generation=1,
                current_cash=random.uniform(95000, 105000), # Some starting variance
                current_positions={}
            )
            db.add(agent)
        
        db.commit()
        print("Successfully seeded 20 agents.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
