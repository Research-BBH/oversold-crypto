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
 * Calculate comprehensive signal score (0-100)
 */
export const calculateSignalScore = (data) => {
  let score = 0;
  const signals = [];
  
  // 1. RSI Signal (25 points base, +5 for extreme)
  if (data.rsi !== null) {
    if (data.rsi < 30) {
      score += 25;
      signals.push({ name: 'RSI Oversold', weight: 25, active: true });
      if (data.rsi < 25) {
        score += 5;
        signals.push({ name: 'RSI Extreme', weight: 5, active: true });
      }
    } else {
      signals.push({ name: 'RSI Oversold', weight: 25, active: false });
    }
  }
  
  // 2. Trend Filter - 50 SMA (30 points - CRITICAL)
  if (data.price && data.sma50) {
    if (data.price > data.sma50) {
      score += 30;
      signals.push({ name: 'Above 50 SMA', weight: 30, active: true });
    } else {
      signals.push({ name: 'Above 50 SMA', weight: 30, active: false });
    }
  }
  
  // 3. Volume Confirmation (20 points, +5 for extreme)
  if (data.volumeRatio) {
    if (data.volumeRatio > 1.5) {
      score += 20;
      signals.push({ name: 'Volume Spike', weight: 20, active: true });
      if (data.volumeRatio > 2.0) {
        score += 5;
        signals.push({ name: 'Extreme Volume', weight: 5, active: true });
      }
    } else {
      signals.push({ name: 'Volume Spike', weight: 20, active: false });
    }
  }
  
  // 4. Bollinger Bands (15 points)
  if (data.price && data.bollingerBands) {
    if (data.price < data.bollingerBands.lower) {
      score += 15;
      signals.push({ name: 'Below BB Lower', weight: 15, active: true });
    } else {
      signals.push({ name: 'Below BB Lower', weight: 15, active: false });
    }
  }
  
  // 5. RSI Divergence (10 points)
  if (data.divergence && data.divergence.bullish) {
    score += 10;
    signals.push({ name: 'Bullish Divergence', weight: 10, active: true });
  } else {
    signals.push({ name: 'Bullish Divergence', weight: 10, active: false });
  }
  
  return {
    score: Math.min(score, 100),
    signals,
    activeCount: signals.filter(s => s.active).length,
    totalSignals: signals.length
  };
};

/**
 * Get signal strength tier based on score
 */
export const getSignalStrength = (score) => {
  if (score >= 75) {
    return {
      level: 'HIGH',
      color: 'green',
      label: 'STRONG BUY',
      description: 'High conviction - 4-5 signals confirmed',
      positionSize: 'FULL',
      winRate: '70-80%'
    };
  } else if (score >= 60) {
    return {
      level: 'MODERATE',
      color: 'blue',
      label: 'BUY',
      description: 'Moderate conviction - 3-4 signals confirmed',
      positionSize: 'MEDIUM',
      winRate: '60-70%'
    };
  } else if (score >= 45) {
    return {
      level: 'LOW',
      color: 'yellow',
      label: 'WEAK BUY',
      description: 'Low conviction - 2-3 signals confirmed',
      positionSize: 'SMALL',
      winRate: '55-65%'
    };
  } else {
    return {
      level: 'NONE',
      color: 'gray',
      label: 'WAIT',
      description: 'Insufficient signals - wait for better setup',
      positionSize: 'NONE',
      winRate: '<55%'
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
    
    // Bollinger Bands
    const bb = calculateBollingerBands(prices, 20, 2);
    analysis.bollingerBands = bb;
    analysis.signals.belowBB = bb && token.price < bb.lower;
    
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
    }
  }
  
  // Calculate score
  const scoreData = {
    rsi: token.rsi,
    price: token.price,
    sma50: analysis.sma50,
    bollingerBands: analysis.bollingerBands,
    volumeRatio: analysis.volumeRatio,
    divergence: analysis.divergence
  };
  
  const scoreResult = calculateSignalScore(scoreData);
  analysis.score = scoreResult.score;
  analysis.signalDetails = scoreResult.signals;
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
