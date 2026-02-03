// ==================================================
// FILE: src/utils/okx.js - OKX API Integration
// ==================================================

/**
 * Map common symbols to OKX format
 * OKX uses format like BTC-USDT-SWAP, ETH-USDT-SWAP
 */
const getOKXSymbol = (symbol) => {
  const cleanSymbol = symbol?.toUpperCase().trim();
  
  // Remove common suffixes
  const normalized = cleanSymbol
    .replace(/USD$/, '')
    .replace(/USDT$/, '')
    .replace(/USDC$/, '');
  
  // OKX perpetual swaps use -USDT-SWAP format
  return `${normalized}-USDT-SWAP`;
};

/**
 * Fetch historical candlestick data from OKX
 * @param {string} symbol - Token symbol (e.g., 'BTC', 'ETH')
 * @param {string} bar - Timeframe ('1m', '1H', '1D', etc.)
 * @param {number} limit - Number of candles (max 300)
 * @returns {Object|null} - { prices, volumes, timestamps, klines }
 */
export const fetchOKXCandles = async (symbol, bar = '1H', limit = 300) => {
  try {
    const okxSymbol = getOKXSymbol(symbol);
    
    // OKX V5 API - Market data endpoint
    const url = `https://www.okx.com/api/v5/market/candles?instId=${okxSymbol}&bar=${bar}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`OKX API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if request was successful
    if (data.code !== '0' || !data.data) {
      console.warn(`OKX returned error for ${symbol}: ${data.msg}`);
      return null;
    }
    
    // OKX returns data in reverse chronological order
    const candles = data.data.reverse();
    
    // Parse candle data: [timestamp, open, high, low, close, volume, volumeCcy, volumeCcyQuote, confirm]
    const prices = candles.map(c => parseFloat(c[4])); // close price
    const volumes = candles.map(c => parseFloat(c[5])); // volume (in contracts)
    const volumesCcy = candles.map(c => parseFloat(c[6])); // volume (in base currency)
    const timestamps = candles.map(c => parseInt(c[0])); // timestamp
    
    const parsedKlines = candles.map(c => ({
      timestamp: parseInt(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
      volumeCcy: parseFloat(c[6]),
      volumeCcyQuote: parseFloat(c[7])
    }));
    
    return {
      prices,
      volumes: volumesCcy, // Use base currency volume
      timestamps,
      klines: parsedKlines,
      source: 'okx'
    };
  } catch (error) {
    console.error(`Error fetching OKX data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch current funding rate from OKX
 * @param {string} symbol - Token symbol
 * @returns {Object|null} - { rate, nextFundingTime, fundingTime, symbol }
 */
export const fetchOKXFundingRate = async (symbol) => {
  try {
    const okxSymbol = getOKXSymbol(symbol);
    
    const url = `https://www.okx.com/api/v5/public/funding-rate?instId=${okxSymbol}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== '0' || !data.data?.[0]) {
      return null;
    }
    
    const fundingData = data.data[0];
    
    return {
      rate: parseFloat(fundingData.fundingRate),
      nextFundingTime: parseInt(fundingData.nextFundingTime),
      fundingTime: parseInt(fundingData.fundingTime),
      symbol: okxSymbol,
      source: 'okx'
    };
  } catch (error) {
    console.error(`Error fetching OKX funding rate for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch historical funding rates from OKX
 * @param {string} symbol - Token symbol
 * @param {number} limit - Number of funding rate records (max 100)
 * @returns {Array|null} - Array of { rate, fundingTime, realizedRate }
 */
export const fetchOKXFundingHistory = async (symbol, limit = 100) => {
  try {
    const okxSymbol = getOKXSymbol(symbol);
    
    const url = `https://www.okx.com/api/v5/public/funding-rate-history?instId=${okxSymbol}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== '0' || !data.data) {
      return null;
    }
    
    return data.data.map(item => ({
      rate: parseFloat(item.fundingRate),
      fundingTime: parseInt(item.fundingTime),
      realizedRate: parseFloat(item.realizedRate)
    }));
  } catch (error) {
    console.error(`Error fetching OKX funding history for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get comprehensive token data from OKX
 * Fetches price history, volume, and funding rate
 * @param {string} symbol - Token symbol
 * @param {number} hours - Number of hours of history (default 168 = 7 days)
 * @returns {Object|null} - Complete dataset with prices, volumes, funding
 */
export const getOKXTokenData = async (symbol, hours = 168) => {
  try {
    // OKX allows max 300 candles per request
    const limit = Math.min(hours, 300);
    
    // Fetch hourly candles
    const candlesPromise = fetchOKXCandles(symbol, '1H', limit);
    
    // Fetch current funding rate
    const fundingPromise = fetchOKXFundingRate(symbol);
    
    // Wait for both requests
    const [candles, funding] = await Promise.all([candlesPromise, fundingPromise]);
    
    if (!candles) {
      return null;
    }
    
    return {
      prices: candles.prices,
      volumes: candles.volumes,
      timestamps: candles.timestamps,
      klines: candles.klines,
      fundingRate: funding?.rate || null,
      nextFundingTime: funding?.nextFundingTime || null,
      fundingTime: funding?.fundingTime || null,
      source: 'okx',
      dataPoints: candles.prices.length
    };
  } catch (error) {
    console.error(`Error getting OKX token data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Check if a symbol exists on OKX
 * @param {string} symbol - Token symbol
 * @returns {boolean} - True if symbol exists on OKX
 */
export const checkOKXSymbolExists = async (symbol) => {
  try {
    const okxSymbol = getOKXSymbol(symbol);
    
    const url = `https://www.okx.com/api/v5/market/ticker?instId=${okxSymbol}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.code === '0' && data.data?.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Get all available instruments (trading pairs) on OKX
 * Useful for checking what's tradeable
 * @param {string} instType - Instrument type ('SWAP', 'FUTURES', 'SPOT')
 * @returns {Array|null} - List of available instruments
 */
export const getOKXInstruments = async (instType = 'SWAP') => {
  try {
    const url = `https://www.okx.com/api/v5/public/instruments?instType=${instType}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== '0' || !data.data) {
      return null;
    }
    
    return data.data.map(inst => ({
      symbol: inst.instId,
      baseCcy: inst.baseCcy,
      quoteCcy: inst.quoteCcy,
      settleCcy: inst.settleCcy,
      contractVal: inst.ctVal,
      listing: inst.listTime,
      expiry: inst.expTime,
      state: inst.state
    }));
  } catch (error) {
    console.error('Error fetching OKX instruments:', error);
    return null;
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
