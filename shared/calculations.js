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


/**
 * Calculate Exponential Moving Average (EMA)
 * @param {number[]} prices - Array of prices (oldest to newest)
 * @param {number} period - EMA period
 * @returns {number|null} EMA value or null if insufficient data
 */
export const calculateEMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

/**
 * Calculate full EMA series (needed for MACD)
 * @param {number[]} prices - Array of prices
 * @param {number} period - EMA period
 * @returns {number[]} Array of EMA values (same length as prices, nulls for initial periods)
 */
export const calculateEMASeries = (prices, period) => {
  if (!prices || prices.length < period) return [];
  const k = 2 / (period + 1);
  const result = new Array(period - 1).fill(null);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {number[]} prices - Array of prices (oldest to newest)
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal EMA period (default 9)
 * @returns {{macdLine: number, signalLine: number, histogram: number, bullishCross: boolean, bearishCross: boolean}|null}
 */
export const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!prices || prices.length < slowPeriod + signalPeriod) return null;

  const fastEMA = calculateEMASeries(prices, fastPeriod);
  const slowEMA = calculateEMASeries(prices, slowPeriod);

  // Build MACD line series where both EMAs are defined
  const macdSeries = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEMA[i] !== null && fastEMA[i] !== undefined && slowEMA[i] !== null && slowEMA[i] !== undefined) {
      macdSeries.push(fastEMA[i] - slowEMA[i]);
    }
  }

  if (macdSeries.length < signalPeriod) return null;

  // Signal line = EMA(signalPeriod) of MACD series
  const k = 2 / (signalPeriod + 1);
  let signalLine = macdSeries.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  const signalSeries = [signalLine];
  for (let i = signalPeriod; i < macdSeries.length; i++) {
    signalLine = macdSeries[i] * k + signalLine * (1 - k);
    signalSeries.push(signalLine);
  }

  const macdLine = macdSeries[macdSeries.length - 1];
  const currentSignal = signalSeries[signalSeries.length - 1];
  const histogram = macdLine - currentSignal;

  // Cross detection — compare last two bars
  const prevMacd = macdSeries[macdSeries.length - 2];
  const prevSignal = signalSeries[signalSeries.length - 2];
  const bullishCross = prevMacd !== undefined && prevSignal !== undefined
    ? prevMacd <= prevSignal && macdLine > currentSignal
    : false;
  const bearishCross = prevMacd !== undefined && prevSignal !== undefined
    ? prevMacd >= prevSignal && macdLine < currentSignal
    : false;

  return {
    macdLine: Math.round(macdLine * 1e8) / 1e8,
    signalLine: Math.round(currentSignal * 1e8) / 1e8,
    histogram: Math.round(histogram * 1e8) / 1e8,
    bullishCross,
    bearishCross,
    histogramPositive: histogram > 0,
    histogramNegative: histogram < 0,
  };
};

/**
 * Calculate Stochastic RSI
 * @param {number[]} prices - Array of prices (oldest to newest)
 * @param {number} rsiPeriod - RSI period (default 14)
 * @param {number} stochPeriod - Stochastic lookback period (default 14)
 * @param {number} kPeriod - %K smoothing period (default 3)
 * @param {number} dPeriod - %D smoothing period (default 3)
 * @returns {{k: number, d: number, oversold: boolean, overbought: boolean, bullishCross: boolean, bearishCross: boolean}|null}
 */
export const calculateStochRSI = (prices, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) => {
  const minLen = rsiPeriod + stochPeriod + kPeriod + dPeriod;
  if (!prices || prices.length < minLen) return null;

  // Build RSI series
  const rsiSeries = [];
  for (let i = rsiPeriod; i <= prices.length; i++) {
    const slice = prices.slice(i - rsiPeriod - 1, i);
    const changes = slice.map((p, j) => j === 0 ? 0 : p - slice[j - 1]).slice(1);
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    let avgGain = gains.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    let avgLoss = losses.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    for (let j = rsiPeriod; j < changes.length; j++) {
      avgGain = (avgGain * (rsiPeriod - 1) + gains[j]) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + losses[j]) / rsiPeriod;
    }
    if (avgLoss === 0) { rsiSeries.push(100); continue; }
    const rs = avgGain / avgLoss;
    rsiSeries.push(100 - 100 / (1 + rs));
  }

  if (rsiSeries.length < stochPeriod + kPeriod + dPeriod) return null;

  // Build raw StochRSI series (%K raw = unsmoothed)
  const rawK = [];
  for (let i = stochPeriod - 1; i < rsiSeries.length; i++) {
    const window = rsiSeries.slice(i - stochPeriod + 1, i + 1);
    const lowest = Math.min(...window);
    const highest = Math.max(...window);
    const range = highest - lowest;
    rawK.push(range === 0 ? 50 : ((rsiSeries[i] - lowest) / range) * 100);
  }

  if (rawK.length < kPeriod + dPeriod) return null;

  // Smooth %K with kPeriod SMA
  const smoothK = [];
  for (let i = kPeriod - 1; i < rawK.length; i++) {
    smoothK.push(rawK.slice(i - kPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / kPeriod);
  }

  if (smoothK.length < dPeriod) return null;

  // %D = dPeriod SMA of %K
  const smoothD = [];
  for (let i = dPeriod - 1; i < smoothK.length; i++) {
    smoothD.push(smoothK.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod);
  }

  const k = smoothK[smoothK.length - 1];
  const d = smoothD[smoothD.length - 1];
  const prevK = smoothK[smoothK.length - 2];
  const prevD = smoothD[smoothD.length - 2];

  const oversold = k < 20;
  const overbought = k > 80;
  const bullishCross = prevK !== undefined && prevD !== undefined
    ? prevK <= prevD && k > d && k < 50  // Cross up while in lower half
    : false;
  const bearishCross = prevK !== undefined && prevD !== undefined
    ? prevK >= prevD && k < d && k > 50  // Cross down while in upper half
    : false;

  return {
    k: Math.round(k * 10) / 10,
    d: Math.round(d * 10) / 10,
    oversold,
    overbought,
    bullishCross,
    bearishCross,
  };
};
// Default export for convenient importing
export default {
  calculateRSI,
  calculateSMA,
  calculateEMA,
  calculateEMASeries,
  calculateMACD,
  calculateStochRSI,
  calculateBollingerBands,
  calculateVolumeRatio,
  detectRSIDivergence,
  detectDivergenceFromPrices,
  detectEngulfingPattern
};
