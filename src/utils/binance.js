// ==================================================
// FILE: src/utils/binance.js - Binance API Helper
// ==================================================

/**
 * Map CoinGecko symbol to Binance symbol
 */
const symbolMap = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
  'BNB': 'BNBUSDT',
  'XRP': 'XRPUSDT',
  'ADA': 'ADAUSDT',
  'DOGE': 'DOGEUSDT',
  'AVAX': 'AVAXUSDT',
  'DOT': 'DOTUSDT',
  'MATIC': 'MATICUSDT',
  'LINK': 'LINKUSDT',
  'UNI': 'UNIUSDT',
  'ATOM': 'ATOMUSDT',
  'LTC': 'LTCUSDT',
  'NEAR': 'NEARUSDT',
  'APT': 'APTUSDT',
  'ARB': 'ARBUSDT',
  'OP': 'OPUSDT',
  'SUI': 'SUIUSDT',
  'TON': 'TONUSDT',
  'PEPE': 'PEPEUSDT',
  'SHIB': 'SHIBUSDT',
  'WIF': 'WIFUSDT',
  'BONK': 'BONKUSDT',
  'JUP': 'JUPUSDT',
  'JTO': 'JTOUSDT',
  'PYTH': 'PYTHUSDT',
  'RNDR': 'RNDRUSDT',
  'FET': 'FETUSDT',
  'INJ': 'INJUSDT',
  'AAVE': 'AAVEUSDT',
  'MKR': 'MKRUSDT',
  'PENDLE': 'PENDLEUSDT',
};

/**
 * Get Binance symbol from token symbol
 */
export const getBinanceSymbol = (symbol) => {
  const cleanSymbol = symbol?.toUpperCase().trim();
  
  // Direct mapping
  if (symbolMap[cleanSymbol]) {
    return symbolMap[cleanSymbol];
  }
  
  // Try adding USDT
  return `${cleanSymbol}USDT`;
};

/**
 * Fetch historical klines (candlestick) data from Binance
 * Returns: Array of [timestamp, open, high, low, close, volume]
 */
export const fetchBinanceKlines = async (symbol, interval = '1h', limit = 168) => {
  try {
    const binanceSymbol = getBinanceSymbol(symbol);
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Binance API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  } catch (error) {
    console.error(`Error fetching Binance data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch current funding rate (for perpetual futures)
 */
export const fetchFundingRate = async (symbol) => {
  try {
    const binanceSymbol = getBinanceSymbol(symbol);
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${binanceSymbol}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        rate: parseFloat(data[0].fundingRate),
        time: data[0].fundingTime,
        symbol: binanceSymbol
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching funding rate for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch historical funding rates
 */
export const fetchHistoricalFundingRates = async (symbol, limit = 100) => {
  try {
    const binanceSymbol = getBinanceSymbol(symbol);
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${binanceSymbol}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return data.map(item => ({
      rate: parseFloat(item.fundingRate),
      time: item.fundingTime
    }));
  } catch (error) {
    console.error(`Error fetching funding history for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get enriched data for a token (prices + volumes + funding)
 */
export const getEnrichedTokenData = async (symbol, hours = 168) => {
  try {
    // Fetch price/volume data
    const klines = await fetchBinanceKlines(symbol, '1h', hours);
    
    if (!klines) {
      return null;
    }
    
    // Fetch funding rate
    const fundingRate = await fetchFundingRate(symbol);
    
    // Extract prices and volumes
    const prices = klines.map(k => k.close);
    const volumes = klines.map(k => k.volume);
    const timestamps = klines.map(k => k.timestamp);
    
    return {
      prices,
      volumes,
      timestamps,
      klines,
      fundingRate: fundingRate?.rate || null,
      fundingTime: fundingRate?.time || null
    };
  } catch (error) {
    console.error(`Error enriching data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Calculate all RSI values for historical data
 */
export const calculateHistoricalRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return [];
  
  const rsiValues = [];
  
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i + 1);
    const rsi = calculateSingleRSI(slice, period);
    rsiValues.push(rsi);
  }
  
  return rsiValues;
};

const calculateSingleRSI = (prices, period) => {
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    const change = changes[i] || 0;
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};
