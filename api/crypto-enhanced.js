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

// Calculate signal score (0-100) based on available signals
// Now calculates both BUY score (for oversold) and SELL score (for overbought)
const calculateSignalScore = (token, signals, fundingRate) => {
  let buyScore = 0;
  let sellScore = 0;
  let buyActiveCount = 0;
  let sellActiveCount = 0;
  let buyAvailableCount = 0;
  let sellAvailableCount = 0;
  
  // ============ BUY SIGNALS (Oversold) ============
  
  // 1. RSI Oversold (25 points base, +5 bonus for extreme < 25)
  if (token.rsi !== null && token.rsi !== undefined) {
    buyAvailableCount++;
    if (token.rsi < 30) {
      const basePoints = 25;
      const bonusPoints = token.rsi < 25 ? 5 : 0;
      buyScore += basePoints + bonusPoints;
      buyActiveCount++;
    }
  }
  
  // 2. Above 50 SMA - Uptrend (30 points - CRITICAL for buying dips)
  if (signals.aboveSMA50 !== null) {
    buyAvailableCount++;
    if (signals.aboveSMA50 === true) {
      buyScore += 30;
      buyActiveCount++;
    }
  }
  
  // 3. Below Bollinger Band (15 points)
  if (signals.belowBB !== null) {
    buyAvailableCount++;
    if (signals.belowBB === true) {
      buyScore += 15;
      buyActiveCount++;
    }
  }
  
  // 4. Volume Spike (15 points)
  if (signals.volumeSpike !== null) {
    buyAvailableCount++;
    if (signals.volumeSpike === true) {
      buyScore += 15;
      buyActiveCount++;
    }
  }
  
  // 5. Bullish Divergence (10 points - strong reversal signal)
  if (signals.bullishDivergence !== null) {
    buyAvailableCount++;
    if (signals.bullishDivergence === true) {
      buyScore += 10;
      buyActiveCount++;
    }
  }
  
  // 6. Negative Funding Rate (15 points)
  if (fundingRate !== null && fundingRate !== undefined) {
    buyAvailableCount++;
    if (fundingRate < 0) {
      buyScore += 15;
      buyActiveCount++;
    }
  }
  
  // 7. Bullish Engulfing (10 points - confirmation pattern)
  if (signals.bullishEngulfing !== null) {
    buyAvailableCount++;
    if (signals.bullishEngulfing === true) {
      buyScore += 10;
      buyActiveCount++;
    }
  }
  
  // ============ SELL SIGNALS (Overbought) ============
  
  // 1. RSI Overbought (20 points base, +10 bonus for extreme > 80)
  if (token.rsi !== null && token.rsi !== undefined) {
    sellAvailableCount++;
    if (token.rsi > 70) {
      const basePoints = 20;
      const bonusPoints = token.rsi > 80 ? 10 : (token.rsi > 75 ? 5 : 0);
      sellScore += basePoints + bonusPoints;
      sellActiveCount++;
    }
  }
  
  // 2. Below 50 SMA - Downtrend (15 points)
  if (signals.belowSMA50 !== null) {
    sellAvailableCount++;
    if (signals.belowSMA50 === true) {
      sellScore += 15;
      sellActiveCount++;
    }
  }
  
  // 3. Below 20 SMA - Short-term weakness (10 points)
  if (signals.belowSMA20 !== null) {
    sellAvailableCount++;
    if (signals.belowSMA20 === true) {
      sellScore += 10;
      sellActiveCount++;
    }
  }
  
  // 4. Above Bollinger Band (15 points)
  if (signals.aboveBB !== null) {
    sellAvailableCount++;
    if (signals.aboveBB === true) {
      sellScore += 15;
      sellActiveCount++;
    }
  }
  
  // 5. Positive Funding Rate (10 points - crowded longs)
  if (fundingRate !== null && fundingRate !== undefined) {
    sellAvailableCount++;
    if (fundingRate > 0.01) {
      sellScore += 10;
      sellActiveCount++;
    }
  }
  
  // 6. Bearish Divergence (15 points - strong reversal signal)
  if (signals.bearishDivergence !== null) {
    sellAvailableCount++;
    if (signals.bearishDivergence === true) {
      sellScore += 15;
      sellActiveCount++;
    }
  }
  
  // 7. Bearish Engulfing (10 points - confirmation pattern)
  if (signals.bearishEngulfing !== null) {
    sellAvailableCount++;
    if (signals.bearishEngulfing === true) {
      sellScore += 10;
      sellActiveCount++;
    }
  }
  
  // 8. Near ATH (10 points - potential resistance)
  if (signals.nearATH !== null) {
    sellAvailableCount++;
    if (signals.nearATH === true) {
      sellScore += 10;
      sellActiveCount++;
    }
  }
  
  // 9. High Volume/MCap (5 points - potential distribution)
  if (signals.highVolMcap !== null) {
    sellAvailableCount++;
    if (signals.highVolMcap === true) {
      sellScore += 5;
      sellActiveCount++;
    }
  }
  
  return {
    // Main score is BUY score (for oversold screener primary use case)
    score: Math.min(buyScore, 100),
    activeCount: buyActiveCount,
    availableCount: buyAvailableCount,
    maxPossible: 100,
    // Also include sell score for overbought analysis
    sellScore: Math.min(sellScore, 100),
    sellActiveCount,
    sellAvailableCount,
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
      sellScore: signalScoreData.sellScore,
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
  
  const signals = {
    // Buy signals (oversold)
    rsiOversold: token.rsi !== null && token.rsi < 30,
    rsiExtreme: token.rsi !== null && token.rsi < 25,
    aboveSMA50: null,
    belowBB: null,
    volumeSpike: null,
    hasFunding: null,
    negativeFunding: null,
    bullishDivergence: null,
    bullishEngulfing: null,
    // Sell signals (overbought)
    rsiOverbought: token.rsi !== null && token.rsi > 70,
    rsiOverboughtExtreme: token.rsi !== null && token.rsi > 80,
    belowSMA50: null,
    belowSMA20: null,
    aboveBB: null,
    positiveFunding: null,
    bearishDivergence: null,
    bearishEngulfing: null,
    nearATH: null,
    highVolMcap: volMcapRatio !== null && volMcapRatio > 10,
  };
  
  const signalScoreData = calculateSignalScore(token, signals, null);
  
  return {
    ...token,
    signals,
    signalScore: signalScoreData.score,
    sellScore: signalScoreData.sellScore,
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
                       'ftx-token', 'huobi-token'];
  if (exchangeIds.includes(idLower) || idLower.includes('exchange')) {
    return 'exchange';
  }
  
  const stableIds = ['tether', 'usd-coin', 'dai', 'first-digital-usd', 'true-usd',
                     'paxos-standard', 'frax', 'tusd', 'usdd'];
  const stableKeywords = ['usd', 'dollar', 'stable'];
  if (stableIds.includes(idLower) || stableKeywords.some(k => symbolLower.includes(k))) {
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
        category: category,
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
      const volMcapRatio = token.mcap > 0 ? (token.volume / token.mcap) * 100 : null;
      
      const signals = {
        // Buy signals (oversold)
        rsiOversold: token.rsi !== null && token.rsi < 30,
        rsiExtreme: token.rsi !== null && token.rsi < 25,
        aboveSMA50: null,
        belowBB: null,
        volumeSpike: null,
        hasFunding: null,
        negativeFunding: null,
        bullishDivergence: null,
        bullishEngulfing: null,
        // Sell signals (overbought)
        rsiOverbought: token.rsi !== null && token.rsi > 70,
        rsiOverboughtExtreme: token.rsi !== null && token.rsi > 80,
        belowSMA50: null,
        belowSMA20: null,
        aboveBB: null,
        positiveFunding: null,
        bearishDivergence: null,
        bearishEngulfing: null,
        nearATH: null,
        highVolMcap: volMcapRatio !== null && volMcapRatio > 10,
      };
      
      const signalScoreData = calculateSignalScore(token, signals, null);
      
      return {
        ...token,
        signals,
        signalScore: signalScoreData.score,
        sellScore: signalScoreData.sellScore,
        signalScoreDetails: signalScoreData,
        enhanced: false,
      };
    });
    
    const allTokens = [...enhancedTokens, ...remainingTokens];
    const enhancedCount = enhancedTokens.filter(t => t.enhanced).length;
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Enhanced ${enhancedCount}/${allTokens.length} tokens in ${duration}s`);
    
    return new Response(
      JSON.stringify({
        tokens: allTokens,
        timestamp: new Date().toISOString(),
        source: 'coingecko+exchanges',
        stats: {
          total: allTokens.length,
          enhanced: enhancedCount,
          withRSI: allTokens.filter(t => t.rsi !== null).length,
          duration: `${duration}s`,
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=120, stale-while-revalidate=600', // Cache 2 min
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
