// ==================================================
// FILE: src/utils/coingecko-enhanced.js
// Enhanced CoinGecko data fetching for better signal analysis
// ==================================================

/**
 * Fetch extended market chart data from CoinGecko
 * This gives us enough data for proper SMA50 and other indicators
 * @param {string} tokenId - CoinGecko token ID
 * @param {number|string} days - Number of days or 'max'
 */
export const fetchExtendedMarketData = async (tokenId, days = 90) => {
  try {
    const daysParam = days === 'max' ? 'max' : days;
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${daysParam}&interval=${days <= 1 ? '' : 'daily'}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko market_chart error for ${tokenId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Extract prices and volumes
    const prices = data.prices?.map(p => p[1]) || [];
    const volumes = data.total_volumes?.map(v => v[1]) || [];
    const timestamps = data.prices?.map(p => p[0]) || [];
    
    // Calculate change percentage
    const change = prices.length > 1 
      ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 
      : 0;
    
    // Normalize to percentage (first price = 100)
    const normalized = prices.length > 0 
      ? prices.map(p => (p / prices[0]) * 100)
      : [];
    
    return {
      prices,
      volumes,
      timestamps,
      normalized,
      change,
      source: 'coingecko'
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko extended data for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Get OHLC data from CoinGecko (better for technical analysis and candlestick charts)
 * Available for: 1, 7, 14, 30, 90, 180, 365, max days
 * @param {string} tokenId - CoinGecko token ID
 * @param {number|string} days - Number of days or 'max'
 */
export const fetchOHLCData = async (tokenId, days = 90) => {
  try {
    const daysParam = days === 'max' ? 'max' : days;
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${daysParam}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko OHLC error for ${tokenId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // OHLC format: [timestamp, open, high, low, close]
    const prices = data.map(candle => candle[4]); // Close prices
    const highs = data.map(candle => candle[2]);
    const lows = data.map(candle => candle[3]);
    const timestamps = data.map(candle => candle[0]);
    
    // Calculate change percentage
    const change = prices.length > 1 
      ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 
      : 0;
    
    // Normalize to percentage (first price = 100)
    const normalized = prices.length > 0 
      ? prices.map(p => (p / prices[0]) * 100)
      : [];
    
    return {
      prices,
      highs,
      lows,
      timestamps,
      ohlc: data,
      normalized,
      change,
      source: 'coingecko-ohlc'
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko OHLC for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Fetch chart data for a specific time range
 * @param {string} tokenId - CoinGecko token ID
 * @param {string} timeRange - Time range ID ('24h', '7d', '1m', '3m', '1y', 'max')
 * @returns {Object} - { prices, ohlc, normalized, change, ... }
 */
export const fetchChartDataForRange = async (tokenId, timeRange = '7d') => {
  // Map time range to days
  const rangeToDays = {
    '24h': 1,
    '7d': 7,
    '1m': 30,
    '3m': 90,
    '1y': 365,
    'max': 'max'
  };
  
  const days = rangeToDays[timeRange] || 7;
  
  try {
    // Fetch both OHLC (for candlestick) and market data (for line chart)
    const [ohlcResult, marketResult] = await Promise.all([
      fetchOHLCData(tokenId, days),
      fetchExtendedMarketData(tokenId, days)
    ]);
    
    // Use OHLC if available, otherwise fall back to market data
    const primaryData = ohlcResult || marketResult;
    
    if (!primaryData) {
      console.warn(`No chart data available for ${tokenId} at range ${timeRange}`);
      return null;
    }
    
    return {
      ...primaryData,
      ohlc: ohlcResult?.ohlc || null,
      timeRange,
      days
    };
  } catch (error) {
    console.error(`Error fetching chart data for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Calculate RSI from price array
 */
const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return null;
  
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
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 10) / 10;
};

/**
 * Calculate all RSI values for historical data
 */
export const calculateHistoricalRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return [];
  
  const rsiValues = [];
  
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const rsi = calculateRSI(slice, period);
    if (rsi !== null) {
      rsiValues.push(rsi);
    }
  }
  
  return rsiValues;
};

/**
 * Get comprehensive token data for analysis
 * Tries multiple sources and methods
 */
export const getComprehensiveTokenData = async (tokenId, symbol) => {
  try {
    // Try to get OHLC data first (most reliable)
    let ohlcData = await fetchOHLCData(tokenId, 90);
    
    // If OHLC fails, try market_chart
    let marketData = null;
    if (!ohlcData) {
      marketData = await fetchExtendedMarketData(tokenId, 90);
    }
    
    // Use whichever worked
    const dataSource = ohlcData || marketData;
    
    if (!dataSource) {
      console.warn(`No extended data available for ${tokenId}`);
      return null;
    }
    
    // Calculate RSI history
    const rsiValues = calculateHistoricalRSI(dataSource.prices, 14);
    
    return {
      ...dataSource,
      rsiValues,
      dataPoints: dataSource.prices.length
    };
  } catch (error) {
    console.error(`Error getting comprehensive data for ${tokenId}:`, error);
    return null;
  }
};
