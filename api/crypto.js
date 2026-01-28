// ==================================================
// FILE: api/crypto.js (FIXED VERSION)
// ==================================================
// Put this file inside the "api" folder

export const config = {
  runtime: 'edge',
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
      const errorText = await cmcRes.text();
      throw new Error(`CMC API error: ${cmcRes.status} - ${errorText}`);
    }
    
    const cmcData = await cmcRes.json();

    // 2. Fetch token list from CoinCap to map IDs
    let symbolToCapId = {};
    try {
      const ccListRes = await fetch('https://api.coincap.io/v2/assets?limit=200');
      if (ccListRes.ok) {
        const ccList = await ccListRes.json();
        ccList.data.forEach(c => {
          symbolToCapId[c.symbol.toUpperCase()] = c.id;
        });
      }
    } catch (e) {
      console.log('CoinCap list fetch failed, continuing without RSI');
    }

    // 3. Process CMC tokens
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
      change90d: coin.quote.USD.percent_change_90d,
      supply: coin.circulating_supply,
      maxSupply: coin.max_supply,
      dominance: coin.quote.USD.market_cap_dominance,
      capId: symbolToCapId[coin.symbol] || null,
      rsi: null,
      sparkline: null,
    }));

    // 4. Fetch historical data from CoinCap for RSI (top 50 only to avoid timeout)
    const tokensWithCapId = tokens.filter(t => t.capId).slice(0, 50);
    
    const historyPromises = tokensWithCapId.map(async (token) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const histRes = await fetch(
          `https://api.coincap.io/v2/assets/${token.capId}/history?interval=h1`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!histRes.ok) return null;
        const histData = await histRes.json();
        
        if (!histData.data || histData.data.length < 20) return null;
        
        const prices = histData.data.slice(-168).map(h => parseFloat(h.priceUsd));
        const rsi = calcRSI(prices, 14);
        const sparkline = prices.slice(-48);
        
        return { symbol: token.symbol, rsi, sparkline };
      } catch (e) {
        return null;
      }
    });

    const historyResults = await Promise.all(historyPromises);
    
    // Update tokens with RSI data
    historyResults.forEach(result => {
      if (result) {
        const idx = tokens.findIndex(t => t.symbol === result.symbol);
        if (idx !== -1) {
          tokens[idx].rsi = result.rsi;
          tokens[idx].sparkline = result.sparkline;
        }
      }
    });

    // 5. Return combined data
    return new Response(
      JSON.stringify({
        tokens,
        timestamp: new Date().toISOString(),
        stats: {
          total: tokens.length,
          withRSI: tokens.filter(t => t.rsi !== null).length,
          cmcCredits: cmcData.status.credit_count,
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        } 
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
