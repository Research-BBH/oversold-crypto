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
 * IMPORTANT: Always show all 6 main signals, even if data is unavailable
 */
export const calculateSignalScore = (data) => {
  let score = 0;
  const signals = [];
  let availableSignals = 0; // Track how many signals have data
  
  // 1. RSI Signal (25 points base, +5 bonus for extreme = 30 total)
  if (data.rsi !== null && data.rsi !== undefined) {
    availableSignals++;
    if (data.rsi < 30) {
      const basePoints = 25;
      const bonusPoints = data.rsi < 25 ? 5 : 0;
      const totalPoints = basePoints + bonusPoints;
      score += totalPoints;
      
      const label = data.rsi < 25 ? 'RSI Oversold (Extreme)' : 'RSI Oversold';
      signals.push({ 
        name: label, 
        weight: totalPoints, 
        active: true,
        isExtreme: data.rsi < 25
      });
    } else {
      signals.push({ name: 'RSI Oversold', weight: 25, active: false });
    }
  } else {
    signals.push({ name: 'RSI Oversold', weight: 25, active: false, unavailable: true });
  }
  
  // 2. Trend Filter - 50 SMA (30 points - CRITICAL)
  if (data.price && data.sma50) {
    availableSignals++;
    if (data.price > data.sma50) {
      score += 30;
      signals.push({ name: 'Above 50 SMA', weight: 30, active: true });
    } else {
      signals.push({ name: 'Above 50 SMA', weight: 30, active: false });
    }
  } else {
    signals.push({ name: 'Above 50 SMA', weight: 30, active: false, unavailable: true });
  }
  
  // 3. Bollinger Bands (15 points)
  if (data.price && data.bollingerBands) {
    availableSignals++;
    if (data.price < data.bollingerBands.lower) {
      score += 15;
      signals.push({ name: 'Below BB Lower', weight: 15, active: true });
    } else {
      signals.push({ name: 'Below BB Lower', weight: 15, active: false });
    }
  } else {
    signals.push({ name: 'Below BB Lower', weight: 15, active: false, unavailable: true });
  }
  
  // 4. Volume Confirmation (15 points)
  if (data.volumeRatio) {
    availableSignals++;
    if (data.volumeRatio > 1.5) {
      score += 15;
      signals.push({ name: 'Volume Spike', weight: 15, active: true });
    } else {
      signals.push({ name: 'Volume Spike', weight: 15, active: false });
    }
  } else {
    signals.push({ name: 'Volume Spike', weight: 15, active: false, unavailable: true });
  }
  
  // 5. RSI Divergence (10 points)
  if (data.divergence) {
    availableSignals++;
    if (data.divergence.bullish) {
      score += 10;
      signals.push({ name: 'Bullish Divergence', weight: 10, active: true });
    } else {
      signals.push({ name: 'Bullish Divergence', weight: 10, active: false });
    }
  } else {
    signals.push({ name: 'Bullish Divergence', weight: 10, active: false, unavailable: true });
  }

  // 6. Funding Rate (15 points) - Only available for tokens with futures
  if (data.fundingRate !== undefined && data.fundingRate !== null) {
    availableSignals++;
    if (data.fundingRate < 0) {
      score += 15;
      signals.push({ name: 'Negative Funding', weight: 15, active: true });
    } else {
      signals.push({ name: 'Negative Funding', weight: 15, active: false });
    }
  } else {
    signals.push({ name: 'Negative Funding', weight: 15, active: false, unavailable: true });
  }
  
  return {
    score: Math.min(score, 100),
    signals,
    activeCount: signals.filter(s => s.active && !s.unavailable).length,
    totalSignals: signals.length,
    availableSignals: availableSignals
  };
};

/**
 * Calculate comprehensive SELL signal score (0-100)
 * For overbought conditions and bearish signals
 */
export const calculateSellSignalScore = (data) => {
  let score = 0;
  const signals = [];
  let availableSignals = 0;
  
  // 1. RSI Overbought (20 points base, +10 bonus for extreme > 80)
  if (data.rsi !== null && data.rsi !== undefined) {
    availableSignals++;
    if (data.rsi > 70) {
      const basePoints = 20;
      const bonusPoints = data.rsi > 80 ? 10 : (data.rsi > 75 ? 5 : 0);
      const totalPoints = basePoints + bonusPoints;
      score += totalPoints;
      
      const label = data.rsi > 80 ? 'RSI Overbought (Extreme)' : 'RSI Overbought';
      signals.push({ 
        name: label, 
        weight: totalPoints, 
        active: true,
        isExtreme: data.rsi > 80
      });
    } else {
      signals.push({ name: 'RSI Overbought', weight: 20, active: false });
    }
  } else {
    signals.push({ name: 'RSI Overbought', weight: 20, active: false, unavailable: true });
  }
  
  // 2. Below 50 SMA - Downtrend (15 points)
  if (data.price && data.sma50) {
    availableSignals++;
    if (data.price < data.sma50) {
      score += 15;
      signals.push({ name: 'Below 50 SMA', weight: 15, active: true });
    } else {
      signals.push({ name: 'Below 50 SMA', weight: 15, active: false });
    }
  } else {
    signals.push({ name: 'Below 50 SMA', weight: 15, active: false, unavailable: true });
  }
  
  // 3. Below 20 SMA - Short-term weakness (10 points)
  if (data.price && data.sma20) {
    availableSignals++;
    if (data.price < data.sma20) {
      score += 10;
      signals.push({ name: 'Below 20 SMA', weight: 10, active: true });
    } else {
      signals.push({ name: 'Below 20 SMA', weight: 10, active: false });
    }
  } else {
    signals.push({ name: 'Below 20 SMA', weight: 10, active: false, unavailable: true });
  }
  
  // 4. Above Bollinger Band Upper (15 points)
  if (data.price && data.bollingerBands) {
    availableSignals++;
    if (data.price > data.bollingerBands.upper) {
      score += 15;
      signals.push({ name: 'Above BB Upper', weight: 15, active: true });
    } else {
      signals.push({ name: 'Above BB Upper', weight: 15, active: false });
    }
  } else {
    signals.push({ name: 'Above BB Upper', weight: 15, active: false, unavailable: true });
  }
  
  // 5. Positive Funding Rate (10 points)
  if (data.fundingRate !== undefined && data.fundingRate !== null) {
    availableSignals++;
    if (data.fundingRate > 0.01) {
      score += 10;
      signals.push({ name: 'Positive Funding', weight: 10, active: true });
    } else {
      signals.push({ name: 'Positive Funding', weight: 10, active: false });
    }
  } else {
    signals.push({ name: 'Positive Funding', weight: 10, active: false, unavailable: true });
  }
  
  // 6. Bearish Divergence (15 points)
  if (data.divergence) {
    availableSignals++;
    if (data.divergence.bearish) {
      score += 15;
      signals.push({ name: 'Bearish Divergence', weight: 15, active: true });
    } else {
      signals.push({ name: 'Bearish Divergence', weight: 15, active: false });
    }
  } else {
    signals.push({ name: 'Bearish Divergence', weight: 15, active: false, unavailable: true });
  }
  
  // 7. High Volume/MCap ratio (5 points)
  if (data.volMcapRatio !== undefined && data.volMcapRatio !== null) {
    availableSignals++;
    if (data.volMcapRatio > 10) {
      score += 5;
      signals.push({ name: 'High Vol/MCap', weight: 5, active: true });
    } else {
      signals.push({ name: 'High Vol/MCap', weight: 5, active: false });
    }
  } else {
    signals.push({ name: 'High Vol/MCap', weight: 5, active: false, unavailable: true });
  }
  
  return {
    score: Math.min(score, 100),
    signals,
    activeCount: signals.filter(s => s.active && !s.unavailable).length,
    totalSignals: signals.length,
    availableSignals: availableSignals
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
  analysis.volMcapRatio = volMcapRatio;
  
  // Calculate BUY score
  const scoreData = {
    rsi: token.rsi,
    price: token.price,
    sma50: analysis.sma50,
    bollingerBands: analysis.bollingerBands,
    volumeRatio: analysis.volumeRatio,
    divergence: analysis.divergence,
    fundingRate: analysis.fundingRate
  };
  
  const scoreResult = calculateSignalScore(scoreData);
  analysis.score = scoreResult.score;
  
  // Calculate SELL score
  const sellScoreData = {
    rsi: token.rsi,
    price: token.price,
    sma50: analysis.sma50,
    sma20: analysis.sma20,
    bollingerBands: analysis.bollingerBands,
    divergence: analysis.divergence,
    fundingRate: analysis.fundingRate,
    volMcapRatio: analysis.volMcapRatio
  };
  
  const sellScoreResult = calculateSellSignalScore(sellScoreData);
  analysis.sellScore = sellScoreResult.score;
  
  // Store the full result including signals array, activeCount, and totalSignals
  analysis.signalDetails = {
    signals: scoreResult.signals,
    activeCount: scoreResult.activeCount,
    totalSignals: scoreResult.totalSignals,
    availableCount: scoreResult.availableSignals,
    // Add sell signal details
    sellScore: sellScoreResult.score,
    sellActiveCount: sellScoreResult.activeCount,
    sellAvailableCount: sellScoreResult.availableSignals
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
