# Agent Arena (Stocks)

## Product Requirements Document (PRD)

### 1. Executive Summary

**Agent Arena** is a simulation environment that hosts 20 autonomous AI agents trading U.S. equities. The system utilizes a **Genetic Algorithm (GA)** to evolve the population: every Friday at market close, the bottom 4 performers are "terminated," and the top 4 are "cloned" with mutated parameters to maintain a constant population of 20.

### 2. Core Features & Requirements

* **The Paper Sandbox:** Integrates with Alpaca Brokerage API to execute trades in a zero-risk environment with real-time market data.
* **The Leaderboard:** A real-time dashboard tracking PnL, Win Rate, Sharpe Ratio, and Drawdown for all 20 agents.
* **Genetic Controller:** An automated service that ranks agents weekly, executes the "kill" logic, and spawns new agents.
* **Agent "DNA":** Each agent is defined by a JSON configuration (e.g., `rsi_period`, `max_position_size`, `stop_loss_pct`).
* **Audit Trail:** Persistent logging of every trade decision made by an AI agent for later analysis.

---

## 3. Technical Stack

| Layer | Technology | Why? |
| --- | --- | --- |
| **Backend** | **Python (FastAPI)** | Best-in-class libraries for finance (`Pandas`, `NumPy`) and AI orchestration. |
| **Trading API** | **Alpaca Markets API** | Offers free "Paper Trading" accounts with real-time WebSockets. |
| **Database** | **PostgreSQL + TimescaleDB** | Timescale is optimized for time-series data (price history and trade logs). |
| **Orchestration** | **Docker + Celery** | Each agent runs as a separate task/container to ensure isolation. |
| **Real-time UI** | **Next.js + Tailwind + Shadcn** | High-performance dashboard with Lucide icons for visual "health" indicators. |
| **AI Intelligence** | **LiteLLM / OpenAI SDK** | Model-agnostic layer to swap between GPT-4o, Gemini 1.5 Pro, or Claude 3.5. |

---

## 4. System Architecture & Implementation

### Phase 1: The Agent Factory

The architect implements a **BaseAgent** class. Each instance is initialized with a unique `genome_id`.

```python
class TradingAgent:
    def __init__(self, dna: dict):
        self.dna = dna # { "strategy": "momentum", "rsi_limit": 30, ... }
        self.portfolio_id = dna['id']

    def execute_logic(self, market_data):
        # AI processes data based on DNA
        if market_data['rsi'] < self.dna['rsi_limit']:
            self.place_order("BUY", "AAPL")

```

### Phase 2: The Evolution Loop (The "Judge")

A CRON job runs every Friday at 4:00 PM EST:

1. **Rank:** Fetch total account value for all 20 paper accounts.
2. **Purge:** Identify the 4 agents with the lowest ROI. Delete their Docker containers and database records.
3. **Crossover:** Identify the Top 4.
4. **Mutate:** Create 4 new DNA strings by taking a Top 4 agent's parameters and adding a random  variance (e.g., an RSI limit of 30 becomes 33).
5. **Deploy:** Spin up 4 new containers with the mutated DNA.

### Phase 3: The Dashboard

* **Visual Competition:** A "Heat Map" showing which agents are currently active in trades.
* **Survival Status:** A "Time Since Birth" counter for each agent to show which DNA is most resilient.

---

## 5. Success Metrics

* **Alpha Generation:** Does the average return of the 20 agents outperform the S&P 500 (SPY)?
* **Convergence:** Over 12 weeks, does the "winning DNA" stabilize around specific successful parameters?
* **System Latency:** Execution of trade logic must happen within <500ms of receiving a price candle.
