// ==================================================
// FILE: src/utils/coingecko-enhanced.js
// Enhanced CoinGecko data fetching for better signal analysis
// ==================================================

/**
 * Fetch market chart data from CoinGecko for a specific time range
 * @param {string} tokenId - CoinGecko token ID
 * @param {number|string} days - Number of days or 'max'
 */
export const fetchMarketChartData = async (tokenId, days = 7) => {
  try {
    const daysParam = days === 'max' ? 'max' : days;
    // For shorter periods, don't use interval to get more data points
    const interval = days === 'max' || days > 90 ? '&interval=daily' : '';
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${daysParam}${interval}`;
    
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
    
    return {
      prices,
      volumes,
      timestamps,
      source: 'coingecko'
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko chart data for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Fetch extended market chart data from CoinGecko (365 days)
 * This gives us enough data for proper SMA50 and other indicators
 */
export const fetchExtendedMarketData = async (tokenId, days = 90) => {
  return fetchMarketChartData(tokenId, days);
};

/**
 * Get OHLC data from CoinGecko (better for technical analysis and candlestick charts)
 * Available for: 1, 7, 14, 30, 90, 180, 365, max days
 * @param {string} tokenId - CoinGecko token ID
 * @param {number|string} days - Number of days or 'max'
 */
export const fetchOHLCData = async (tokenId, days = 90) => {
  try {
    // CoinGecko free API only supports specific day values for OHLC: 1, 7, 14, 30, 90, 180, 365, max
    const validDays = [1, 7, 14, 30, 90, 180, 365, 'max'];
    let daysParam = days === 'max' ? 'max' : days;
    
    // Map to closest valid value
    if (typeof daysParam === 'number' && !validDays.includes(daysParam)) {
      if (daysParam <= 1) daysParam = 1;
      else if (daysParam <= 7) daysParam = 7;
      else if (daysParam <= 14) daysParam = 14;
      else if (daysParam <= 30) daysParam = 30;
      else if (daysParam <= 90) daysParam = 90;
      else if (daysParam <= 180) daysParam = 180;
      else daysParam = 365;
    }
    
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${daysParam}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko OHLC error for ${tokenId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    
    // OHLC format: [timestamp, open, high, low, close]
    const prices = data.map(candle => candle[4]); // Close prices
    const highs = data.map(candle => candle[2]);
    const lows = data.map(candle => candle[3]);
    const timestamps = data.map(candle => candle[0]);
    
    return {
      prices,
      highs,
      lows,
      timestamps,
      ohlc: data,
      source: 'coingecko-ohlc'
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko OHLC for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Fetch chart data for a specific time range with fallback support
 * Returns both line chart data (prices) and candlestick data (OHLC)
 * @param {string} tokenId - CoinGecko token ID
 * @param {string} timeRange - Time range ID ('24h', '7d', '1m', '3m', '1y', 'max')
 * @param {Array} fallbackPrices - Fallback price data (e.g., from sparkline)
 */
export const fetchChartDataForRange = async (tokenId, timeRange = '7d', fallbackPrices = null) => {
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
    // Fetch both market chart (for line) and OHLC (for candlestick) in parallel
    const [marketData, ohlcData] = await Promise.all([
      fetchMarketChartData(tokenId, days).catch(() => null),
      fetchOHLCData(tokenId, days).catch(() => null)
    ]);
    
    // Use whatever data we got
    const prices = marketData?.prices || ohlcData?.prices || null;
    const ohlc = ohlcData?.ohlc || null;
    
    // If we have prices, calculate change
    if (prices && prices.length >= 2) {
      const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
      
      return {
        prices,
        ohlc,
        timestamps: marketData?.timestamps || ohlcData?.timestamps || [],
        volumes: marketData?.volumes || [],
        change,
        timeRange,
        days,
        source: 'api'
      };
    }
    
    // If API returned no data but we have fallback, use it
    if (fallbackPrices && fallbackPrices.length >= 2) {
      console.log(`Using fallback data for ${tokenId} (${timeRange})`);
      const change = ((fallbackPrices[fallbackPrices.length - 1] - fallbackPrices[0]) / fallbackPrices[0]) * 100;
      
      return {
        prices: fallbackPrices,
        ohlc: null,
        timestamps: [],
        volumes: [],
        change,
        timeRange,
        days,
        source: 'fallback'
      };
    }
    
    console.warn(`No chart data available for ${tokenId} at range ${timeRange}`);
    return null;
  } catch (error) {
    console.error(`Error fetching chart data for ${tokenId}:`, error);
    
    // Return fallback data if available
    if (fallbackPrices && fallbackPrices.length >= 2) {
      const change = ((fallbackPrices[fallbackPrices.length - 1] - fallbackPrices[0]) / fallbackPrices[0]) * 100;
      return {
        prices: fallbackPrices,
        ohlc: null,
        timestamps: [],
        volumes: [],
        change,
        timeRange,
        days,
        source: 'fallback'
      };
    }
    
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
