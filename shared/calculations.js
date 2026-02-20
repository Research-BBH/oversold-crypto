// ==================================================
// FILE: shared/calculations.js
// Shared technical analysis calculations
// Used by both frontend (src/utils/signals.js) and API (api/crypto-enhanced.js)
// ==================================================

/**
 * Calculate Relative Strength Index (RSI)
 * Uses Wilder's smoothing method (exponential moving average)
 * @param {number[]} prices - Array of prices (oldest to newest)
 * @param {number} period - RSI period (default 14)
 * @returns {number|null} RSI value (0-100) or null if insufficient data
 */
export const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  if (changes.length < period) return null;
  
  const recentChanges = changes.slice(-period * 2);
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // Initial SMA for first period
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
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 10) / 10;
};

/**
 * Calculate Simple Moving Average (SMA)
 * @param {number[]} prices - Array of prices
 * @param {number} period - SMA period
 * @returns {number|null} SMA value or null if insufficient data
 */
export const calculateSMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

/**
 * Calculate Bollinger Bands
 * @param {number[]} prices - Array of prices
 * @param {number} period - Period for SMA calculation (default 20)
 * @param {number} stdDev - Number of standard deviations (default 2)
 * @returns {{upper: number, middle: number, lower: number}|null}
 */
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  if (!prices || prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  
  // Calculate standard deviation
  const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev)
  };
};

/**
 * Calculate volume ratio (current vs average)
 * @param {number[]} volumes - Array of volume values
 * @param {number} period - Period for average calculation (default 20)
 * @returns {number|null} Volume ratio or null if insufficient data
 */
export const calculateVolumeRatio = (volumes, period = 20) => {
  if (!volumes || volumes.length < period + 1) return null;
  
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = calculateSMA(volumes.slice(0, -1), period);
  
  if (!avgVolume || avgVolume === 0) return null;
  return currentVolume / avgVolume;
};

/**
 * Detect RSI divergence
 * Bullish: Price makes lower low, RSI makes higher low
 * Bearish: Price makes higher high, RSI makes lower high
 * @param {number[]} prices - Array of prices
 * @param {number[]} rsiValues - Array of RSI values (same length as prices ideally)
 * @param {number} lookback - Number of periods to look back (default 20)
 * @returns {{bullish: boolean, bearish: boolean}}
 */
export const detectRSIDivergence = (prices, rsiValues, lookback = 20) => {
  if (!prices || !rsiValues || prices.length < lookback || rsiValues.length < lookback) {
    return { bullish: false, bearish: false };
  }
  
  const recentPrices = prices.slice(-lookback);
  const recentRSI = rsiValues.slice(-lookback);
  
  // Find local minimums and maximums
  const priceLows = [];
  const priceHighs = [];
  const rsiLows = [];
  const rsiHighs = [];
  
  for (let i = 1; i < recentPrices.length - 1; i++) {
    // Local low
    if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
      priceLows.push({ index: i, value: recentPrices[i] });
      rsiLows.push({ index: i, value: recentRSI[i] });
    }
    // Local high
    if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
      priceHighs.push({ index: i, value: recentPrices[i] });
      rsiHighs.push({ index: i, value: recentRSI[i] });
    }
  }
  
  // Bullish divergence: Lower price low, higher RSI low
  let bullish = false;
  if (priceLows.length >= 2 && rsiLows.length >= 2) {
    const lastPriceLow = priceLows[priceLows.length - 1];
    const prevPriceLow = priceLows[priceLows.length - 2];
    const lastRSILow = rsiLows[rsiLows.length - 1];
    const prevRSILow = rsiLows[rsiLows.length - 2];
    
    if (lastPriceLow.value < prevPriceLow.value && lastRSILow.value > prevRSILow.value) {
      bullish = true;
    }
  }
  
  // Bearish divergence: Higher price high, lower RSI high
  let bearish = false;
  if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
    const lastPriceHigh = priceHighs[priceHighs.length - 1];
    const prevPriceHigh = priceHighs[priceHighs.length - 2];
    const lastRSIHigh = rsiHighs[rsiHighs.length - 1];
    const prevRSIHigh = rsiHighs[rsiHighs.length - 2];
    
    if (lastPriceHigh.value > prevPriceHigh.value && lastRSIHigh.value < prevRSIHigh.value) {
      bearish = true;
    }
  }
  
  return { bullish, bearish };
};

/**
 * Detect RSI divergence from prices only (calculates RSI internally)
 * Useful when you only have price data
 * @param {number[]} prices - Array of prices
 * @param {number} period - RSI period (default 14)
 * @param {number} lookback - Lookback period for divergence detection (default 20)
 * @returns {{bullish: boolean, bearish: boolean}}
 */
export const detectDivergenceFromPrices = (prices, period = 14, lookback = 20) => {
  if (!prices || prices.length < lookback + period) {
    return { bullish: false, bearish: false };
  }
  
  // Calculate RSI values for the lookback period
  const rsiValues = [];
  for (let i = period; i <= prices.length; i++) {
    const slice = prices.slice(i - period - 1, i);
    const rsi = calculateRSI(slice, period);
    if (rsi !== null) rsiValues.push(rsi);
  }
  
  if (rsiValues.length < lookback) {
    return { bullish: false, bearish: false };
  }
  
  const recentPrices = prices.slice(-lookback);
  const recentRSI = rsiValues.slice(-lookback);
  
  return detectRSIDivergence(recentPrices, recentRSI, lookback);
};

/**
 * Detect engulfing candlestick patterns
 * @param {Array<{open: number, high: number, low: number, close: number}>} candles - OHLC data
 * @returns {{bullish: boolean, bearish: boolean}}
 */
export const detectEngulfingPattern = (candles) => {
  if (!candles || candles.length < 2) {
    return { bullish: false, bearish: false };
  }
  
  const prev = candles[candles.length - 2];
  const curr = candles[candles.length - 1];
  
  if (!prev || !curr) {
    return { bullish: false, bearish: false };
  }
  
  const prevBearish = prev.close < prev.open;
  const currBullish = curr.close > curr.open;
  const prevBullish = prev.close > prev.open;
  const currBearish = curr.close < curr.open;
  
  // Bullish engulfing: previous red candle completely engulfed by current green candle
  const bullish = prevBearish && currBullish && 
    curr.open <= prev.close && 
    curr.close >= prev.open;
  
  // Bearish engulfing: previous green candle completely engulfed by current red candle
  const bearish = prevBullish && currBearish && 
    curr.open >= prev.close && 
    curr.close <= prev.open;
  
  return { bullish, bearish };
};

// Default export for convenient importing
export default {
  calculateRSI,
  calculateSMA,
  calculateBollingerBands,
  calculateVolumeRatio,
  detectRSIDivergence,
  detectDivergenceFromPrices,
  detectEngulfingPattern
};
