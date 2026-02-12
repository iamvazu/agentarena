import os
from alpaca_trade_api.rest import REST, TimeFrame

class AlpacaClient:
    def __init__(self):
        self.api_key = os.getenv("ALPACA_API_KEY")
        self.secret_key = os.getenv("ALPACA_SECRET_KEY")
        self.base_url = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
        
        if self.api_key and self.secret_key:
            self.api = REST(self.api_key, self.secret_key, self.base_url, api_version='v2')
        else:
            self.api = None
            print("Alpaca API credentials not found. Running in mock mode.")

    def get_latest_price(self, symbol):
        if self.api:
            try:
                trade = self.api.get_latest_trade(symbol)
                return trade.price
            except Exception as e:
                print(f"Error fetching price for {symbol}: {e}")
                return None
        return 150.0 # Mock price

    def get_bars(self, symbol, timeframe=TimeFrame.Day, limit=100):
        if self.api:
            try:
                bars = self.api.get_bars(symbol, timeframe, limit=limit).df
                return bars
            except Exception as e:
                print(f"Error fetching bars for {symbol}: {e}")
                return None
        return None
