// ==================================================
// FILE: api/crypto.js (Complete - With All Signals)
// ==================================================

export const config = {
  runtime: 'edge',
};

// Calculate actual RSI from price data
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

// Calculate Simple Moving Average
const calculateSMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

// Calculate Bollinger Bands
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

// Calculate volume ratio
const calculateVolumeRatio = (volumes, period = 20) => {
  if (!volumes || volumes.length < period + 1) return null;
  
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = calculateSMA(volumes.slice(0, -1), period);
  
  if (!avgVolume || avgVolume === 0) return null;
  return currentVolume / avgVolume;
};

// Smart categorization based on coin ID and name
const getCategoryFromMetadata = (id, name, symbol) => {
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();
  const symbolLower = symbol.toLowerCase();
  
  // Layer 1 / Layer 2 - Major blockchains
  const layer1Ids = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot', 
                     'polygon-ecosystem-token', 'matic-network', 'arbitrum', 'optimism',
                     'cosmos', 'near-protocol', 'aptos', 'sui', 'kaspa', 'tron', 'litecoin',
                     'stellar', 'algorand', 'fantom', 'hedera-hashgraph', 'internet-computer',
                     'the-open-network', 'stacks', 'injective-protocol', 'sei-network', 'celestia'];
  if (layer1Ids.includes(idLower) || nameLower.includes('network') || nameLower.includes('chain')) {
    return 'layer-1';
  }
  
  // Meme coins - Check for meme-related keywords
  const memeKeywords = ['doge', 'shib', 'inu', 'pepe', 'floki', 'bonk', 'meme', 'wojak',
                        'shiba', 'baby', 'elon', 'cat', 'popcat', 'mog', 'turbo', 'brett',
                        'wif', 'bome', 'coq', 'myro', 'wen', 'neiro', 'dogs', 'ponke'];
  if (memeKeywords.some(keyword => idLower.includes(keyword) || nameLower.includes(keyword) || symbolLower.includes(keyword))) {
    return 'meme';
  }
  
  // DeFi protocols
  const defiIds = ['chainlink', 'uniswap', 'aave', 'maker', 'lido-dao', 'curve-dao-token',
                   'pancakeswap-token', 'compound-governance-token', 'synthetix-network-token',
                   'thorchain', 'the-graph', 'raydium', 'jupiter-exchange-solana', 'pendle',
                   '1inch', 'sushi', 'balancer', 'convex-finance', 'yearn-finance'];
  const defiKeywords = ['swap', 'dex', 'lending', 'defi', 'finance', 'protocol'];
  if (defiIds.includes(idLower) || defiKeywords.some(k => idLower.includes(k) || nameLower.includes(k))) {
    return 'defi';
  }
  
  // AI tokens
  const aiIds = ['render-token', 'fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor',
                 'worldcoin', 'akash-network', 'arkham', 'artificial-superintelligence-alliance'];
  const aiKeywords = ['ai', 'artificial', 'intelligence', 'neural', 'render', 'compute'];
  if (aiIds.includes(idLower) || aiKeywords.some(k => idLower.includes(k) || nameLower.includes(k))) {
    return 'ai';
  }
  
  // Gaming & Metaverse
  const gamingIds = ['the-sandbox', 'decentraland', 'axie-infinity', 'gala', 'immutable-x',
                     'enjincoin', 'beam', 'echelon-prime', 'gala-games'];
  const gamingKeywords = ['game', 'gaming', 'meta', 'verse', 'land', 'sandbox', 'axie', 'play'];
  if (gamingIds.includes(idLower) || gamingKeywords.some(k => idLower.includes(k) || nameLower.includes(k))) {
    return 'gaming';
  }
  
  // Exchange tokens
  const exchangeIds = ['binancecoin', 'crypto-com-chain', 'okb', 'kucoin-shares', 'gate-token',
                       'huobi-token', 'bitget-token', 'mx-token'];
  if (exchangeIds.includes(idLower) || idLower.includes('exchange')) {
    return 'exchange';
  }
  
  // Stablecoins - comprehensive list
  const stableIds = ['tether', 'usd-coin', 'dai', 'first-digital-usd', 'true-usd',
                     'paxos-standard', 'frax', 'tusd', 'usdd', 'ethena-usde', 'usds',
                     'paypal-usd', 'tether-gold', 'binance-peg-busd', 'gemini-dollar',
                     'liquity-usd', 'crvusd', 'frax-ether', 'origin-dollar', 'alchemix-usd',
                     'rai', 'fei-usd', 'magic-internet-money', 'neutrino', 'reserve',
                     'stasis-eurs', 'tether-eurt', 'euro-coin', 'ageur', 'celo-euro',
                     'seur', 'savings-dai', 'usual-usd', 'gho', 'pax-gold', 'binance-usd',
                     'husd', 'usdx-money-usdx', 'dola-usd', 'vai', 'usdj', 'bob-token',
                     'mountain-protocol-usdm', 'ondo-us-dollar-yield', 'resolv-usd',
                     'circuit-usd', 'djed', 'overnight-finance-usd', 'compound-usd-coin',
                     'nusd', 'synth-susd', 'hai', 'terra-usd', 'terrausd', 'flex-usd',
                     'brz', 'bidr', 'xsgd', 'gyen', 'jpyc', 'gbpt', 'qcad', 'par-stablecoin',
                     'figure-heloc', 'fx-usd-savings', 'fxsave', 'yousd', 'yield-optimizer-usd',
                     'reusd', 're-protocol-reusd', 'usda', 'usda-2', 'angle-usda', 'liusd',
                     'infinifi-locked-iusd', 'cap-usd', 'cusd-2', 'fiusd', 'sygnum-platform-fiusd',
                     'usdx-2', 'stably-usd', 'sperax-usd', 'usd-mars', 'f-x-protocol-fxusd'];
  const stableSymbols = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'gusd', 'frax', 
                         'lusd', 'susd', 'mim', 'ust', 'fei', 'usdd', 'usde', 'pyusd',
                         'eurs', 'eurt', 'eurc', 'ageur', 'ceur', 'jeur', 'gho', 'crvusd',
                         'usdm', 'usdy', 'usd0', 'usdr', 'usdb', 'usdj', 'usdn', 'usdx',
                         'usdk', 'usk', 'vai', 'bob', 'dola', 'hai', 'silk', 'djed',
                         'paxg', 'xaut', 'cusd', 'fdusd', 'alusd', 'ousd', 'musd',
                         'fxsave', 'yousd', 'reusd', 'usda', 'liusd', 'fiusd'];
  if (stableIds.includes(idLower) || stableSymbols.includes(symbolLower)) {
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
    // Fetch market data with sparklines (only 4 calls total)
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
        const errorText = await cgRes.text();
        throw new Error(`CoinGecko API error (page ${page}): ${cgRes.status} - ${errorText}`);
      }
      
      const pageData = await cgRes.json();
      allData.push(...pageData);
      
      // Add delay between requests to avoid rate limiting
      if (page < 4) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    const cgData = allData;
    
    // Deduplicate tokens by ID (CoinGecko sometimes returns duplicates)
    const seenIds = new Set();
    const dedupedData = cgData.filter(coin => {
      if (seenIds.has(coin.id)) {
        return false;
      }
      seenIds.add(coin.id);
      return true;
    });
    
    const totalMcap = dedupedData.reduce((sum, c) => sum + (c.market_cap || 0), 0);

    // Process tokens with smart categorization and all signals
    const tokens = dedupedData.map((coin, index) => {
      const sparklineData = coin.sparkline_in_7d?.price || [];
      const rsi = calculateRSI(sparklineData, 14);
      
      let normalizedSparkline = [];
      if (sparklineData.length > 0) {
        const startPrice = sparklineData[0];
        normalizedSparkline = sparklineData.map(p => (p / startPrice) * 100);
      }
      
      // Calculate additional signals
      const sma50 = calculateSMA(sparklineData, 50);
      const bollingerBands = calculateBollingerBands(sparklineData, 20, 2);
      
      // Volume analysis note: CoinGecko doesn't provide volume history in sparkline
      // Would need separate API call for historical volume data
      // For now, we can use the 24h volume but can't calculate ratio without history
      let volumeRatio = null;
      
      // Smart categorization based on metadata
      let category = getCategoryFromMetadata(coin.id, coin.name, coin.symbol);
      
      // Additional price-based stablecoin detection
      // Catches stables that slip through the ID/symbol checks
      const isPriceStable = (
        coin.current_price >= 0.98 && 
        coin.current_price <= 1.02 &&
        Math.abs(coin.price_change_percentage_24h_in_currency || 0) < 0.5 &&
        Math.abs(coin.price_change_percentage_7d_in_currency || 0) < 1
      );
      
      if (isPriceStable && category !== 'stable') {
        category = 'stable';
      }
      
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
        sma50: sma50,
        bollingerBands: bollingerBands,
        volumeRatio: volumeRatio,
        sparkline: normalizedSparkline,
        sparklineRaw: sparklineData,
        image: coin.image,
        category: category,
      };
    });

    // Filter out stablecoins - they don't make sense for RSI analysis
    const tokensFiltered = tokens.filter(t => t.category !== 'stable');
    const stablecoinsRemoved = tokens.length - tokensFiltered.length;
    const withRSI = tokensFiltered.filter(t => t.rsi !== null).length;

    return new Response(
      JSON.stringify({
        tokens: tokensFiltered,
        timestamp: new Date().toISOString(),
        source: 'coingecko',
        stats: {
          total: tokensFiltered.length,
          withRSI: withRSI,
          stablecoinsRemoved: stablecoinsRemoved,
          dataPoints: tokensFiltered[0]?.sparkline?.length || 0,
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('CoinGecko API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
