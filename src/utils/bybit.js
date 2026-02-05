// ==================================================
// FILE: src/utils/bybit.js - Bybit API Integration
// ==================================================

/**
 * Map common symbols to Bybit format
 * Bybit uses format like BTCUSDT, ETHUSDT, etc.
 */
const getBybitSymbol = (symbol) => {
  const cleanSymbol = symbol?.toUpperCase().trim();
  
  // Remove common suffixes
  const normalized = cleanSymbol
    .replace(/USD$/, '')
    .replace(/USDT$/, '')
    .replace(/USDC$/, '');
  
  // Bybit uses USDT pairs
  return `${normalized}USDT`;
};

/**
 * Fetch historical klines (OHLCV) from Bybit
 * @param {string} symbol - Token symbol (e.g., 'BTC', 'ETH')
 * @param {string} interval - Timeframe ('1' = 1min, '60' = 1hour, 'D' = 1day)
 * @param {number} limit - Number of candles (max 200 per request)
 * @returns {Object|null} - { prices, volumes, timestamps, klines }
 */
export const fetchBybitKlines = async (symbol, interval = '60', limit = 200) => {
  try {
    const bybitSymbol = getBybitSymbol(symbol);
    
    // Bybit V5 API - Linear (USDT) perpetual futures
    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${bybitSymbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Bybit API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if request was successful
    if (data.retCode !== 0 || !data.result?.list) {
      console.warn(`Bybit returned error for ${symbol}: ${data.retMsg}`);
      return null;
    }
    
    // Bybit returns data in reverse chronological order
    const klines = data.result.list.reverse();
    
    // Parse kline data: [startTime, open, high, low, close, volume, turnover]
    const prices = klines.map(k => parseFloat(k[4])); // close price
    const volumes = klines.map(k => parseFloat(k[5])); // volume
    const timestamps = klines.map(k => parseInt(k[0])); // timestamp
    
    const parsedKlines = klines.map(k => ({
      timestamp: parseInt(k[0]),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      turnover: parseFloat(k[6])
    }));
    
    return {
      prices,
      volumes,
      timestamps,
      klines: parsedKlines,
      source: 'bybit'
    };
  } catch (error) {
    console.error(`Error fetching Bybit data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch current funding rate from Bybit
 * @param {string} symbol - Token symbol
 * @returns {Object|null} - { rate, nextFundingTime, symbol }
 */
export const fetchBybitFundingRate = async (symbol) => {
  try {
    const bybitSymbol = getBybitSymbol(symbol);
    
    const url = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybitSymbol}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.retCode !== 0 || !data.result?.list?.[0]) {
      return null;
    }
    
    const ticker = data.result.list[0];
    
    return {
      rate: parseFloat(ticker.fundingRate),
      nextFundingTime: parseInt(ticker.nextFundingTime),
      symbol: bybitSymbol,
      source: 'bybit'
    };
  } catch (error) {
    console.error(`Error fetching Bybit funding rate for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch historical funding rates from Bybit
 * @param {string} symbol - Token symbol
 * @param {number} limit - Number of funding rate records (max 200)
 * @returns {Array|null} - Array of { rate, fundingTime }
 */
export const fetchBybitFundingHistory = async (symbol, limit = 100) => {
  try {
    const bybitSymbol = getBybitSymbol(symbol);
    
    const url = `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${bybitSymbol}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.retCode !== 0 || !data.result?.list) {
      return null;
    }
    
    return data.result.list.map(item => ({
      rate: parseFloat(item.fundingRate),
      fundingTime: parseInt(item.fundingRateTimestamp)
    }));
  } catch (error) {
    console.error(`Error fetching Bybit funding history for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get comprehensive token data from Bybit
 * Fetches price history, volume, and funding rate in one go
 * @param {string} symbol - Token symbol
 * @param {number} hours - Number of hours of history (default 168 = 7 days)
 * @returns {Object|null} - Complete dataset with prices, volumes, funding
 */
export const getBybitTokenData = async (symbol, hours = 168) => {
  try {
    let klinesPromise;
    
    // For longer timeframes (> 200 hours), use daily candles
    if (hours > 200) {
      const days = Math.min(Math.ceil(hours / 24), 200); // Max 200 daily candles
      klinesPromise = fetchBybitKlines(symbol, 'D', days);
    } else {
      // Use hourly candles for shorter timeframes
      klinesPromise = fetchBybitKlines(symbol, '60', Math.min(hours, 200));
    }
    
    // Fetch current funding rate
    const fundingPromise = fetchBybitFundingRate(symbol);
    
    // Wait for both requests
    const [klines, funding] = await Promise.all([klinesPromise, fundingPromise]);
    
    if (!klines) {
      return null;
    }
    
    return {
      prices: klines.prices,
      volumes: klines.volumes,
      timestamps: klines.timestamps,
      klines: klines.klines,
      fundingRate: funding?.rate || null,
      nextFundingTime: funding?.nextFundingTime || null,
      source: 'bybit',
      dataPoints: klines.prices.length
    };
  } catch (error) {
    console.error(`Error getting Bybit token data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Check if a symbol exists on Bybit
 * @param {string} symbol - Token symbol
 * @returns {boolean} - True if symbol exists on Bybit
 */
export const checkBybitSymbolExists = async (symbol) => {
  try {
    const bybitSymbol = getBybitSymbol(symbol);
    
    const url = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybitSymbol}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.retCode === 0 && data.result?.list?.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Calculate RSI from price array
 */
export const calculateHistoricalRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return [];
  
  const rsiValues = [];
  
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const rsi = calculateSingleRSI(slice, period);
    if (rsi !== null) {
      rsiValues.push(rsi);
    }
  }
  
  return rsiValues;
};

const calculateSingleRSI = (prices, period) => {
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  if (changes.length < period) return null;
  
  const recentChanges = changes.slice(-period * 2);
  
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    const change = recentChanges[i] || 0;
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  for (let i = period; i < recentChanges.length; i++) {
    const change = recentChanges[i] || 0;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};
