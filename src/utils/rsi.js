// ==================================================
// FILE: src/utils/rsi.js - Canonical RSI Calculation
// Single source of truth for RSI calculations
// ==================================================

/**
 * Calculate RSI using Wilder's Smoothed Moving Average method
 * This is the industry-standard RSI calculation used by TradingView, etc.
 * 
 * @param {number[]} prices - Array of prices (oldest first)
 * @param {number} period - RSI period (default 14)
 * @returns {number|null} - RSI value (0-100) or null if insufficient data
 */
export const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return null;
  
  // Calculate price changes
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  if (changes.length < period) return null;
  
  // Use recent changes for calculation (2x period for smoothing accuracy)
  const recentChanges = changes.slice(-period * 2);
  
  // Initial averages (simple average for first period)
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
  
  // Wilder's smoothing for remaining periods
  for (let i = period; i < recentChanges.length; i++) {
    const change = recentChanges[i] || 0;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  // Handle edge case where there are no losses
  if (avgLoss === 0) return 100;
  
  // Calculate RS and RSI
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Round to 1 decimal place
  return Math.round(rsi * 10) / 10;
};

/**
 * Calculate RSI values for entire price history
 * Returns an array of RSI values aligned with price data
 * 
 * @param {number[]} prices - Array of prices (oldest first)
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} - Array of RSI values (first `period` values will be missing)
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
 * Calculate a single RSI value from the most recent prices
 * Convenience function for real-time updates
 * 
 * @param {number[]} prices - Array of prices (oldest first, minimum period+1 values)
 * @param {number} period - RSI period (default 14)
 * @returns {number|null} - Current RSI value or null
 */
export const calculateCurrentRSI = (prices, period = 14) => {
  return calculateRSI(prices, period);
};
