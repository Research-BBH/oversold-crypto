// ==================================================
// FILE: api/crypto-enhanced.js
// Enhanced endpoint with full signal data for filtering
// ==================================================

export const config = {
  runtime: 'edge',
  maxDuration: 60, // Allow up to 60 seconds for this endpoint
};

// Import calculation functions (these are duplicated from backend for edge function)
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

// Detect RSI divergence (bullish: price lower low, RSI higher low; bearish: price higher high, RSI lower high)
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
  
  // Find local lows and highs
  const priceLows = [];
  const priceHighs = [];
  
  for (let i = 2; i < recentPrices.length - 2; i++) {
    // Local low
    if (recentPrices[i] < recentPrices[i-1] && recentPrices[i] < recentPrices[i-2] &&
        recentPrices[i] < recentPrices[i+1] && recentPrices[i] < recentPrices[i+2]) {
      priceLows.push({ index: i, price: recentPrices[i], rsi: recentRSI[i] });
    }
    // Local high
    if (recentPrices[i] > recentPrices[i-1] && recentPrices[i] > recentPrices[i-2] &&
        recentPrices[i] > recentPrices[i+1] && recentPrices[i] > recentPrices[i+2]) {
      priceHighs.push({ index: i, price: recentPrices[i], rsi: recentRSI[i] });
    }
  }
  
  let bullish = false;
  let bearish = false;
  
  // Bullish divergence: price makes lower low, RSI makes higher low
  if (priceLows.length >= 2) {
    const last = priceLows[priceLows.length - 1];
    const prev = priceLows[priceLows.length - 2];
    if (last.price < prev.price && last.rsi > prev.rsi) {
      bullish = true;
    }
  }
  
  // Bearish divergence: price makes higher high, RSI makes lower high
  if (priceHighs.length >= 2) {
    const last = priceHighs[priceHighs.length - 1];
    const prev = priceHighs[priceHighs.length - 2];
    if (last.price > prev.price && last.rsi < prev.rsi) {
      bearish = true;
    }
  }
  
  return { bullish, bearish };
};

// Detect engulfing candle patterns
const detectEngulfingPattern = (prices, opens) => {
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

// Calculate unified momentum score (-100 to +100)
// Positive = Bullish, Negative = Bearish, Near zero = Neutral
// ============================================================
// SYMMETRICAL SIGNAL SCORING SYSTEM
// 8 signal pairs, each with equal bullish/bearish weights
// Max possible: +100 bullish / -100 bearish (perfectly balanced)
// ============================================================

const SIGNAL_WEIGHTS = {
  RSI: 25,           // RSI oversold/overbought
  RSI_EXTREME: 10,   // Bonus for extreme RSI (<20 or >80)
  TREND: 20,         // Above/below SMA50
  BOLLINGER: 15,     // Below lower / above upper BB
  FUNDING: 15,       // Negative/positive funding rate
  DIVERGENCE: 15,    // Bullish/bearish divergence
  ENGULFING: 10,     // Bullish/bearish engulfing pattern
  PRICE_POSITION: 10,// Near ATL / near ATH
  VOLUME: 10,        // Volume accumulation/distribution
};
// Total max per side: 25+10+20+15+15+15+10+10+10 = 130 (clamped to 100)

const calculateSignalScore = (token, signals, fundingRate) => {
  let score = 0;
  const activeSignals = [];
  const signalPairs = []; // For symmetrical UI display
  
  // ============ 1. RSI Level (±25 base, ±10 extreme bonus) ============
  const rsiPair = {
    name: 'RSI Level',
    bullish: { label: 'Oversold (<25)', weight: SIGNAL_WEIGHTS.RSI, active: false, value: null },
    bearish: { label: 'Overbought (>75)', weight: SIGNAL_WEIGHTS.RSI, active: false, value: null },
  };
  
  if (token.rsi !== null && token.rsi !== undefined) {
    if (token.rsi < 25) {
      const isExtreme = token.rsi < 20;
      const points = SIGNAL_WEIGHTS.RSI + (isExtreme ? SIGNAL_WEIGHTS.RSI_EXTREME : 0);
      score += points;
      activeSignals.push({ 
        name: isExtreme ? 'RSI Extreme Oversold' : 'RSI Oversold', 
        value: token.rsi, 
        points: +points,
        category: 'rsi'
      });
      rsiPair.bullish.active = true;
      rsiPair.bullish.value = token.rsi;
      rsiPair.bullish.points = points;
      if (isExtreme) rsiPair.bullish.label = 'Extreme (<20)';
    } else if (token.rsi > 75) {
      const isExtreme = token.rsi > 80;
      const points = SIGNAL_WEIGHTS.RSI + (isExtreme ? SIGNAL_WEIGHTS.RSI_EXTREME : 0);
      score -= points;
      activeSignals.push({ 
        name: isExtreme ? 'RSI Extreme Overbought' : 'RSI Overbought', 
        value: token.rsi, 
        points: -points,
        category: 'rsi'
      });
      rsiPair.bearish.active = true;
      rsiPair.bearish.value = token.rsi;
      rsiPair.bearish.points = points;
      if (isExtreme) rsiPair.bearish.label = 'Extreme (>80)';
    }
  }
  signalPairs.push(rsiPair);
  
  // ============ 2. Trend - SMA50 (±20) ============
  const trendPair = {
    name: 'Trend (SMA50)',
    bullish: { label: 'Uptrend', weight: SIGNAL_WEIGHTS.TREND, active: false },
    bearish: { label: 'Downtrend', weight: SIGNAL_WEIGHTS.TREND, active: false },
    unavailable: signals.aboveSMA50 === null && signals.belowSMA50 === null,
  };
  
  if (signals.aboveSMA50 === true) {
    score += SIGNAL_WEIGHTS.TREND;
    activeSignals.push({ name: 'Above SMA50 (Uptrend)', points: +SIGNAL_WEIGHTS.TREND, category: 'trend' });
    trendPair.bullish.active = true;
    trendPair.bullish.points = SIGNAL_WEIGHTS.TREND;
  } else if (signals.belowSMA50 === true) {
    score -= SIGNAL_WEIGHTS.TREND;
    activeSignals.push({ name: 'Below SMA50 (Downtrend)', points: -SIGNAL_WEIGHTS.TREND, category: 'trend' });
    trendPair.bearish.active = true;
    trendPair.bearish.points = SIGNAL_WEIGHTS.TREND;
  }
  signalPairs.push(trendPair);
  
  // ============ 3. Bollinger Bands (±15) ============
  const bbPair = {
    name: 'Bollinger Bands',
    bullish: { label: 'Below Lower', weight: SIGNAL_WEIGHTS.BOLLINGER, active: false },
    bearish: { label: 'Above Upper', weight: SIGNAL_WEIGHTS.BOLLINGER, active: false },
    unavailable: signals.belowBB === null && signals.aboveBB === null,
  };
  
  if (signals.belowBB === true) {
    score += SIGNAL_WEIGHTS.BOLLINGER;
    activeSignals.push({ name: 'Below Lower BB', points: +SIGNAL_WEIGHTS.BOLLINGER, category: 'bb' });
    bbPair.bullish.active = true;
    bbPair.bullish.points = SIGNAL_WEIGHTS.BOLLINGER;
  } else if (signals.aboveBB === true) {
    score -= SIGNAL_WEIGHTS.BOLLINGER;
    activeSignals.push({ name: 'Above Upper BB', points: -SIGNAL_WEIGHTS.BOLLINGER, category: 'bb' });
    bbPair.bearish.active = true;
    bbPair.bearish.points = SIGNAL_WEIGHTS.BOLLINGER;
  }
  signalPairs.push(bbPair);
  
  // ============ 4. Funding Rate (±15) ============
  const fundingPair = {
    name: 'Funding Rate',
    bullish: { label: 'Negative', weight: SIGNAL_WEIGHTS.FUNDING, active: false },
    bearish: { label: 'Positive', weight: SIGNAL_WEIGHTS.FUNDING, active: false },
    unavailable: fundingRate === null || fundingRate === undefined,
  };
  
  if (fundingRate !== null && fundingRate !== undefined) {
    if (fundingRate < -0.005) {
      score += SIGNAL_WEIGHTS.FUNDING;
      activeSignals.push({ name: 'Negative Funding', value: fundingRate, points: +SIGNAL_WEIGHTS.FUNDING, category: 'funding' });
      fundingPair.bullish.active = true;
      fundingPair.bullish.value = fundingRate;
      fundingPair.bullish.points = SIGNAL_WEIGHTS.FUNDING;
    } else if (fundingRate > 0.01) {
      score -= SIGNAL_WEIGHTS.FUNDING;
      activeSignals.push({ name: 'Positive Funding', value: fundingRate, points: -SIGNAL_WEIGHTS.FUNDING, category: 'funding' });
      fundingPair.bearish.active = true;
      fundingPair.bearish.value = fundingRate;
      fundingPair.bearish.points = SIGNAL_WEIGHTS.FUNDING;
    }
  }
  signalPairs.push(fundingPair);
  
  // ============ 5. RSI Divergence (±15) ============
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
  
  // ============ 6. Candlestick Patterns (±10) ============
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
  
  // ============ 7. Price Position - ATL/ATH (±10) ============
  const positionPair = {
    name: 'Price Position',
    bullish: { label: 'Near ATL', weight: SIGNAL_WEIGHTS.PRICE_POSITION, active: false },
    bearish: { label: 'Near ATH', weight: SIGNAL_WEIGHTS.PRICE_POSITION, active: false },
  };
  
  // Near ATL: within 20% of all-time low
  const nearATL = token.atlChange !== undefined && token.atlChange !== null && token.atlChange <= 20;
  const nearATH = signals.nearATH === true;
  
  if (nearATL && !nearATH) {
    score += SIGNAL_WEIGHTS.PRICE_POSITION;
    activeSignals.push({ name: 'Near All-Time Low', value: `+${token.atlChange?.toFixed(1)}%`, points: +SIGNAL_WEIGHTS.PRICE_POSITION, category: 'position' });
    positionPair.bullish.active = true;
    positionPair.bullish.value = token.atlChange;
    positionPair.bullish.points = SIGNAL_WEIGHTS.PRICE_POSITION;
  } else if (nearATH && !nearATL) {
    score -= SIGNAL_WEIGHTS.PRICE_POSITION;
    activeSignals.push({ name: 'Near All-Time High', points: -SIGNAL_WEIGHTS.PRICE_POSITION, category: 'position' });
    positionPair.bearish.active = true;
    positionPair.bearish.points = SIGNAL_WEIGHTS.PRICE_POSITION;
  }
  signalPairs.push(positionPair);
  
  // ============ 8. Volume Analysis (±10) ============
  const volumePair = {
    name: 'Volume',
    bullish: { label: 'Accumulation', weight: SIGNAL_WEIGHTS.VOLUME, active: false },
    bearish: { label: 'Distribution', weight: SIGNAL_WEIGHTS.VOLUME, active: false },
    unavailable: signals.volumeSpike === null,
  };
  
  if (signals.volumeSpike === true) {
    // Interpret based on RSI context
    if (token.rsi !== null && token.rsi < 35) {
      score += SIGNAL_WEIGHTS.VOLUME;
      activeSignals.push({ name: 'Volume Accumulation', points: +SIGNAL_WEIGHTS.VOLUME, category: 'volume' });
      volumePair.bullish.active = true;
      volumePair.bullish.points = SIGNAL_WEIGHTS.VOLUME;
    } else if (token.rsi !== null && token.rsi > 65) {
      score -= SIGNAL_WEIGHTS.VOLUME;
      activeSignals.push({ name: 'Volume Distribution', points: -SIGNAL_WEIGHTS.VOLUME, category: 'volume' });
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
  
  // Calculate totals for display
  const bullishTotal = activeSignals.filter(s => s.points > 0).reduce((sum, s) => sum + s.points, 0);
  const bearishTotal = Math.abs(activeSignals.filter(s => s.points < 0).reduce((sum, s) => sum + s.points, 0));
  
  return {
    score,
    label,
    strength,
    activeSignals,
    signalPairs,        // For symmetrical UI display
    signalCount: activeSignals.length,
    bullishCount: activeSignals.filter(s => s.points > 0).length,
    bearishCount: activeSignals.filter(s => s.points < 0).length,
    bullishTotal,
    bearishTotal,
    maxPossible: 100,   // Max score in either direction
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
    
    // Calculate divergence
    const divergence = detectDivergence(exchangeData.prices);
    
    // Calculate engulfing patterns
    const engulfing = exchangeData.opens 
      ? detectEngulfingPattern(exchangeData.prices, exchangeData.opens)
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
    };
    
    const signalScoreData = calculateSignalScore(token, signals, exchangeData.fundingRate);
    
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
  
  const signalScoreData = calculateSignalScore(token, signals, null);
  
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
      
      const signalScoreData = calculateSignalScore(token, signals, null);
      
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
    
    return new Response(
      JSON.stringify({
        tokens: allTokens,
        timestamp: new Date().toISOString(),
        source: 'coingecko+exchanges',
        version: '2.1-no-stablecoins', // Version indicator
        stats: {
          total: allTokens.length,
          enhanced: enhancedCount,
          withRSI: allTokens.filter(t => t.rsi !== null).length,
          stablecoinsRemoved: stablecoinsRemoved,
          duration: `${duration}s`,
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300', // Cache for 60s, serve stale for 5min
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
