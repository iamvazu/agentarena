import logging
import random
import datetime

logger = logging.getLogger(__name__)

class TradingAgent:
    def __init__(self, agent_id, dna, alpaca_client=None):
        self.agent_id = agent_id
        self.dna = dna
        self.alpaca = alpaca_client
        self.portfolio_value = 100000.0  # Default, should be overwritten by db state
        self.positions = {} # {symbol: qty}
        self.pending_trades = [] # List of dicts to be saved to DB

    def execute_logic(self, market_data):
        """
        Executes trading logic based on market data and DNA.
        market_data: dict containing current price, extended indicators.
        """
        symbol = market_data.get('symbol')
        price = market_data.get('price')
        
        if not symbol or not price:
            return

        # Extract DNA parameters with defaults
        strategy = self.dna.get('strategy', 'mean_reversion')
        rsi_period = self.dna.get('rsi_period', 14)
        stop_loss_pct = self.dna.get('stop_loss_pct', 0.05)
        take_profit_pct = self.dna.get('take_profit_pct', 0.10)
        max_pos_size = self.dna.get('max_position_size', 0.1)
        
        # Check active positions for stop-loss / take-profit
        current_qty = self.positions.get(symbol, 0)
        if current_qty > 0:
            avg_price = self.positions.get(f"{symbol}_avg_price", price) # Simplify for now
            pnl_pct = (price - avg_price) / avg_price
            
            if pnl_pct <= -stop_loss_pct:
                logger.info(f"Agent {self.agent_id} STOP LOSS triggered on {symbol}")
                self.place_order("SELL", symbol, price, 1.0) # Sell all
                return
            elif pnl_pct >= take_profit_pct:
                logger.info(f"Agent {self.agent_id} TAKE PROFIT triggered on {symbol}")
                self.place_order("SELL", symbol, price, 1.0) # Sell all
                return

        # Strategy Execution
        if strategy == 'mean_reversion':
            rsi = market_data.get('rsi')
            rsi_limit_low = self.dna.get('rsi_limit', 30)
            rsi_limit_high = 100 - rsi_limit_low
            
            if rsi is not None:
                if rsi < rsi_limit_low and current_qty == 0:
                    self.place_order("BUY", symbol, price, max_pos_size)
                elif rsi > rsi_limit_high and current_qty > 0:
                    self.place_order("SELL", symbol, price, 1.0) # Sell all

        elif strategy == 'momentum':
            # Simple Moving Average Crossover Logic
            sma_short = market_data.get('sma_20')
            sma_long = market_data.get('sma_50')
            
            if sma_short and sma_long:
                if sma_short > sma_long and current_qty == 0:
                     self.place_order("BUY", symbol, price, max_pos_size)
                elif sma_short < sma_long and current_qty > 0:
                     self.place_order("SELL", symbol, price, 1.0)

    def place_order(self, side, symbol, price, size_pct):
        target_value = self.portfolio_value * size_pct
        
        if side == "BUY":
            qty = int(target_value / price)
            if qty <= 0: return
            
            cost = qty * price
            if self.portfolio_value >= cost:
                self.portfolio_value -= cost
                old_qty = self.positions.get(symbol, 0)
                # Weighted average price update (simplified)
                # In real scenario, track lots.
                self.positions[symbol] = old_qty + qty
                # simple avg price tracking for PnL calculation
                self.positions[f"{symbol}_avg_price"] = price 
                logger.info(f"Agent {self.agent_id} BUY {qty} {symbol} @ {price}")
                self.pending_trades.append({
                    "symbol": symbol,
                    "side": "BUY",
                    "qty": qty,
                    "price": price,
                    "timestamp": datetime.datetime.utcnow()
                })

        elif side == "SELL":
            current_qty = self.positions.get(symbol, 0)
            qty_to_sell = int(current_qty * size_pct) # size_pct=1.0 means sell all
            if qty_to_sell <= 0: return

            if current_qty >= qty_to_sell:
                self.positions[symbol] -= qty_to_sell
                self.portfolio_value += qty_to_sell * price
                logger.info(f"Agent {self.agent_id} SELL {qty_to_sell} {symbol} @ {price}")
                self.pending_trades.append({
                    "symbol": symbol,
                    "side": "SELL",
                    "qty": qty_to_sell,
                    "price": price,
                    "timestamp": datetime.datetime.utcnow()
                })
                
                if self.positions[symbol] == 0:
                    del self.positions[symbol]
