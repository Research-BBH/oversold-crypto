// ==================================================
// FILE: api/crypto-enhanced.js
// Enhanced endpoint with full signal data for filtering
// ==================================================

export const config = {
  runtime: 'edge',
  maxDuration: 60, // Allow up to 60 seconds for this endpoint
};

// Import shared calculation functions
// Note: For Vercel Edge Functions, we inline the imports since ES modules work differently
// The shared module is copied here to ensure compatibility with edge runtime

// ============ SHARED CALCULATIONS (from shared/calculations.js) ============

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

const calculateSMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  if (!prices || prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev)
  };
};

const calculateVolumeRatio = (volumes, period = 20) => {
  if (!volumes || volumes.length < period + 1) return null;
  
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = calculateSMA(volumes.slice(0, -1), period);
  
  if (!avgVolume || avgVolume === 0) return null;
  return currentVolume / avgVolume;
};

const detectRSIDivergence = (prices, rsiValues, lookback = 20) => {
  if (!prices || !rsiValues || prices.length < lookback || rsiValues.length < lookback) {
    return { bullish: false, bearish: false };
  }
  
  const recentPrices = prices.slice(-lookback);
  const recentRSI = rsiValues.slice(-lookback);
  
  const priceLows = [];
  const priceHighs = [];
  const rsiLows = [];
  const rsiHighs = [];
  
  for (let i = 1; i < recentPrices.length - 1; i++) {
    if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
      priceLows.push({ index: i, value: recentPrices[i] });
      rsiLows.push({ index: i, value: recentRSI[i] });
    }
    if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
      priceHighs.push({ index: i, value: recentPrices[i] });
      rsiHighs.push({ index: i, value: recentRSI[i] });
    }
  }
  
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

const detectEngulfingPattern = (candles) => {
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
  
  const bullish = prevBearish && currBullish && 
    curr.open <= prev.close && 
    curr.close >= prev.open;
  
  const bearish = prevBullish && currBearish && 
    curr.open >= prev.close && 
    curr.close <= prev.open;
  
  return { bullish, bearish };
};

// ============ END SHARED CALCULATIONS ============

// Detect RSI divergence from prices only (calculates RSI internally)
const detectDivergence = (prices, period = 14, lookback = 20) => {
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

// Detect engulfing candle patterns (alternative version using prices/opens arrays)
const detectEngulfingFromArrays = (prices, opens) => {
  if (!prices || !opens || prices.length < 2 || opens.length < 2) {
    return { bullish: false, bearish: false };
  }
  
  const len = prices.length;
  const prevOpen = opens[len - 2];
  const prevClose = prices[len - 2];
  const currOpen = opens[len - 1];
  const currClose = prices[len - 1];
  
  const prevBody = Math.abs(prevClose - prevOpen);
  const currBody = Math.abs(currClose - currOpen);
  
  // Bullish engulfing: previous candle is red, current candle is green and engulfs previous
  const bullish = prevClose < prevOpen && // Previous was red
                  currClose > currOpen && // Current is green
                  currOpen <= prevClose && // Current opens at or below previous close
                  currClose >= prevOpen && // Current closes at or above previous open
                  currBody > prevBody; // Current body is larger
  
  // Bearish engulfing: previous candle is green, current candle is red and engulfs previous
  const bearish = prevClose > prevOpen && // Previous was green
                  currClose < currOpen && // Current is red
                  currOpen >= prevClose && // Current opens at or above previous close
                  currClose <= prevOpen && // Current closes at or below previous open
                  currBody > prevBody; // Current body is larger
  
  return { bullish, bearish };
};

// ── MACD ──────────────────────────────────────────────────────────────────────

const calculateEMASeries = (prices, period) => {
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

const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!prices || prices.length < slowPeriod + signalPeriod) return null;
  const fastEMA = calculateEMASeries(prices, fastPeriod);
  const slowEMA = calculateEMASeries(prices, slowPeriod);
  const macdSeries = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEMA[i] != null && slowEMA[i] != null) macdSeries.push(fastEMA[i] - slowEMA[i]);
  }
  if (macdSeries.length < signalPeriod) return null;
  const k = 2 / (signalPeriod + 1);
  let sigLine = macdSeries.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  const sigSeries = [sigLine];
  for (let i = signalPeriod; i < macdSeries.length; i++) {
    sigLine = macdSeries[i] * k + sigLine * (1 - k);
    sigSeries.push(sigLine);
  }
  const macdLine = macdSeries[macdSeries.length - 1];
  const curSig   = sigSeries[sigSeries.length - 1];
  const histogram = macdLine - curSig;
  const prevMacd = macdSeries[macdSeries.length - 2];
  const prevSig  = sigSeries[sigSeries.length - 2];
  return {
    macdLine:   Math.round(macdLine * 1e8) / 1e8,
    signalLine: Math.round(curSig   * 1e8) / 1e8,
    histogram:  Math.round(histogram * 1e8) / 1e8,
    bullishCross:      prevMacd != null ? prevMacd <= prevSig && macdLine > curSig  : false,
    bearishCross:      prevMacd != null ? prevMacd >= prevSig && macdLine < curSig  : false,
    histogramPositive: histogram > 0,
    histogramNegative: histogram < 0,
  };
};

// ── Stochastic RSI ────────────────────────────────────────────────────────────

const calculateStochRSI = (prices, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) => {
  if (!prices || prices.length < rsiPeriod + stochPeriod + kPeriod + dPeriod) return null;
  // Build RSI series
  const rsiSeries = [];
  for (let i = rsiPeriod; i <= prices.length; i++) {
    const slice = prices.slice(i - rsiPeriod - 1, i);
    const changes = slice.map((p, j) => j === 0 ? 0 : p - slice[j - 1]).slice(1);
    let avgGain = changes.map(c => c > 0 ? c : 0).slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    let avgLoss = changes.map(c => c < 0 ? Math.abs(c) : 0).slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    for (let j = rsiPeriod; j < changes.length; j++) {
      const gain = changes[j] > 0 ? changes[j] : 0;
      const loss = changes[j] < 0 ? Math.abs(changes[j]) : 0;
      avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
    }
    if (avgLoss === 0) { rsiSeries.push(100); continue; }
    rsiSeries.push(100 - 100 / (1 + avgGain / avgLoss));
  }
  if (rsiSeries.length < stochPeriod + kPeriod + dPeriod) return null;
  // Raw %K
  const rawK = [];
  for (let i = stochPeriod - 1; i < rsiSeries.length; i++) {
    const win = rsiSeries.slice(i - stochPeriod + 1, i + 1);
    const lo = Math.min(...win), hi = Math.max(...win);
    rawK.push(hi === lo ? 50 : ((rsiSeries[i] - lo) / (hi - lo)) * 100);
  }
  if (rawK.length < kPeriod + dPeriod) return null;
  // Smooth %K
  const smoothK = [];
  for (let i = kPeriod - 1; i < rawK.length; i++)
    smoothK.push(rawK.slice(i - kPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / kPeriod);
  if (smoothK.length < dPeriod) return null;
  // %D
  const smoothD = [];
  for (let i = dPeriod - 1; i < smoothK.length; i++)
    smoothD.push(smoothK.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod);
  const k = smoothK[smoothK.length - 1];
  const d = smoothD[smoothD.length - 1];
  const prevK = smoothK[smoothK.length - 2];
  const prevD = smoothD[smoothD.length - 2];
  return {
    k: Math.round(k * 10) / 10,
    d: Math.round(d * 10) / 10,
    oversold:     k < 20,
    overbought:   k > 80,
    bullishCross: prevK != null ? prevK <= prevD && k > d && k < 50 : false,
    bearishCross: prevK != null ? prevK >= prevD && k < d && k > 50 : false,
  };
};

// Calculate unified momentum score (-100 to +100)
// Positive = Bullish, Negative = Bearish, Near zero = Neutral
// ============================================================
// GRADUATED SIGNAL SCORING SYSTEM
// Scores scale based on signal strength, not just binary on/off
// Max possible: +100 bullish / -100 bearish (perfectly balanced)
// ============================================================

const SIGNAL_WEIGHTS = {
  RSI: { min: 10, max: 35 },           // RSI scales from 10-35 based on depth
  TREND: { min: 5, max: 20 },          // Trend scales based on % from SMA
  BOLLINGER: { min: 5, max: 15 },      // BB scales based on % outside band
  FUNDING: { min: 5, max: 15 },        // Funding scales based on rate magnitude
  DIVERGENCE: 15,                       // Binary - pattern detected or not
  ENGULFING: 10,                        // Binary - pattern detected or not
  PRICE_POSITION: { min: 3, max: 10 }, // ATL/ATH scales based on proximity
  VOLUME: { min: 3, max: 10 },         // Volume scales based on spike magnitude
  MACD: 8,                               // MACD cross (binary)
  STOCH_RSI: { min: 4, max: 8 },         // StochRSI (graduated by depth)
};

// Helper: Linear interpolation between min and max
const lerp = (min, max, t) => Math.round(min + (max - min) * Math.min(1, Math.max(0, t)));

const calculateSignalScore = (token, signals, fundingRate, rawData = {}) => {
  let score = 0;
  const activeSignals = [];
  const signalPairs = [];
  
  const { sma50, bollingerBands, volumeRatio } = rawData;
  
  // ============ 1. RSI Level (graduated: 10-35 points) ============
  const rsiPair = {
    name: 'RSI Level',
    bullish: { label: 'Oversold (<25)', weight: SIGNAL_WEIGHTS.RSI.max, active: false, value: null },
    bearish: { label: 'Overbought (>75)', weight: SIGNAL_WEIGHTS.RSI.max, active: false, value: null },
  };
  
  if (token.rsi !== null && token.rsi !== undefined) {
    if (token.rsi < 25) {
      // Scale: RSI 25 = 10pts, RSI 15 = 25pts, RSI 10 = 30pts, RSI <5 = 35pts
      // Lower RSI = stronger signal
      const strength = (25 - token.rsi) / 20; // 0 at RSI 25, 1 at RSI 5
      const points = lerp(SIGNAL_WEIGHTS.RSI.min, SIGNAL_WEIGHTS.RSI.max, strength);
      score += points;
      
      const label = token.rsi < 15 ? 'RSI Extreme Oversold' : token.rsi < 20 ? 'RSI Very Oversold' : 'RSI Oversold';
      activeSignals.push({ name: label, value: token.rsi, points: +points, category: 'rsi' });
      rsiPair.bullish.active = true;
      rsiPair.bullish.value = token.rsi;
      rsiPair.bullish.points = points;
      rsiPair.bullish.label = `Oversold (${token.rsi.toFixed(0)})`;
    } else if (token.rsi > 75) {
      // Scale: RSI 75 = 10pts, RSI 85 = 25pts, RSI 90 = 30pts, RSI >95 = 35pts
      const strength = (token.rsi - 75) / 20; // 0 at RSI 75, 1 at RSI 95
      const points = lerp(SIGNAL_WEIGHTS.RSI.min, SIGNAL_WEIGHTS.RSI.max, strength);
      score -= points;
      
      const label = token.rsi > 85 ? 'RSI Extreme Overbought' : token.rsi > 80 ? 'RSI Very Overbought' : 'RSI Overbought';
      activeSignals.push({ name: label, value: token.rsi, points: -points, category: 'rsi' });
      rsiPair.bearish.active = true;
      rsiPair.bearish.value = token.rsi;
      rsiPair.bearish.points = points;
      rsiPair.bearish.label = `Overbought (${token.rsi.toFixed(0)})`;
    }
  }
  signalPairs.push(rsiPair);
  
  // ============ 2. Trend - SMA50 (graduated: 5-20 points based on % distance) ============
  const trendPair = {
    name: 'Trend (SMA50)',
    bullish: { label: 'Uptrend', weight: SIGNAL_WEIGHTS.TREND.max, active: false },
    bearish: { label: 'Downtrend', weight: SIGNAL_WEIGHTS.TREND.max, active: false },
    unavailable: signals.aboveSMA50 === null && signals.belowSMA50 === null,
  };
  
  if (sma50 && token.price) {
    const pctFromSMA = ((token.price - sma50) / sma50) * 100;
    
    if (pctFromSMA > 0) {
      // Above SMA50 (bullish) - scale: 0-1% = 5pts, 5% = 12pts, 10%+ = 20pts
      const strength = Math.abs(pctFromSMA) / 10;
      const points = lerp(SIGNAL_WEIGHTS.TREND.min, SIGNAL_WEIGHTS.TREND.max, strength);
      score += points;
      activeSignals.push({ name: 'Above SMA50 (Uptrend)', value: `+${pctFromSMA.toFixed(1)}%`, points: +points, category: 'trend' });
      trendPair.bullish.active = true;
      trendPair.bullish.points = points;
      trendPair.bullish.label = `Uptrend (+${pctFromSMA.toFixed(1)}%)`;
    } else {
      // Below SMA50 (bearish)
      const strength = Math.abs(pctFromSMA) / 10;
      const points = lerp(SIGNAL_WEIGHTS.TREND.min, SIGNAL_WEIGHTS.TREND.max, strength);
      score -= points;
      activeSignals.push({ name: 'Below SMA50 (Downtrend)', value: `${pctFromSMA.toFixed(1)}%`, points: -points, category: 'trend' });
      trendPair.bearish.active = true;
      trendPair.bearish.points = points;
      trendPair.bearish.label = `Downtrend (${pctFromSMA.toFixed(1)}%)`;
    }
  } else if (signals.aboveSMA50 === true) {
    // Fallback to binary if no raw data
    score += SIGNAL_WEIGHTS.TREND.min;
    activeSignals.push({ name: 'Above SMA50 (Uptrend)', points: +SIGNAL_WEIGHTS.TREND.min, category: 'trend' });
    trendPair.bullish.active = true;
    trendPair.bullish.points = SIGNAL_WEIGHTS.TREND.min;
  } else if (signals.belowSMA50 === true) {
    score -= SIGNAL_WEIGHTS.TREND.min;
    activeSignals.push({ name: 'Below SMA50 (Downtrend)', points: -SIGNAL_WEIGHTS.TREND.min, category: 'trend' });
    trendPair.bearish.active = true;
    trendPair.bearish.points = SIGNAL_WEIGHTS.TREND.min;
  }
  signalPairs.push(trendPair);
  
  // ============ 3. Bollinger Bands (graduated: 5-15 points based on % outside) ============
  const bbPair = {
    name: 'Bollinger Bands',
    bullish: { label: 'Below Lower', weight: SIGNAL_WEIGHTS.BOLLINGER.max, active: false },
    bearish: { label: 'Above Upper', weight: SIGNAL_WEIGHTS.BOLLINGER.max, active: false },
    unavailable: signals.belowBB === null && signals.aboveBB === null,
  };
  
  if (bollingerBands && token.price) {
    const { upper, lower, middle } = bollingerBands;
    const bandWidth = upper - lower;
    
    if (token.price < lower) {
      // Below lower BB - scale based on how far below
      const pctBelow = ((lower - token.price) / bandWidth) * 100;
      const strength = pctBelow / 20; // 20% below = max strength
      const points = lerp(SIGNAL_WEIGHTS.BOLLINGER.min, SIGNAL_WEIGHTS.BOLLINGER.max, strength);
      score += points;
      activeSignals.push({ name: 'Below Lower BB', value: `-${pctBelow.toFixed(1)}%`, points: +points, category: 'bb' });
      bbPair.bullish.active = true;
      bbPair.bullish.points = points;
      bbPair.bullish.label = `Below (-${pctBelow.toFixed(1)}%)`;
    } else if (token.price > upper) {
      // Above upper BB
      const pctAbove = ((token.price - upper) / bandWidth) * 100;
      const strength = pctAbove / 20;
      const points = lerp(SIGNAL_WEIGHTS.BOLLINGER.min, SIGNAL_WEIGHTS.BOLLINGER.max, strength);
      score -= points;
      activeSignals.push({ name: 'Above Upper BB', value: `+${pctAbove.toFixed(1)}%`, points: -points, category: 'bb' });
      bbPair.bearish.active = true;
      bbPair.bearish.points = points;
      bbPair.bearish.label = `Above (+${pctAbove.toFixed(1)}%)`;
    }
  } else if (signals.belowBB === true) {
    score += SIGNAL_WEIGHTS.BOLLINGER.min;
    activeSignals.push({ name: 'Below Lower BB', points: +SIGNAL_WEIGHTS.BOLLINGER.min, category: 'bb' });
    bbPair.bullish.active = true;
    bbPair.bullish.points = SIGNAL_WEIGHTS.BOLLINGER.min;
  } else if (signals.aboveBB === true) {
    score -= SIGNAL_WEIGHTS.BOLLINGER.min;
    activeSignals.push({ name: 'Above Upper BB', points: -SIGNAL_WEIGHTS.BOLLINGER.min, category: 'bb' });
    bbPair.bearish.active = true;
    bbPair.bearish.points = SIGNAL_WEIGHTS.BOLLINGER.min;
  }
  signalPairs.push(bbPair);
  
  // ============ 4. Funding Rate (graduated: 5-15 points based on magnitude) ============
  const fundingPair = {
    name: 'Funding Rate',
    bullish: { label: 'Negative', weight: SIGNAL_WEIGHTS.FUNDING.max, active: false },
    bearish: { label: 'Positive', weight: SIGNAL_WEIGHTS.FUNDING.max, active: false },
    unavailable: fundingRate === null || fundingRate === undefined,
  };
  
  if (fundingRate !== null && fundingRate !== undefined) {
    if (fundingRate < -0.005) {
      // Negative funding (bullish) - scale: -0.005 = 5pts, -0.02 = 10pts, -0.05+ = 15pts
      const strength = Math.abs(fundingRate) / 0.05;
      const points = lerp(SIGNAL_WEIGHTS.FUNDING.min, SIGNAL_WEIGHTS.FUNDING.max, strength);
      score += points;
      activeSignals.push({ name: 'Negative Funding', value: fundingRate, points: +points, category: 'funding' });
      fundingPair.bullish.active = true;
      fundingPair.bullish.value = fundingRate;
      fundingPair.bullish.points = points;
      fundingPair.bullish.label = `Negative (${(fundingRate * 100).toFixed(3)}%)`;
    } else if (fundingRate > 0.01) {
      // Positive funding (bearish)
      const strength = fundingRate / 0.05;
      const points = lerp(SIGNAL_WEIGHTS.FUNDING.min, SIGNAL_WEIGHTS.FUNDING.max, strength);
      score -= points;
      activeSignals.push({ name: 'Positive Funding', value: fundingRate, points: -points, category: 'funding' });
      fundingPair.bearish.active = true;
      fundingPair.bearish.value = fundingRate;
      fundingPair.bearish.points = points;
      fundingPair.bearish.label = `Positive (${(fundingRate * 100).toFixed(3)}%)`;
    }
  }
  signalPairs.push(fundingPair);
  
  // ============ 5. RSI Divergence (binary: ±15) ============
  const divPair = {
    name: 'RSI Divergence',
    bullish: { label: 'Bullish', weight: SIGNAL_WEIGHTS.DIVERGENCE, active: false },
    bearish: { label: 'Bearish', weight: SIGNAL_WEIGHTS.DIVERGENCE, active: false },
    unavailable: signals.bullishDivergence === null && signals.bearishDivergence === null,
  };
  
  if (signals.bullishDivergence === true) {
    score += SIGNAL_WEIGHTS.DIVERGENCE;
    activeSignals.push({ name: 'Bullish Divergence', points: +SIGNAL_WEIGHTS.DIVERGENCE, category: 'divergence' });
    divPair.bullish.active = true;
    divPair.bullish.points = SIGNAL_WEIGHTS.DIVERGENCE;
  }
  if (signals.bearishDivergence === true) {
    score -= SIGNAL_WEIGHTS.DIVERGENCE;
    activeSignals.push({ name: 'Bearish Divergence', points: -SIGNAL_WEIGHTS.DIVERGENCE, category: 'divergence' });
    divPair.bearish.active = true;
    divPair.bearish.points = SIGNAL_WEIGHTS.DIVERGENCE;
  }
  signalPairs.push(divPair);
  
  // ============ 6. Candlestick Patterns (binary: ±10) ============
  const candlePair = {
    name: 'Candlestick',
    bullish: { label: 'Bullish Engulfing', weight: SIGNAL_WEIGHTS.ENGULFING, active: false },
    bearish: { label: 'Bearish Engulfing', weight: SIGNAL_WEIGHTS.ENGULFING, active: false },
    unavailable: signals.bullishEngulfing === null && signals.bearishEngulfing === null,
  };
  
  if (signals.bullishEngulfing === true) {
    score += SIGNAL_WEIGHTS.ENGULFING;
    activeSignals.push({ name: 'Bullish Engulfing', points: +SIGNAL_WEIGHTS.ENGULFING, category: 'candle' });
    candlePair.bullish.active = true;
    candlePair.bullish.points = SIGNAL_WEIGHTS.ENGULFING;
  }
  if (signals.bearishEngulfing === true) {
    score -= SIGNAL_WEIGHTS.ENGULFING;
    activeSignals.push({ name: 'Bearish Engulfing', points: -SIGNAL_WEIGHTS.ENGULFING, category: 'candle' });
    candlePair.bearish.active = true;
    candlePair.bearish.points = SIGNAL_WEIGHTS.ENGULFING;
  }
  signalPairs.push(candlePair);
  
  // ============ 7. Price Position - ATL/ATH (graduated: 3-10 points) ============
  const positionPair = {
    name: 'Price Position',
    bullish: { label: 'Near ATL', weight: SIGNAL_WEIGHTS.PRICE_POSITION.max, active: false },
    bearish: { label: 'Near ATH', weight: SIGNAL_WEIGHTS.PRICE_POSITION.max, active: false },
  };
  
  // atlChange: percentage above ATL (e.g., 39 means 39% above ATL) - within 50% is "near"
  // athChange: percentage from ATH (e.g., -85 means 85% below ATH) - within 10% is "near"
  const nearATL = token.atlChange !== undefined && token.atlChange !== null && token.atlChange <= 50;
  const athChangeValue = token.athChange !== undefined && token.athChange !== null ? token.athChange : -100;
  const nearATH = athChangeValue > -10;  // Within 10% of ATH
  
  if (nearATL && !nearATH) {
    // Scale: 50% from ATL = 3pts, 25% = 6pts, 10% = 8pts, <5% = 10pts
    const strength = (50 - token.atlChange) / 48; // 0 at 50%, 1 at 2%
    const points = lerp(SIGNAL_WEIGHTS.PRICE_POSITION.min, SIGNAL_WEIGHTS.PRICE_POSITION.max, strength);
    score += points;
    activeSignals.push({ name: 'Near All-Time Low', value: `+${token.atlChange?.toFixed(1)}%`, points: +points, category: 'position' });
    positionPair.bullish.active = true;
    positionPair.bullish.value = token.atlChange;
    positionPair.bullish.points = points;
    positionPair.bullish.label = `Near ATL (+${token.atlChange?.toFixed(1)}%)`;
  } else if (nearATH && !nearATL) {
    // For ATH, we use the athChange directly
    const athPct = Math.abs(athChangeValue);
    const strength = (10 - athPct) / 8; // 0 at 10%, 1 at 2%
    const points = lerp(SIGNAL_WEIGHTS.PRICE_POSITION.min, SIGNAL_WEIGHTS.PRICE_POSITION.max, Math.max(0, strength));
    score -= points;
    activeSignals.push({ name: 'Near All-Time High', value: athPct < 10 ? `-${athPct.toFixed(1)}%` : undefined, points: -points, category: 'position' });
    positionPair.bearish.active = true;
    positionPair.bearish.points = points;
    positionPair.bearish.label = `Near ATH${athPct < 10 ? ` (-${athPct.toFixed(1)}%)` : ''}`;
  }
  signalPairs.push(positionPair);
  
  // ============ 8. Volume Analysis (graduated: 3-10 points) ============
  const volumePair = {
    name: 'Volume',
    bullish: { label: 'Accumulation', weight: SIGNAL_WEIGHTS.VOLUME.max, active: false },
    bearish: { label: 'Distribution', weight: SIGNAL_WEIGHTS.VOLUME.max, active: false },
    unavailable: signals.volumeSpike === null,
  };
  
  if (signals.volumeSpike === true && volumeRatio) {
    // Scale: 1.5x = 3pts, 2x = 5pts, 3x = 8pts, 4x+ = 10pts
    const strength = (volumeRatio - 1.5) / 2.5; // 0 at 1.5x, 1 at 4x
    const points = lerp(SIGNAL_WEIGHTS.VOLUME.min, SIGNAL_WEIGHTS.VOLUME.max, strength);
    
    if (token.rsi !== null && token.rsi < 35) {
      score += points;
      activeSignals.push({ name: 'Volume Accumulation', value: `${volumeRatio.toFixed(1)}x`, points: +points, category: 'volume' });
      volumePair.bullish.active = true;
      volumePair.bullish.points = points;
      volumePair.bullish.label = `Accumulation (${volumeRatio.toFixed(1)}x)`;
    } else if (token.rsi !== null && token.rsi > 65) {
      score -= points;
      activeSignals.push({ name: 'Volume Distribution', value: `${volumeRatio.toFixed(1)}x`, points: -points, category: 'volume' });
      volumePair.bearish.active = true;
      volumePair.bearish.points = points;
      volumePair.bearish.label = `Distribution (${volumeRatio.toFixed(1)}x)`;
    }
  } else if (signals.volumeSpike === true) {
    // Fallback without ratio
    if (token.rsi !== null && token.rsi < 35) {
      score += SIGNAL_WEIGHTS.VOLUME.min;
      activeSignals.push({ name: 'Volume Accumulation', points: +SIGNAL_WEIGHTS.VOLUME.min, category: 'volume' });
      volumePair.bullish.active = true;
      volumePair.bullish.points = SIGNAL_WEIGHTS.VOLUME.min;
    } else if (token.rsi !== null && token.rsi > 65) {
      score -= SIGNAL_WEIGHTS.VOLUME.min;
      activeSignals.push({ name: 'Volume Distribution', points: -SIGNAL_WEIGHTS.VOLUME.min, category: 'volume' });
      volumePair.bearish.active = true;
      volumePair.bearish.points = SIGNAL_WEIGHTS.VOLUME.min;
    }
  }
  signalPairs.push(volumePair);

  // ============ 9. MACD Cross (binary: ±8) ============
  const macdPair = {
    name: 'MACD',
    bullish: { label: 'Bullish Cross', weight: SIGNAL_WEIGHTS.MACD, active: false },
    bearish: { label: 'Bearish Cross', weight: SIGNAL_WEIGHTS.MACD, active: false },
    unavailable: !rawData.macd,
  };
  if (rawData.macd) {
    if (rawData.macd.bullishCross) {
      score += SIGNAL_WEIGHTS.MACD;
      activeSignals.push({ name: 'MACD Bullish Cross', points: +SIGNAL_WEIGHTS.MACD, category: 'macd' });
      macdPair.bullish.active = true;
      macdPair.bullish.points = SIGNAL_WEIGHTS.MACD;
    } else if (rawData.macd.bearishCross) {
      score -= SIGNAL_WEIGHTS.MACD;
      activeSignals.push({ name: 'MACD Bearish Cross', points: -SIGNAL_WEIGHTS.MACD, category: 'macd' });
      macdPair.bearish.active = true;
      macdPair.bearish.points = SIGNAL_WEIGHTS.MACD;
    }
  }
  signalPairs.push(macdPair);

  // ============ 10. Stochastic RSI (graduated: 4-8 points) ============
  const stochPair = {
    name: 'Stoch RSI',
    bullish: { label: 'Oversold', weight: SIGNAL_WEIGHTS.STOCH_RSI.max, active: false },
    bearish: { label: 'Overbought', weight: SIGNAL_WEIGHTS.STOCH_RSI.max, active: false },
    unavailable: !rawData.stochRsi,
  };
  if (rawData.stochRsi) {
    const { k } = rawData.stochRsi;
    if (rawData.stochRsi.oversold) {
      const strength = (20 - k) / 20; // 0 at 20, 1 at 0
      const points = lerp(SIGNAL_WEIGHTS.STOCH_RSI.min, SIGNAL_WEIGHTS.STOCH_RSI.max, strength);
      score += points;
      activeSignals.push({ name: 'StochRSI Oversold', value: k, points: +points, category: 'stoch' });
      stochPair.bullish.active = true;
      stochPair.bullish.points = points;
      stochPair.bullish.label = `Oversold (${k})`;
    } else if (rawData.stochRsi.overbought) {
      const strength = (k - 80) / 20; // 0 at 80, 1 at 100
      const points = lerp(SIGNAL_WEIGHTS.STOCH_RSI.min, SIGNAL_WEIGHTS.STOCH_RSI.max, strength);
      score -= points;
      activeSignals.push({ name: 'StochRSI Overbought', value: k, points: -points, category: 'stoch' });
      stochPair.bearish.active = true;
      stochPair.bearish.points = points;
      stochPair.bearish.label = `Overbought (${k})`;
    }
    // Bonus for bullish/bearish cross
    if (rawData.stochRsi.bullishCross && !rawData.stochRsi.oversold) {
      score += SIGNAL_WEIGHTS.STOCH_RSI.min;
      activeSignals.push({ name: 'StochRSI Bullish Cross', points: +SIGNAL_WEIGHTS.STOCH_RSI.min, category: 'stoch' });
    } else if (rawData.stochRsi.bearishCross && !rawData.stochRsi.overbought) {
      score -= SIGNAL_WEIGHTS.STOCH_RSI.min;
      activeSignals.push({ name: 'StochRSI Bearish Cross', points: -SIGNAL_WEIGHTS.STOCH_RSI.min, category: 'stoch' });
    }
  }
  signalPairs.push(stochPair);

  // Clamp score to -100 to +100
  score = Math.max(-100, Math.min(100, score));
  
  // Determine signal label and strength
  let label, strength;
  if (score >= 50) {
    label = 'STRONG BUY';
    strength = 'strong-buy';
  } else if (score >= 25) {
    label = 'BUY';
    strength = 'buy';
  } else if (score > -25) {
    label = 'NEUTRAL';
    strength = 'neutral';
  } else if (score > -50) {
    label = 'SELL';
    strength = 'sell';
  } else {
    label = 'STRONG SELL';
    strength = 'strong-sell';
  }
  
  // Calculate totals for display
  const bullishTotal = activeSignals.filter(s => s.points > 0).reduce((sum, s) => sum + s.points, 0);
  const bearishTotal = Math.abs(activeSignals.filter(s => s.points < 0).reduce((sum, s) => sum + s.points, 0));
  
  return {
    score,
    label,
    strength,
    activeSignals,
    signalPairs,
    signalCount: activeSignals.length,
    bullishCount: activeSignals.filter(s => s.points > 0).length,
    bearishCount: activeSignals.filter(s => s.points < 0).length,
    bullishTotal,
    bearishTotal,
    maxPossible: 100,
  };
};

// Helper to get Bybit symbol
const getBybitSymbol = (symbol) => {
  const normalized = symbol?.toUpperCase().trim()
    .replace(/USD$/, '')
    .replace(/USDT$/, '')
    .replace(/USDC$/, '');
  return `${normalized}USDT`;
};

// Helper to get OKX symbol
const getOKXSymbol = (symbol) => {
  const normalized = symbol?.toUpperCase().trim()
    .replace(/USD$/, '')
    .replace(/USDT$/, '')
    .replace(/USDC$/, '');
  return `${normalized}-USDT-SWAP`;
};

// Fetch Bybit data for a single token
const fetchBybitData = async (symbol) => {
  try {
    const bybitSymbol = getBybitSymbol(symbol);
    
    // Fetch klines and funding rate in parallel
    const [klinesRes, fundingRes] = await Promise.all([
      fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${bybitSymbol}&interval=60&limit=200`),
      fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybitSymbol}`)
    ]);
    
    if (!klinesRes.ok) return null;
    
    const klinesData = await klinesRes.json();
    if (klinesData.retCode !== 0 || !klinesData.result?.list) return null;
    
    const klines = klinesData.result.list.reverse();
    // Bybit kline format: [timestamp, open, high, low, close, volume, turnover]
    const opens = klines.map(k => parseFloat(k[1]));
    const prices = klines.map(k => parseFloat(k[4])); // close prices
    const volumes = klines.map(k => parseFloat(k[5]));
    
    let fundingRate = null;
    if (fundingRes.ok) {
      const fundingData = await fundingRes.json();
      if (fundingData.retCode === 0 && fundingData.result?.list?.[0]) {
        fundingRate = parseFloat(fundingData.result.list[0].fundingRate);
      }
    }
    
    return { prices, opens, volumes, fundingRate, source: 'bybit' };
  } catch (error) {
    return null;
  }
};

// Fetch OKX data for a single token
const fetchOKXData = async (symbol) => {
  try {
    const okxSymbol = getOKXSymbol(symbol);
    
    const [candlesRes, fundingRes] = await Promise.all([
      fetch(`https://www.okx.com/api/v5/market/candles?instId=${okxSymbol}&bar=1H&limit=200`),
      fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${okxSymbol}`)
    ]);
    
    if (!candlesRes.ok) return null;
    
    const candlesData = await candlesRes.json();
    if (candlesData.code !== '0' || !candlesData.data) return null;
    
    const candles = candlesData.data.reverse();
    // OKX candle format: [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm]
    const opens = candles.map(c => parseFloat(c[1]));
    const prices = candles.map(c => parseFloat(c[4])); // close prices
    const volumes = candles.map(c => parseFloat(c[6]));
    
    let fundingRate = null;
    if (fundingRes.ok) {
      const fundingData = await fundingRes.json();
      if (fundingData.code === '0' && fundingData.data?.[0]) {
        fundingRate = parseFloat(fundingData.data[0].fundingRate);
      }
    }
    
    return { prices, opens, volumes, fundingRate, source: 'okx' };
  } catch (error) {
    return null;
  }
};

// Enhance a single token with signal data
const enhanceToken = async (token) => {
  // Skip signal calculation for stablecoins - technical analysis doesn't apply
  if (token.category === 'stable') {
    return {
      ...token,
      signals: null,
      signalScore: null,
      signalLabel: null,
      signalStrength: null,
      signalScoreDetails: null,
      enhanced: false,
      isStablecoin: true,
    };
  }
  
  // Try Bybit first
  let exchangeData = await fetchBybitData(token.symbol);
  
  // Try OKX if Bybit fails
  if (!exchangeData) {
    exchangeData = await fetchOKXData(token.symbol);
  }
  
  // If we got exchange data, calculate signals
  if (exchangeData && exchangeData.prices.length >= 50) {
    const sma50 = calculateSMA(exchangeData.prices, 50);
    const sma20 = calculateSMA(exchangeData.prices, 20);
    const bb = calculateBollingerBands(exchangeData.prices, 20, 2);
    const volumeRatio = exchangeData.volumes.length > 20 
      ? calculateVolumeRatio(exchangeData.volumes, 20) 
      : null;
    
    // Calculate MACD and StochRSI
    const macd      = calculateMACD(exchangeData.prices);
    const stochRsi  = calculateStochRSI(exchangeData.prices);

    // Calculate divergence
    const divergence = detectDivergence(exchangeData.prices);
    
    // Calculate engulfing patterns
    const engulfing = exchangeData.opens 
      ? detectEngulfingFromArrays(exchangeData.prices, exchangeData.opens)
      : { bullish: false, bearish: false };
    
    // Calculate price near ATH (within 10% of all-time high from available data)
    const maxPrice = Math.max(...exchangeData.prices);
    const nearATH = token.price >= maxPrice * 0.9;
    
    // Calculate volume/market cap ratio (high vol/mcap can indicate distribution or accumulation)
    const volMcapRatio = token.mcap > 0 ? (token.volume / token.mcap) * 100 : null;
    const highVolMcap = volMcapRatio !== null && volMcapRatio > 10; // > 10% is significant
    
    const signals = {
      // Buy signals (oversold)
      rsiOversold: token.rsi !== null && token.rsi < 30,
      rsiExtreme: token.rsi !== null && token.rsi < 25,
      aboveSMA50: sma50 ? token.price > sma50 : null,
      belowBB: bb ? token.price < bb.lower : null,
      volumeSpike: volumeRatio ? volumeRatio > 1.5 : null,
      hasFunding: exchangeData.fundingRate !== null && exchangeData.fundingRate !== undefined,
      negativeFunding: exchangeData.fundingRate !== null && exchangeData.fundingRate < 0,
      bullishDivergence: divergence.bullish,
      bullishEngulfing: engulfing.bullish,
      // Sell signals (overbought)
      rsiOverbought: token.rsi !== null && token.rsi > 70,
      rsiOverboughtExtreme: token.rsi !== null && token.rsi > 80,
      belowSMA50: sma50 ? token.price < sma50 : null,
      belowSMA20: sma20 ? token.price < sma20 : null,
      aboveBB: bb ? token.price > bb.upper : null,
      positiveFunding: exchangeData.fundingRate !== null && exchangeData.fundingRate > 0.01,
      bearishDivergence: divergence.bearish,
      bearishEngulfing: engulfing.bearish,
      nearATH: nearATH,
      highVolMcap: highVolMcap,
      // MACD
      macdBullishCross:  macd ? macd.bullishCross  : null,
      macdBearishCross:  macd ? macd.bearishCross  : null,
      macdHistPositive:  macd ? macd.histogramPositive : null,
      macdHistNegative:  macd ? macd.histogramNegative : null,
      // StochRSI
      stochOversold:     stochRsi ? stochRsi.oversold     : null,
      stochOverbought:   stochRsi ? stochRsi.overbought   : null,
      stochBullishCross: stochRsi ? stochRsi.bullishCross : null,
      stochBearishCross: stochRsi ? stochRsi.bearishCross : null,
    };
    
    const signalScoreData = calculateSignalScore(token, signals, exchangeData.fundingRate, {
      sma50,
      bollingerBands: bb,
      volumeRatio,
      macd,
      stochRsi,
    });
    
    return {
      ...token,
      signals,
      signalScore: signalScoreData.score,
      signalLabel: signalScoreData.label,
      signalStrength: signalScoreData.strength,
      signalScoreDetails: signalScoreData,
      // Raw values for detail view
      sma50,
      sma20,
      bollingerBands: bb,
      volumeRatio,
      volMcapRatio,
      fundingRate: exchangeData.fundingRate,
      dataSource: exchangeData.source,
      enhanced: true,
      macd,
      stochRsi,
    };
  }
  
  // Return basic token with signal flags based on available data
  // Calculate vol/mcap for non-enhanced tokens too
  const volMcapRatio = token.mcap > 0 ? (token.volume / token.mcap) * 100 : null;
  
  // Use sparkline data as fallback for SMA/BB calculations
  let sma50 = null;
  let sma20 = null;
  let bb = null;
  let nearATH = null;
  
  if (token.sparklineRaw && token.sparklineRaw.length >= 50) {
    sma50 = calculateSMA(token.sparklineRaw, 50);
    sma20 = calculateSMA(token.sparklineRaw, 20);
    bb = calculateBollingerBands(token.sparklineRaw, 20, 2);
    const maxPrice = Math.max(...token.sparklineRaw);
    nearATH = token.price >= maxPrice * 0.9;
  }
  
  const signals = {
    // Buy signals (oversold)
    rsiOversold: token.rsi !== null && token.rsi < 30,
    rsiExtreme: token.rsi !== null && token.rsi < 25,
    aboveSMA50: sma50 ? token.price > sma50 : null,
    belowBB: bb ? token.price < bb.lower : null,
    volumeSpike: null, // Can't calculate without historical volume data
    hasFunding: null,
    negativeFunding: null,
    bullishDivergence: null, // Can't calculate without RSI history
    bullishEngulfing: null, // Can't calculate without OHLC data
    // Sell signals (overbought)
    rsiOverbought: token.rsi !== null && token.rsi > 70,
    rsiOverboughtExtreme: token.rsi !== null && token.rsi > 80,
    belowSMA50: sma50 ? token.price < sma50 : null,
    belowSMA20: sma20 ? token.price < sma20 : null,
    aboveBB: bb ? token.price > bb.upper : null,
    positiveFunding: null,
    bearishDivergence: null, // Can't calculate without RSI history
    bearishEngulfing: null, // Can't calculate without OHLC data
    nearATH: nearATH,
    highVolMcap: volMcapRatio !== null && volMcapRatio > 10,
  };
  
  const signalScoreData = calculateSignalScore(token, signals, null, {
    sma50,
    bollingerBands: bb,
    volumeRatio: null,
  });
  
  return {
    ...token,
    signals,
    signalScore: signalScoreData.score,
    signalLabel: signalScoreData.label,
    signalStrength: signalScoreData.strength,
    signalScoreDetails: signalScoreData,
    enhanced: false,
  };
};

// Chunk array helper
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Smart categorization (same as main API)
const getCategoryFromMetadata = (id, name, symbol) => {
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();
  const symbolLower = symbol.toLowerCase();
  
  const layer1Ids = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot', 
                     'polygon-ecosystem-token', 'matic-network', 'arbitrum', 'optimism',
                     'cosmos', 'near-protocol', 'aptos', 'sui', 'kaspa', 'tron', 'litecoin',
                     'stellar', 'algorand', 'fantom', 'hedera-hashgraph', 'internet-computer',
                     'the-open-network', 'stacks', 'injective-protocol', 'sei-network', 'celestia'];
  if (layer1Ids.includes(idLower) || nameLower.includes('network') || nameLower.includes('chain')) {
    return 'layer-1';
  }
  
  const memeKeywords = ['doge', 'shib', 'inu', 'pepe', 'floki', 'bonk', 'meme', 'wojak',
                        'shiba', 'baby', 'elon', 'cat', 'popcat', 'mog', 'turbo', 'brett',
                        'wif', 'bome', 'coq', 'myro', 'wen', 'neiro', 'dogs', 'ponke'];
  if (memeKeywords.some(keyword => idLower.includes(keyword) || nameLower.includes(keyword) || symbolLower.includes(keyword))) {
    return 'meme';
  }
  
  const defiIds = ['chainlink', 'uniswap', 'aave', 'maker', 'lido-dao', 'curve-dao-token',
                   'pancakeswap-token', 'compound-governance-token', 'synthetix-network-token',
                   'thorchain', 'the-graph', 'raydium', 'jupiter-exchange-solana', 'pendle',
                   '1inch', 'sushi', 'balancer', 'convex-finance', 'yearn-finance'];
  const defiKeywords = ['swap', 'dex', 'lending', 'defi', 'finance', 'protocol'];
  if (defiIds.includes(idLower) || defiKeywords.some(k => idLower.includes(k) || nameLower.includes(k))) {
    return 'defi';
  }
  
  const aiIds = ['render-token', 'fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor',
                 'worldcoin', 'akash-network', 'arkham', 'artificial-superintelligence-alliance'];
  const aiKeywords = ['ai', 'artificial', 'intelligence', 'neural', 'render', 'compute'];
  if (aiIds.includes(idLower) || aiKeywords.some(k => idLower.includes(k) || nameLower.includes(k))) {
    return 'ai';
  }
  
  const gamingIds = ['the-sandbox', 'decentraland', 'axie-infinity', 'gala', 'immutable-x',
                     'enjincoin', 'beam', 'echelon-prime', 'gala-games'];
  const gamingKeywords = ['game', 'gaming', 'meta', 'verse', 'land', 'sandbox', 'axie', 'play'];
  if (gamingIds.includes(idLower) || gamingKeywords.some(k => idLower.includes(k) || nameLower.includes(k))) {
    return 'gaming';
  }
  
  const exchangeIds = ['binancecoin', 'crypto-com-chain', 'okb', 'kucoin-shares', 'gate-token',
                       'huobi-token', 'bitget-token', 'mx-token'];
  if (exchangeIds.includes(idLower) || idLower.includes('exchange')) {
    return 'exchange';
  }
  
  // Stablecoins - explicit allowlist of CoinGecko IDs
  // Technical analysis doesn't apply to price-pegged assets
  const stablecoinIds = [
    // === USD Stablecoins (Top by market cap) ===
    'tether',                    // USDT
    'usd-coin',                  // USDC
    'dai',                       // DAI
    'usds',                      // USDS (Sky Dollar)
    'ethena-usde',               // USDe
    'first-digital-usd',         // FDUSD
    'paypal-usd',                // PYUSD
    'true-usd',                  // TUSD
    'usdd',                      // USDD
    'frax',                      // FRAX
    'paxos-standard',            // USDP (Pax Dollar)
    'gemini-dollar',             // GUSD
    'liquity-usd',               // LUSD
    'crvusd',                    // crvUSD
    'gho',                       // GHO (Aave)
    'usual-usd',                 // USD0
    'ondo-us-dollar-yield',      // USDY
    'mountain-protocol-usdm',    // USDM
    'binance-usd',               // BUSD
    'husd',                      // HUSD
    'usdx-money-usdx',           // USDX
    'electronic-usd',            // eUSD
    'compound-usd-coin',         // cUSDC
    'nusd',                      // sUSD (Synthetix)
    'usd1-wlfi',                 // USD1 (World Liberty)
    'resolv-usd',                // USR
    'pax-dollar',                // USDP
    'usdj',                      // USDJ
    'flex-usd',                  // flexUSD
    'spiceusd',                  // USDS
    'bob-token',                 // BOB
    'hai',                       // HAI
    'synth-susd',                // sUSD
    'equilibrium-eosdt',         // EOSDT
    'money-on-chain',            // DOC
    'kava-lend',                 // USDX
    'circuit-usd',               // cUSD (Celo)
    'usk',                       // USK
    'djed',                      // DJED
    'silk-bcec1136-561c-4706-a42c-8b67d0d7f7d2', // SILK
    'defidollar',                // DUSD
    'usd-balance',               // USDB
    'float-protocol-float',      // FLOAT
    'volt-protocol-stablecoin',  // VOLT
    'coin98-dollar',             // CUSD
    'uma',                       // UMA pegged tokens
    'ratio-stable-coin',         // USDR
    'yeti-finance',              // YUSD
    'terra-usd',                 // UST (defunct but might still appear)
    'terrausd',                  // UST alternative ID
    'yusd-stablecoin',           // YUSD
    'stabolut',                  // USDC2
    'zunusd',                    // zunUSD
    'strike-usd',                // sUSD
    'overnight-finance-usd',     // USD+
    
    // === Crypto-backed / Algorithmic USD ===
    'magic-internet-money',      // MIM
    'alchemix-usd',              // alUSD
    'origin-dollar',             // OUSD
    'fei-usd',                   // FEI
    'vai',                       // VAI
    'neutrino',                  // USDN
    'reserve',                   // RSV
    'rai',                       // RAI (floating peg but still stable)
    'bean',                      // BEAN
    'dola-usd',                  // DOLA
    'angle-usd',                 // USDA
    'gyroscope-gyd',             // GYD
    'fixed-forex-iron-bank-eur', // Fixed Forex
    
    // === Euro Stablecoins ===
    'stasis-eurs',               // EURS
    'euro-coin',                 // EURC
    'ageur',                     // agEUR
    'celo-euro',                 // cEUR
    'par-stablecoin',            // PAR
    'euroe-stablecoin',          // EUROe
    'tether-eurt',               // EURT
    'anchored-coins-eur',        // aEUR
    'seur',                      // sEUR
    'jarvis-synthetic-euro',     // jEUR
    
    // === Other Fiat Stablecoins ===
    'bidr',                      // BIDR (IDR)
    'gyen',                      // GYEN (JPY)
    'xsgd',                      // XSGD (SGD)
    'brz',                       // BRZ (BRL)
    'celo-real-creal',           // cREAL (BRL)
    'mxnt',                      // MXNT (MXN)
    'bilira',                    // TRYB (TRY)
    'gbpt',                      // GBPT (GBP)
    'cnht',                      // CNHT (CNY)
    'tgbp',                      // TGBP
    'qcad',                      // QCAD
    'cad-coin',                  // CADC
    'nzds',                      // NZDS
    'xidr',                      // XIDR
    'jpyc',                      // JPYC
    'vndc',                      // VNDC
    'thb-stablecoin',            // THBP
    
    // === Gold/Commodity-backed ===
    'tether-gold',               // XAUT
    'pax-gold',                  // PAXG
    'digix-gold-token',          // DGX
    'kinesis-gold',              // KAU
    'veraone',                   // VRO
    'cache-gold',                // CGT
    'gold-coin-reserve',         // GCR
    
    // === Yield-bearing stables (still pegged) ===
    'savings-dai',               // sDAI
    'wrapped-steth',             // might be confused with stables
    'compound-usdt',             // cUSDT
    'aave-usdc',                 // aUSDC
    'aave-usdt',                 // aUSDT
    'aave-dai',                  // aDAI
    'yearn-usdc',                // yUSDC
    'yearn-dai',                 // yDAI
    'angle-staked-usda',         // stUSD
    
    // === Tokenized Real-World Assets (pegged) ===
    'figure-heloc',              // FIGR_HELOC - tokenized home equity, pegged to $1
    
    // === Additional USD Stables (various) ===
    'fx-usd-savings',            // FXSAVE - f(x) USD Saving
    'fxsave',                    // FXSAVE alternate
    'f-x-protocol-fxusd',        // fxUSD
    'yousd',                     // YOUSD - Yield Optimizer USD
    'yield-optimizer-usd',       // YOUSD alternate
    'reusd',                     // REUSD - Re Protocol reUSD
    're-protocol-reusd',         // REUSD alternate
    'usda',                      // USDA
    'usda-2',                    // USDA alternate
    'angle-usda',                // USDA (Angle)
    'liusd',                     // LIUSD - infiniFi Locked iUSD
    'infinifi-locked-iusd',      // LIUSD alternate  
    'cap-usd',                   // CUSD - Cap USD
    'cusd-2',                    // CUSD alternate
    'fiusd',                     // FIUSD - Sygnum FIUSD
    'sygnum-platform-fiusd',     // FIUSD alternate
    'usdx-2',                    // USDX
    'stably-usd',                // USDS
    'sperax-usd',                // USDs (Sperax)
    'usd-mars',                  // USDm
    'usd-coin-wormhole',         // USDC (Wormhole)
    'usd-coin-avalanche-bridged-usdc-e', // USDC.e
    'bridged-usdc-polygon-pos-bridge',   // USDC bridged
  ];
  
  if (stablecoinIds.includes(idLower)) {
    return 'stable';
  }
  
  return 'other';
};

// Simple hash: FNV-1a on a string (fast, no crypto needed)
const fnv1a = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(36);
};

export default async function handler(req) {
  const CG_API_KEY = process.env.COINGECKO_API_KEY;
  
  if (!CG_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'COINGECKO_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🚀 Starting enhanced data fetch...');
    const startTime = Date.now();
    
    // Fetch base CoinGecko data (4 pages = 1000 tokens)
    const pages = [1, 2, 3, 4];
    const allData = [];
    
    for (const page of pages) {
      const cgRes = await fetch(
        'https://pro-api.coingecko.com/api/v3/coins/markets?' + new URLSearchParams({
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: '250',
          page: String(page),
          sparkline: 'true',
          price_change_percentage: '1h,24h,7d,30d',
        }),
        {
          headers: {
            'x-cg-pro-api-key': CG_API_KEY,
            'Accept': 'application/json',
          },
        }
      );
      
      if (!cgRes.ok) {
        throw new Error(`CoinGecko API error: ${cgRes.status}`);
      }
      
      const pageData = await cgRes.json();
      allData.push(...pageData);
      
      // Add delay between requests to avoid rate limiting
      if (page < 4) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    // Deduplicate
    const seenIds = new Set();
    const dedupedData = allData.filter(coin => {
      if (seenIds.has(coin.id)) return false;
      seenIds.add(coin.id);
      return true;
    });
    
    console.log(`✅ Fetched ${dedupedData.length} tokens from CoinGecko`);
    
    const totalMcap = dedupedData.reduce((sum, c) => sum + (c.market_cap || 0), 0);

    // Process base token data
    const baseTokens = dedupedData.map((coin, index) => {
      const sparklineData = coin.sparkline_in_7d?.price || [];
      const rsi = calculateRSI(sparklineData, 14);
      
      let normalizedSparkline = [];
      if (sparklineData.length > 0) {
        const startPrice = sparklineData[0];
        normalizedSparkline = sparklineData.map(p => (p / startPrice) * 100);
      }
      
      const category = getCategoryFromMetadata(coin.id, coin.name, coin.symbol);
      
      // Additional check: detect likely stablecoins by price behavior
      // Catches USD-pegged stables not in the explicit allowlist
      const symbolUpper = (coin.symbol || '').toUpperCase();
      const nameUpper = (coin.name || '').toUpperCase();
      const idLower = (coin.id || '').toLowerCase();
      
      // Direct symbol match for known stablecoins (case insensitive)
      const stableSymbolsExact = [
        'usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'gusd', 'frax', 
        'lusd', 'susd', 'mim', 'ust', 'fei', 'usdd', 'usde', 'pyusd',
        'eurs', 'eurt', 'eurc', 'ageur', 'ceur', 'jeur', 'gho', 'crvusd',
        'usdm', 'usdy', 'usd0', 'usdr', 'usdb', 'usdj', 'usdn', 'usdx',
        'usdk', 'usk', 'vai', 'bob', 'dola', 'hai', 'silk', 'djed',
        'paxg', 'xaut', 'cusd', 'fdusd', 'alusd', 'ousd', 'musd',
        'fxsave', 'yousd', 'reusd', 'usda', 'liusd', 'fiusd', 'usdz',
        'usdl', 'usds', 'usdq', 'usdfl', 'zusd', 'husd', 'nusd', 'pusd',
        'vusd', 'eusd', 'rusd', 'wusd', 'kusd', 'iusd', 'tusd', 'dusd'
      ];
      const symbolLower = (coin.symbol || '').toLowerCase();
      const isKnownStableSymbol = stableSymbolsExact.includes(symbolLower);
      
      // Check for stablecoin patterns in name/symbol/id
      const hasStablePattern = (
        // Symbol patterns for USD stables
        /^USD|USD$|USDT|USDC|USDS|USDX|TUSD|BUSD|GUSD|DUSD|LUSD|MUSD|PUSD|SUSD|VUSD|CUSD|EUSD|FUSD|HUSD|IUSD|KUSD|NUSD|OUSD|RUSD|WUSD|YUSD|ZUSD|^UST$|^DAI$|^FRAX$|^FEI$|^MIM$|^RAI$|^USR$|^USK$|^USS$|^USX$|^GHO$|^DOLA$|^CGUSD|^USDF|^USP$|^USDJ$|^USDN$|^USDP$|^USDQ$|^USDL$|^USDB$|^USDV$|^USDW$|^USDZ$|^SILK$|^USDK$|^BOB$|^HAY$|^ALUSD$|^CUSD$|^CEUR$|^DJED$|^EURT$|^EURS$|^EURC$|^AGEUR$|^SEUR$|^JEUR$|^USDFL$|^FXSAVE$|^YOUSD$|^REUSD$|^USDA$|^LIUSD$|^FIUSD$|^USDM$/i.test(symbolUpper) ||
        // Name patterns
        /STABLECOIN|STABLE COIN|USD COIN|DOLLAR|TETHER|PEGGED|SYNTH.*USD|USD.*SYNTH|USD SAVING|YIELD.*USD|LOCKED.*USD|CAP USD|OPTIMIZER USD/i.test(nameUpper) ||
        // ID patterns
        /stablecoin|stable-|pegged|-usd$|^usd-|-dollar|tether|usdt|usdc|reusd|yousd|liusd|fiusd|fxsave|cap-usd/i.test(idLower)
      );
      
      const looksLikeUsdStable = (
        coin.current_price >= 0.95 && 
        coin.current_price <= 1.10 &&
        Math.abs(coin.price_change_percentage_24h_in_currency || 0) < 2 &&
        Math.abs(coin.price_change_percentage_7d_in_currency || 0) < 5 &&
        (hasStablePattern || isKnownStableSymbol)
      );
      
      // Pure price-based detection for obvious stables (very tight price + low volatility)
      // This catches stables even without matching name patterns
      const isPriceStable = (
        coin.current_price >= 0.98 && 
        coin.current_price <= 1.02 &&
        Math.abs(coin.price_change_percentage_24h_in_currency || 0) < 0.5 &&
        Math.abs(coin.price_change_percentage_7d_in_currency || 0) < 1
      );
      
      // Known stablecoin symbols with price in stable range (more lenient)
      const isStableBySymbolAndPrice = (
        isKnownStableSymbol &&
        coin.current_price >= 0.90 && 
        coin.current_price <= 1.15
      );
      
      // Euro stables (~1.05-1.15 USD typically)
      const looksLikeEurStable = (
        coin.current_price >= 1.00 && 
        coin.current_price <= 1.20 &&
        Math.abs(coin.price_change_percentage_24h_in_currency || 0) < 1.5 &&
        Math.abs(coin.price_change_percentage_7d_in_currency || 0) < 3 &&
        /EUR|EURS|EURC|EURT|AGEUR|CEUR|JEUR|SEUR|PAR|EUROE/i.test(symbolUpper)
      );
      
      const looksLikeStablecoin = looksLikeUsdStable || looksLikeEurStable || isPriceStable || isStableBySymbolAndPrice;
      
      const finalCategory = looksLikeStablecoin ? 'stable' : category;
      
      return {
        id: coin.id,
        cgId: coin.id,
        symbol: coin.symbol?.toUpperCase(),
        name: coin.name,
        rank: coin.market_cap_rank || index + 1,
        price: coin.current_price,
        mcap: coin.market_cap,
        volume: coin.total_volume,
        change1h: coin.price_change_percentage_1h_in_currency,
        change24h: coin.price_change_percentage_24h_in_currency,
        change7d: coin.price_change_percentage_7d_in_currency,
        change30d: coin.price_change_percentage_30d_in_currency,
        supply: coin.circulating_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athChange: coin.ath_change_percentage,
        athDate: coin.ath_date,
        atl: coin.atl,
        atlChange: coin.atl_change_percentage,
        atlDate: coin.atl_date,
        dominance: coin.market_cap ? (coin.market_cap / totalMcap) * 100 : 0,
        rsi: rsi,
        sparkline: normalizedSparkline,
        sparklineRaw: sparklineData,
        image: coin.image,
        category: finalCategory,
        volMcap: coin.market_cap ? (coin.total_volume / coin.market_cap) * 100 : 0,
      };
    });
    
    console.log(`🔄 Enhancing top 250 tokens with exchange data...`);
    
    // Enhance top 250 tokens with exchange data (in batches)
    const tokensToEnhance = baseTokens.slice(0, 250);
    const batches = chunk(tokensToEnhance, 25); // 25 tokens per batch
    const enhancedTokens = [];
    
    let batchNum = 0;
    for (const batch of batches) {
      batchNum++;
      console.log(`  Batch ${batchNum}/${batches.length}...`);
      
      const batchResults = await Promise.all(
        batch.map(token => enhanceToken(token))
      );
      
      enhancedTokens.push(...batchResults);
      
      // Small delay to respect rate limits
      if (batchNum < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Remaining tokens without enhancement
    const remainingTokens = baseTokens.slice(250).map(token => {
      // Skip signal calculation for stablecoins
      if (token.category === 'stable') {
        return {
          ...token,
          signals: null,
          signalScore: null,
          signalLabel: null,
          signalStrength: null,
          signalScoreDetails: null,
          enhanced: false,
          isStablecoin: true,
        };
      }
      
      const volMcapRatio = token.mcap > 0 ? (token.volume / token.mcap) * 100 : null;
      
      // Use sparkline data as fallback for SMA/BB calculations
      let sma50 = null;
      let sma20 = null;
      let bb = null;
      let nearATH = null;
      
      if (token.sparklineRaw && token.sparklineRaw.length >= 50) {
        sma50 = calculateSMA(token.sparklineRaw, 50);
        sma20 = calculateSMA(token.sparklineRaw, 20);
        bb = calculateBollingerBands(token.sparklineRaw, 20, 2);
        const maxPrice = Math.max(...token.sparklineRaw);
        nearATH = token.price >= maxPrice * 0.9;
      }
      
      const signals = {
        // Buy signals (oversold)
        rsiOversold: token.rsi !== null && token.rsi < 30,
        rsiExtreme: token.rsi !== null && token.rsi < 25,
        aboveSMA50: sma50 ? token.price > sma50 : null,
        belowBB: bb ? token.price < bb.lower : null,
        volumeSpike: null,
        hasFunding: null,
        negativeFunding: null,
        bullishDivergence: null,
        bullishEngulfing: null,
        // Sell signals (overbought)
        rsiOverbought: token.rsi !== null && token.rsi > 70,
        rsiOverboughtExtreme: token.rsi !== null && token.rsi > 80,
        belowSMA50: sma50 ? token.price < sma50 : null,
        belowSMA20: sma20 ? token.price < sma20 : null,
        aboveBB: bb ? token.price > bb.upper : null,
        positiveFunding: null,
        bearishDivergence: null,
        bearishEngulfing: null,
        nearATH: nearATH,
        highVolMcap: volMcapRatio !== null && volMcapRatio > 10,
      };
      
      const signalScoreData = calculateSignalScore(token, signals, null, {
        sma50,
        bollingerBands: bb,
        volumeRatio: null,
      });
      
      return {
        ...token,
        signals,
        signalScore: signalScoreData.score,
        signalLabel: signalScoreData.label,
        signalStrength: signalScoreData.strength,
        signalScoreDetails: signalScoreData,
        enhanced: false,
      };
    });
    
    // Combine all tokens and filter out stablecoins
    const allTokensRaw = [...enhancedTokens, ...remainingTokens];
    const allTokens = allTokensRaw.filter(t => t.category !== 'stable' && !t.isStablecoin);
    const stablecoinsRemoved = allTokensRaw.length - allTokens.length;
    const enhancedCount = enhancedTokens.filter(t => t.enhanced && t.category !== 'stable').length;
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Enhanced ${enhancedCount}/${allTokens.length} tokens in ${duration}s (removed ${stablecoinsRemoved} stablecoins)`);
    
    const timestamp = new Date().toISOString();
    const withRSI   = allTokens.filter(t => t.rsi !== null).length;
    
    // Build a lightweight fingerprint so CDN + clients can use ETags
    // Fingerprint = hash of: timestamp + token count + sum of first 20 prices (changes when market moves)
    const priceProbe = allTokens.slice(0, 20).reduce((s, t) => s + (t.price || 0), 0).toFixed(2);
    const fingerprint = fnv1a(`${timestamp}|${allTokens.length}|${priceProbe}`);
    const etag = `"${fingerprint}"`;

    // If the client already has this exact version, return 304 (no body)
    const clientETag = req.headers?.get ? req.headers.get('if-none-match') : (req.headers?.['if-none-match'] ?? null);
    if (clientETag && clientETag === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    return new Response(
      JSON.stringify({
        tokens: allTokens,
        timestamp,
        source: 'coingecko+exchanges',
        version: '2.1-no-stablecoins',
        stats: {
          total: allTokens.length,
          enhanced: enhancedCount,
          withRSI,
          stablecoinsRemoved: stablecoinsRemoved,
          duration: `${duration}s`,
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
          'ETag': etag,
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('Enhanced API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
