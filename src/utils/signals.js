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
export const calculateSignalScore = (data) => {
  let score = 0;
  const activeSignals = [];
  
  // ============ RSI (Mutually Exclusive) ============
  if (data.rsi !== null && data.rsi !== undefined) {
    if (data.rsi < 20) {
      score += 30;
      activeSignals.push({ name: 'RSI Extreme Oversold', value: data.rsi, points: +30, type: 'bullish' });
    } else if (data.rsi < 30) {
      score += 20;
      activeSignals.push({ name: 'RSI Oversold', value: data.rsi, points: +20, type: 'bullish' });
    } else if (data.rsi < 40) {
      score += 8;
      activeSignals.push({ name: 'RSI Weak', value: data.rsi, points: +8, type: 'bullish' });
    } else if (data.rsi > 80) {
      score -= 25;
      activeSignals.push({ name: 'RSI Extreme Overbought', value: data.rsi, points: -25, type: 'bearish' });
    } else if (data.rsi > 70) {
      score -= 15;
      activeSignals.push({ name: 'RSI Overbought', value: data.rsi, points: -15, type: 'bearish' });
    } else if (data.rsi > 60) {
      score -= 5;
      activeSignals.push({ name: 'RSI Strong', value: data.rsi, points: -5, type: 'bearish' });
    }
  }
  
  // ============ Trend - SMA50 (Mutually Exclusive) ============
  if (data.price && data.sma50) {
    if (data.price > data.sma50) {
      score += 25;
      activeSignals.push({ name: 'Above SMA50 (Uptrend)', points: +25, type: 'bullish' });
    } else {
      score -= 15;
      activeSignals.push({ name: 'Below SMA50 (Downtrend)', points: -15, type: 'bearish' });
    }
  }
  
  // ============ Bollinger Bands (Mutually Exclusive) ============
  if (data.price && data.bollingerBands) {
    if (data.price < data.bollingerBands.lower) {
      score += 15;
      activeSignals.push({ name: 'Below Lower BB', points: +15, type: 'bullish' });
    } else if (data.price > data.bollingerBands.upper) {
      score -= 15;
      activeSignals.push({ name: 'Above Upper BB', points: -15, type: 'bearish' });
    }
  }
  
  // ============ Volume Spike ============
  if (data.volumeRatio && data.volumeRatio > 1.5) {
    if (data.rsi !== null && data.rsi < 40) {
      score += 12;
      activeSignals.push({ name: 'Volume Spike (Accumulation)', points: +12, type: 'bullish' });
    } else if (data.rsi !== null && data.rsi > 60) {
      score -= 8;
      activeSignals.push({ name: 'Volume Spike (Distribution)', points: -8, type: 'bearish' });
    } else {
      score += 5;
      activeSignals.push({ name: 'Volume Spike', points: +5, type: 'neutral' });
    }
  }
  
  // ============ Funding Rate ============
  if (data.fundingRate !== undefined && data.fundingRate !== null) {
    if (data.fundingRate < -0.01) {
      score += 15;
      activeSignals.push({ name: 'Strong Negative Funding', value: data.fundingRate, points: +15, type: 'bullish' });
    } else if (data.fundingRate < 0) {
      score += 10;
      activeSignals.push({ name: 'Negative Funding', value: data.fundingRate, points: +10, type: 'bullish' });
    } else if (data.fundingRate > 0.03) {
      score -= 12;
      activeSignals.push({ name: 'Strong Positive Funding', value: data.fundingRate, points: -12, type: 'bearish' });
    } else if (data.fundingRate > 0.01) {
      score -= 8;
      activeSignals.push({ name: 'Positive Funding', value: data.fundingRate, points: -8, type: 'bearish' });
    }
  }
  
  // ============ Divergence ============
  if (data.divergence) {
    if (data.divergence.bullish) {
      score += 18;
      activeSignals.push({ name: 'Bullish Divergence', points: +18, type: 'bullish' });
    }
    if (data.divergence.bearish) {
      score -= 18;
      activeSignals.push({ name: 'Bearish Divergence', points: -18, type: 'bearish' });
    }
  }
  
  // ============ Additional Context ============
  if (data.nearATH === true) {
    score -= 10;
    activeSignals.push({ name: 'Near All-Time High', points: -10, type: 'bearish' });
  }
  
  if (data.volMcapRatio !== undefined && data.volMcapRatio !== null && data.volMcapRatio > 10) {
    if (data.rsi !== null && data.rsi < 35) {
      score += 5;
      activeSignals.push({ name: 'High Vol/MCap (Accumulation)', points: +5, type: 'bullish' });
    } else if (data.rsi !== null && data.rsi > 65) {
      score -= 8;
      activeSignals.push({ name: 'High Vol/MCap (Distribution)', points: -8, type: 'bearish' });
    }
  }
  
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
  
  return {
    score,
    label,
    strength,
    activeSignals,
    signalCount: activeSignals.length,
    bullishCount: activeSignals.filter(s => s.type === 'bullish').length,
    bearishCount: activeSignals.filter(s => s.type === 'bearish').length,
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
