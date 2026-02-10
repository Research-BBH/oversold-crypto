// ==================================================
// FILE: src/utils/signals.js - Advanced Trading Signals
// ==================================================

/**
 * Calculate Simple Moving Average
 */
export const calculateSMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

/**
 * Calculate Bollinger Bands
 * Returns { upper, middle, lower }
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
 * Returns { bullish: boolean, bearish: boolean }
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
 * Calculate market cap reliability tier
 */
export const getMarketCapReliability = (marketCap) => {
  if (marketCap > 10_000_000_000) { // >$10B
    return {
      tier: 'HIGHLY_RELIABLE',
      color: 'green',
      confidence: 'HIGH',
      description: 'Top tier - signals highly reliable'
    };
  } else if (marketCap > 1_000_000_000) { // $1B-$10B
    return {
      tier: 'RELIABLE',
      color: 'blue',
      confidence: 'GOOD',
      description: 'Large cap - signals reliable'
    };
  } else if (marketCap > 200_000_000) { // $200M-$1B
    return {
      tier: 'MODERATELY_RELIABLE',
      color: 'yellow',
      confidence: 'MODERATE',
      description: 'Mid cap - use adjusted thresholds'
    };
  } else if (marketCap > 50_000_000) { // $50M-$200M
    return {
      tier: 'UNRELIABLE',
      color: 'orange',
      confidence: 'LOW',
      description: 'Small cap - signals less reliable'
    };
  } else { // <$50M
    return {
      tier: 'HIGHLY_UNRELIABLE',
      color: 'red',
      confidence: 'VERY_LOW',
      description: 'Micro cap - avoid technical signals'
    };
  }
};

/**
 * Calculate unified momentum score (-100 to +100)
 * Positive = Bullish, Negative = Bearish, Near zero = Neutral
 */
// ============================================================
// SYMMETRICAL SIGNAL SCORING SYSTEM
// 8 signal pairs, each with equal bullish/bearish weights
// Max possible: +100 bullish / -100 bearish (perfectly balanced)
// ============================================================

const SIGNAL_WEIGHTS = {
  RSI: 25,
  RSI_EXTREME: 10,
  TREND: 20,
  BOLLINGER: 15,
  FUNDING: 15,
  DIVERGENCE: 15,
  ENGULFING: 10,
  PRICE_POSITION: 10,
  VOLUME: 10,
};

export const calculateSignalScore = (data) => {
  let score = 0;
  const activeSignals = [];
  const signalPairs = [];
  
  // ============ 1. RSI Level (±25 base, ±10 extreme bonus) ============
  const rsiPair = {
    name: 'RSI Level',
    bullish: { label: 'Oversold (<25)', weight: SIGNAL_WEIGHTS.RSI, active: false, value: null },
    bearish: { label: 'Overbought (>75)', weight: SIGNAL_WEIGHTS.RSI, active: false, value: null },
  };
  
  if (data.rsi !== null && data.rsi !== undefined) {
    if (data.rsi < 25) {
      const isExtreme = data.rsi < 20;
      const points = SIGNAL_WEIGHTS.RSI + (isExtreme ? SIGNAL_WEIGHTS.RSI_EXTREME : 0);
      score += points;
      activeSignals.push({ 
        name: isExtreme ? 'RSI Extreme Oversold' : 'RSI Oversold', 
        value: data.rsi, 
        points: +points,
        type: 'bullish'
      });
      rsiPair.bullish.active = true;
      rsiPair.bullish.value = data.rsi;
      rsiPair.bullish.points = points;
    } else if (data.rsi > 75) {
      const isExtreme = data.rsi > 80;
      const points = SIGNAL_WEIGHTS.RSI + (isExtreme ? SIGNAL_WEIGHTS.RSI_EXTREME : 0);
      score -= points;
      activeSignals.push({ 
        name: isExtreme ? 'RSI Extreme Overbought' : 'RSI Overbought', 
        value: data.rsi, 
        points: -points,
        type: 'bearish'
      });
      rsiPair.bearish.active = true;
      rsiPair.bearish.value = data.rsi;
      rsiPair.bearish.points = points;
    }
  }
  signalPairs.push(rsiPair);
  
  // ============ 2. Trend - SMA50 (±20) ============
  const trendPair = {
    name: 'Trend (SMA50)',
    bullish: { label: 'Uptrend', weight: SIGNAL_WEIGHTS.TREND, active: false },
    bearish: { label: 'Downtrend', weight: SIGNAL_WEIGHTS.TREND, active: false },
    unavailable: !data.price || !data.sma50,
  };
  
  if (data.price && data.sma50) {
    if (data.price > data.sma50) {
      score += SIGNAL_WEIGHTS.TREND;
      activeSignals.push({ name: 'Above SMA50 (Uptrend)', points: +SIGNAL_WEIGHTS.TREND, type: 'bullish' });
      trendPair.bullish.active = true;
      trendPair.bullish.points = SIGNAL_WEIGHTS.TREND;
    } else {
      score -= SIGNAL_WEIGHTS.TREND;
      activeSignals.push({ name: 'Below SMA50 (Downtrend)', points: -SIGNAL_WEIGHTS.TREND, type: 'bearish' });
      trendPair.bearish.active = true;
      trendPair.bearish.points = SIGNAL_WEIGHTS.TREND;
    }
  }
  signalPairs.push(trendPair);
  
  // ============ 3. Bollinger Bands (±15) ============
  const bbPair = {
    name: 'Bollinger Bands',
    bullish: { label: 'Below Lower', weight: SIGNAL_WEIGHTS.BOLLINGER, active: false },
    bearish: { label: 'Above Upper', weight: SIGNAL_WEIGHTS.BOLLINGER, active: false },
    unavailable: !data.price || !data.bollingerBands,
  };
  
  if (data.price && data.bollingerBands) {
    if (data.price < data.bollingerBands.lower) {
      score += SIGNAL_WEIGHTS.BOLLINGER;
      activeSignals.push({ name: 'Below Lower BB', points: +SIGNAL_WEIGHTS.BOLLINGER, type: 'bullish' });
      bbPair.bullish.active = true;
      bbPair.bullish.points = SIGNAL_WEIGHTS.BOLLINGER;
    } else if (data.price > data.bollingerBands.upper) {
      score -= SIGNAL_WEIGHTS.BOLLINGER;
      activeSignals.push({ name: 'Above Upper BB', points: -SIGNAL_WEIGHTS.BOLLINGER, type: 'bearish' });
      bbPair.bearish.active = true;
      bbPair.bearish.points = SIGNAL_WEIGHTS.BOLLINGER;
    }
  }
  signalPairs.push(bbPair);
  
  // ============ 4. Funding Rate (±15) ============
  const fundingPair = {
    name: 'Funding Rate',
    bullish: { label: 'Negative', weight: SIGNAL_WEIGHTS.FUNDING, active: false },
    bearish: { label: 'Positive', weight: SIGNAL_WEIGHTS.FUNDING, active: false },
    unavailable: data.fundingRate === null || data.fundingRate === undefined,
  };
  
  if (data.fundingRate !== null && data.fundingRate !== undefined) {
    if (data.fundingRate < -0.005) {
      score += SIGNAL_WEIGHTS.FUNDING;
      activeSignals.push({ name: 'Negative Funding', value: data.fundingRate, points: +SIGNAL_WEIGHTS.FUNDING, type: 'bullish' });
      fundingPair.bullish.active = true;
      fundingPair.bullish.points = SIGNAL_WEIGHTS.FUNDING;
    } else if (data.fundingRate > 0.01) {
      score -= SIGNAL_WEIGHTS.FUNDING;
      activeSignals.push({ name: 'Positive Funding', value: data.fundingRate, points: -SIGNAL_WEIGHTS.FUNDING, type: 'bearish' });
      fundingPair.bearish.active = true;
      fundingPair.bearish.points = SIGNAL_WEIGHTS.FUNDING;
    }
  }
  signalPairs.push(fundingPair);
  
  // ============ 5. RSI Divergence (±15) ============
  const divPair = {
    name: 'RSI Divergence',
    bullish: { label: 'Bullish', weight: SIGNAL_WEIGHTS.DIVERGENCE, active: false },
    bearish: { label: 'Bearish', weight: SIGNAL_WEIGHTS.DIVERGENCE, active: false },
    unavailable: !data.divergence,
  };
  
  if (data.divergence) {
    if (data.divergence.bullish) {
      score += SIGNAL_WEIGHTS.DIVERGENCE;
      activeSignals.push({ name: 'Bullish Divergence', points: +SIGNAL_WEIGHTS.DIVERGENCE, type: 'bullish' });
      divPair.bullish.active = true;
      divPair.bullish.points = SIGNAL_WEIGHTS.DIVERGENCE;
    }
    if (data.divergence.bearish) {
      score -= SIGNAL_WEIGHTS.DIVERGENCE;
      activeSignals.push({ name: 'Bearish Divergence', points: -SIGNAL_WEIGHTS.DIVERGENCE, type: 'bearish' });
      divPair.bearish.active = true;
      divPair.bearish.points = SIGNAL_WEIGHTS.DIVERGENCE;
    }
  }
  signalPairs.push(divPair);
  
  // ============ 6. Candlestick Patterns (±10) ============
  const candlePair = {
    name: 'Candlestick',
    bullish: { label: 'Bullish Engulfing', weight: SIGNAL_WEIGHTS.ENGULFING, active: false },
    bearish: { label: 'Bearish Engulfing', weight: SIGNAL_WEIGHTS.ENGULFING, active: false },
    unavailable: true, // Not available on frontend
  };
  signalPairs.push(candlePair);
  
  // ============ 7. Price Position - ATL/ATH (±10) ============
  const positionPair = {
    name: 'Price Position',
    bullish: { label: 'Near ATL', weight: SIGNAL_WEIGHTS.PRICE_POSITION, active: false },
    bearish: { label: 'Near ATH', weight: SIGNAL_WEIGHTS.PRICE_POSITION, active: false },
  };
  
  const nearATL = data.atlChange !== undefined && data.atlChange !== null && data.atlChange <= 20;
  const nearATH = data.nearATH === true;
  
  if (nearATL && !nearATH) {
    score += SIGNAL_WEIGHTS.PRICE_POSITION;
    activeSignals.push({ name: 'Near All-Time Low', points: +SIGNAL_WEIGHTS.PRICE_POSITION, type: 'bullish' });
    positionPair.bullish.active = true;
    positionPair.bullish.points = SIGNAL_WEIGHTS.PRICE_POSITION;
  } else if (nearATH && !nearATL) {
    score -= SIGNAL_WEIGHTS.PRICE_POSITION;
    activeSignals.push({ name: 'Near All-Time High', points: -SIGNAL_WEIGHTS.PRICE_POSITION, type: 'bearish' });
    positionPair.bearish.active = true;
    positionPair.bearish.points = SIGNAL_WEIGHTS.PRICE_POSITION;
  }
  signalPairs.push(positionPair);
  
  // ============ 8. Volume Analysis (±10) ============
  const volumePair = {
    name: 'Volume',
    bullish: { label: 'Accumulation', weight: SIGNAL_WEIGHTS.VOLUME, active: false },
    bearish: { label: 'Distribution', weight: SIGNAL_WEIGHTS.VOLUME, active: false },
    unavailable: !data.volumeRatio,
  };
  
  if (data.volumeRatio && data.volumeRatio > 1.5) {
    if (data.rsi !== null && data.rsi < 35) {
      score += SIGNAL_WEIGHTS.VOLUME;
      activeSignals.push({ name: 'Volume Accumulation', points: +SIGNAL_WEIGHTS.VOLUME, type: 'bullish' });
      volumePair.bullish.active = true;
      volumePair.bullish.points = SIGNAL_WEIGHTS.VOLUME;
    } else if (data.rsi !== null && data.rsi > 65) {
      score -= SIGNAL_WEIGHTS.VOLUME;
      activeSignals.push({ name: 'Volume Distribution', points: -SIGNAL_WEIGHTS.VOLUME, type: 'bearish' });
      volumePair.bearish.active = true;
      volumePair.bearish.points = SIGNAL_WEIGHTS.VOLUME;
    }
  }
  signalPairs.push(volumePair);
  
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
  
  const bullishTotal = activeSignals.filter(s => s.points > 0).reduce((sum, s) => sum + s.points, 0);
  const bearishTotal = Math.abs(activeSignals.filter(s => s.points < 0).reduce((sum, s) => sum + s.points, 0));
  
  return {
    score,
    label,
    strength,
    activeSignals,
    signalPairs,
    signalCount: activeSignals.length,
    bullishCount: activeSignals.filter(s => s.type === 'bullish').length,
    bearishCount: activeSignals.filter(s => s.type === 'bearish').length,
    bullishTotal,
    bearishTotal,
    maxPossible: 100,
  };
};

// Legacy function for backward compatibility - redirects to unified score
export const calculateSellSignalScore = (data) => {
  const result = calculateSignalScore(data);
  // Return in old format for any code still using this
  return {
    score: result.score < 0 ? Math.abs(result.score) : 0,
    signals: result.activeSignals.filter(s => s.type === 'bearish'),
    activeCount: result.bearishCount,
    totalSignals: 9,
    availableSignals: 9
  };
};

/**
 * Get signal strength tier based on unified score (-100 to +100)
 */
export const getSignalStrength = (score) => {
  if (score >= 50) {
    return {
      level: 'STRONG_BUY',
      color: 'green',
      label: 'STRONG BUY',
      description: 'Multiple bullish signals aligned',
      positionSize: 'FULL',
      confidence: 'HIGH'
    };
  } else if (score >= 25) {
    return {
      level: 'BUY',
      color: 'emerald',
      label: 'BUY',
      description: 'Moderate bullish signals',
      positionSize: 'MEDIUM',
      confidence: 'MODERATE'
    };
  } else if (score > -25) {
    return {
      level: 'NEUTRAL',
      color: 'gray',
      label: 'NEUTRAL',
      description: 'Mixed or weak signals',
      positionSize: 'SMALL',
      confidence: 'LOW'
    };
  } else if (score > -50) {
    return {
      level: 'SELL',
      color: 'orange',
      label: 'SELL',
      description: 'Moderate bearish signals',
      positionSize: 'REDUCE',
      confidence: 'MODERATE'
    };
  } else {
    return {
      level: 'STRONG_SELL',
      color: 'red',
      label: 'STRONG SELL',
      description: 'Multiple bearish signals aligned',
      positionSize: 'EXIT',
      confidence: 'HIGH'
    };
  }
};

/**
 * Analyze token with all signals
 */
export const analyzeToken = (token, historicalData = null) => {
  const analysis = {
    token: token.symbol,
    price: token.price,
    rsi: token.rsi,
    signals: {}
  };
  
  // Basic signals from token data
  analysis.signals.rsi = token.rsi !== null && token.rsi < 30;
  
  // Calculate additional signals if historical data available
  if (historicalData && historicalData.prices && historicalData.prices.length > 50) {
    const prices = historicalData.prices;
    const volumes = historicalData.volumes || [];
    
    // SMA 50
    const sma50 = calculateSMA(prices, 50);
    analysis.sma50 = sma50;
    analysis.signals.aboveSMA = token.price > sma50;
    analysis.signals.aboveSMA50 = token.price > sma50; // For buy signals
    analysis.signals.belowSMA50 = token.price < sma50; // For sell signals
    
    // SMA 20 (for sell signals)
    const sma20 = calculateSMA(prices, 20);
    analysis.sma20 = sma20;
    analysis.signals.belowSMA20 = sma20 ? token.price < sma20 : null;
    
    // Bollinger Bands
    const bb = calculateBollingerBands(prices, 20, 2);
    analysis.bollingerBands = bb;
    analysis.signals.belowBB = bb && token.price < bb.lower;
    analysis.signals.aboveBB = bb ? token.price > bb.upper : null; // For sell signals
    
    // Volume
    if (volumes.length > 20) {
      const volumeRatio = calculateVolumeRatio(volumes, 20);
      analysis.volumeRatio = volumeRatio;
      analysis.signals.volumeSpike = volumeRatio > 1.5;
    }
    
    // Divergence (if we have RSI history)
    if (historicalData.rsiValues && historicalData.rsiValues.length > 20) {
      const divergence = detectRSIDivergence(prices, historicalData.rsiValues, 20);
      analysis.divergence = divergence;
      analysis.signals.bullishDivergence = divergence.bullish;
      analysis.signals.bearishDivergence = divergence.bearish;
    }
    
    // Near ATH calculation (within 10% of max price from available data)
    if (prices.length > 0) {
      const maxPrice = Math.max(...prices);
      analysis.signals.nearATH = token.price >= maxPrice * 0.9;
    }
    
    // Engulfing patterns require OHLC data which we don't have on frontend
    analysis.signals.bullishEngulfing = null;
    analysis.signals.bearishEngulfing = null;
    
    // Funding Rate (if available from exchange data)
    if (historicalData.fundingRate !== undefined && historicalData.fundingRate !== null) {
      analysis.fundingRate = historicalData.fundingRate;
      analysis.signals.negativeFunding = historicalData.fundingRate < 0;
      analysis.signals.positiveFunding = historicalData.fundingRate > 0.01;
      analysis.signals.hasFunding = true;
    }
  }
  
  // Calculate Vol/MCap ratio for sell signals
  const volMcapRatio = token.mcap > 0 ? (token.volume / token.mcap) * 100 : null;
  analysis.volMcapRatio = volMcapRatio;
  analysis.signals.highVolMcap = volMcapRatio !== null && volMcapRatio > 10;

  // Calculate unified score
  const scoreData = {
    rsi: token.rsi,
    price: token.price,
    sma50: analysis.sma50,
    sma20: analysis.sma20,
    bollingerBands: analysis.bollingerBands,
    volumeRatio: analysis.volumeRatio,
    divergence: analysis.divergence,
    fundingRate: analysis.fundingRate,
    volMcapRatio: analysis.volMcapRatio,
    nearATH: analysis.signals.nearATH
  };
  
  const scoreResult = calculateSignalScore(scoreData);
  analysis.score = scoreResult.score;
  analysis.signalLabel = scoreResult.label;
  analysis.signalStrength = scoreResult.strength;
  
  // Store the full result including signals array
  analysis.signalDetails = {
    score: scoreResult.score,
    label: scoreResult.label,
    strength: scoreResult.strength,
    activeSignals: scoreResult.activeSignals,
    signalCount: scoreResult.signalCount,
    bullishCount: scoreResult.bullishCount,
    bearishCount: scoreResult.bearishCount
  };
  analysis.strength = getSignalStrength(scoreResult.score);
  
  // Market cap reliability
  if (token.mcap) {
    analysis.reliability = getMarketCapReliability(token.mcap);
  }
  
  return analysis;
};

/**
 * Get buy recommendation based on all factors
 */
export const getBuyRecommendation = (analysis) => {
  const { score, reliability } = analysis;
  
  // Adjust recommendation based on market cap reliability
  let adjustedScore = score;
  
  if (reliability) {
    switch (reliability.tier) {
      case 'HIGHLY_RELIABLE':
        // No adjustment for large caps
        break;
      case 'RELIABLE':
        adjustedScore *= 0.95; // Slight reduction
        break;
      case 'MODERATELY_RELIABLE':
        adjustedScore *= 0.85; // More conservative
        break;
      case 'UNRELIABLE':
        adjustedScore *= 0.70; // Much more conservative
        break;
      case 'HIGHLY_UNRELIABLE':
        adjustedScore *= 0.50; // Avoid
        break;
    }
  }
  
  if (adjustedScore >= 75) {
    return {
      action: 'STRONG_BUY',
      emoji: '🟢',
      confidence: 'Very High',
      message: 'Excellent buying opportunity with multiple confirmations'
    };
  } else if (adjustedScore >= 60) {
    return {
      action: 'BUY',
      emoji: '🔵',
      confidence: 'High',
      message: 'Good buying opportunity with solid confirmations'
    };
  } else if (adjustedScore >= 45) {
    return {
      action: 'CONSIDER',
      emoji: '🟡',
      confidence: 'Moderate',
      message: 'Potential opportunity, but wait for more confirmation'
    };
  } else {
    return {
      action: 'WAIT',
      emoji: '⚪',
      confidence: 'Low',
      message: 'Insufficient signals - better opportunities available'
    };
  }
};

/**
 * Constants for thresholds by market cap
 */
export const MARKET_CAP_THRESHOLDS = {
  LARGE_CAP: {
    min: 5_000_000_000,
    rsiThreshold: 30,
    signalsRequired: 3,
    volumeMultiplier: 1.5,
    name: 'Large Cap'
  },
  MID_CAP: {
    min: 500_000_000,
    max: 5_000_000_000,
    rsiThreshold: 25,
    signalsRequired: 4,
    volumeMultiplier: 2.0,
    name: 'Mid Cap'
  },
  SMALL_CAP: {
    max: 500_000_000,
    rsiThreshold: 20,
    signalsRequired: 4,
    volumeMultiplier: 2.5,
    name: 'Small Cap',
    warning: 'High risk - technical signals less reliable'
  }
};
