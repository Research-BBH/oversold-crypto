// ==================================================
// FILE: api/crypto.js (FIXED VERSION 2)
// ==================================================

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Use specific region for better performance
};

// Hardcoded mapping for top 100 coins (CoinCap uses these IDs)
const COINCAP_IDS = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binance-coin',
  'XRP': 'xrp', 'USDC': 'usd-coin', 'SOL': 'solana', 'ADA': 'cardano',
  'DOGE': 'dogecoin', 'TRX': 'tron', 'TON': 'toncoin', 'DOT': 'polkadot',
  'MATIC': 'polygon', 'LTC': 'litecoin', 'WBTC': 'wrapped-bitcoin',
  'BCH': 'bitcoin-cash', 'SHIB': 'shiba-inu', 'LINK': 'chainlink',
  'AVAX': 'avalanche', 'DAI': 'multi-collateral-dai', 'XLM': 'stellar',
  'UNI': 'uniswap', 'LEO': 'unus-sed-leo', 'ATOM': 'cosmos', 'OKB': 'okb',
  'ETC': 'ethereum-classic', 'XMR': 'monero', 'HBAR': 'hedera-hashgraph',
  'FIL': 'filecoin', 'ICP': 'internet-computer', 'CRO': 'crypto-com-coin',
  'APT': 'aptos', 'LDO': 'lido-dao', 'NEAR': 'near-protocol', 'ARB': 'arbitrum',
  'VET': 'vechain', 'OP': 'optimism', 'MKR': 'maker', 'AAVE': 'aave',
  'GRT': 'the-graph', 'INJ': 'injective-protocol', 'ALGO': 'algorand',
  'FTM': 'fantom', 'QNT': 'quant', 'EOS': 'eos', 'EGLD': 'elrond',
  'SAND': 'the-sandbox', 'MANA': 'decentraland', 'AXS': 'axie-infinity',
  'XTZ': 'tezos', 'THETA': 'theta', 'FLOW': 'flow', 'RUNE': 'thorchain',
  'IMX': 'immutable-x', 'NEO': 'neo', 'GALA': 'gala', 'KAVA': 'kava',
  'CRV': 'curve-dao-token', 'STX': 'stacks', 'MINA': 'mina',
  'XDC': 'xdc-network', 'CAKE': 'pancakeswap', 'PEPE': 'pepe',
  'SUI': 'sui', 'RNDR': 'render-token', 'FET': 'fetch', 'AGIX': 'singularitynet',
  'OCEAN': 'ocean-protocol', 'WLD': 'worldcoin', 'TAO': 'bittensor',
  'BONK': 'bonk', 'FLOKI': 'floki-inu', 'WIF': 'dogwifhat', 'SEI': 'sei',
  'TIA': 'celestia', 'JUP': 'jupiter', 'STRK': 'starknet', 'PYTH': 'pyth-network',
  'ENS': 'ethereum-name-service', 'COMP': 'compound', 'SNX': 'synthetix-network-token',
  'ZEC': 'zcash', 'IOTA': 'iota', 'KCS': 'kucoin-token', '1INCH': '1inch',
  'ENJ': 'enjin-coin', 'CHZ': 'chiliz', 'BAT': 'basic-attention-token',
  'ZIL': 'zilliqa', 'DASH': 'dash', 'WAVES': 'waves', 'CELO': 'celo',
  'GMT': 'stepn', 'BLUR': 'blur', 'MASK': 'mask-network', 'YFI': 'yearn-finance',
  'SUSHI': 'sushi', 'ANKR': 'ankr', 'LRC': 'loopring', 'ONE': 'harmony',
  'HOT': 'holotoken', 'QTUM': 'qtum', 'OMG': 'omg', 'ZRX': '0x',
};

const calcRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
};

export default async function handler(req) {
  const CMC_API_KEY = process.env.CMC_API_KEY;
  
  if (!CMC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'CMC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Fetch main data from CoinMarketCap
    const cmcRes = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=150&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!cmcRes.ok) {
      throw new Error(`CMC API error: ${cmcRes.status}`);
    }
    
    const cmcData = await cmcRes.json();

    // 2. Process CMC tokens with CoinCap ID mapping
    const tokens = cmcData.data.map(coin => ({
      id: coin.slug,
      cmcId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      rank: coin.cmc_rank,
      price: coin.quote.USD.price,
      mcap: coin.quote.USD.market_cap,
      volume: coin.quote.USD.volume_24h,
      change1h: coin.quote.USD.percent_change_1h,
      change24h: coin.quote.USD.percent_change_24h,
      change7d: coin.quote.USD.percent_change_7d,
      change30d: coin.quote.USD.percent_change_30d,
      supply: coin.circulating_supply,
      maxSupply: coin.max_supply,
      dominance: coin.quote.USD.market_cap_dominance,
      capId: COINCAP_IDS[coin.symbol] || coin.slug,
      rsi: null,
      sparkline: null,
    }));

    // 3. Fetch RSI data from CoinCap (top 30 coins to avoid timeout)
    const tokensToFetch = tokens.slice(0, 30);
    
    const results = await Promise.allSettled(
      tokensToFetch.map(async (token) => {
        try {
          const res = await fetch(
            `https://api.coincap.io/v2/assets/${token.capId}/history?interval=h2`,
            { 
              headers: { 'Accept-Encoding': 'gzip' },
            }
          );
          
          if (!res.ok) return { symbol: token.symbol, rsi: null, sparkline: null };
          
          const data = await res.json();
          if (!data.data || data.data.length < 20) {
            return { symbol: token.symbol, rsi: null, sparkline: null };
          }
          
          const prices = data.data.slice(-84).map(h => parseFloat(h.priceUsd));
          const rsi = calcRSI(prices, 14);
          const sparkline = prices.slice(-24);
          
          return { symbol: token.symbol, rsi, sparkline };
        } catch (e) {
          return { symbol: token.symbol, rsi: null, sparkline: null };
        }
      })
    );

    // 4. Update tokens with RSI data
    let rsiCount = 0;
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value && result.value.rsi !== null) {
        const idx = tokens.findIndex(t => t.symbol === result.value.symbol);
        if (idx !== -1) {
          tokens[idx].rsi = result.value.rsi;
          tokens[idx].sparkline = result.value.sparkline;
          rsiCount++;
        }
      }
    });

    // 5. Return data
    return new Response(
      JSON.stringify({
        tokens,
        timestamp: new Date().toISOString(),
        stats: {
          total: tokens.length,
          withRSI: rsiCount,
          cmcCredits: cmcData.status.credit_count,
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
