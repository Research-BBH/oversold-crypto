// ==================================================
// FILE: api/crypto.js
// ==================================================
// Put this file inside the "api" folder

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const CMC_API_KEY = process.env.CMC_API_KEY;
  if (!CMC_API_KEY) {
    return res.status(500).json({ error: 'CMC_API_KEY not configured' });
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
    
    if (!cmcRes.ok) throw new Error(`CMC API error: ${cmcRes.status}`);
    const cmcData = await cmcRes.json();

    // 2. Fetch token list from CoinCap to map IDs
    const ccListRes = await fetch('https://api.coincap.io/v2/assets?limit=200');
    const ccList = ccListRes.ok ? (await ccListRes.json()).data : [];
    
    // Create symbol -> CoinCap ID map
    const symbolToCapId = {};
    ccList.forEach(c => {
      symbolToCapId[c.symbol.toUpperCase()] = c.id;
    });

    // 3. Process CMC tokens and fetch RSI data from CoinCap
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

    // 4. Fetch historical data from CoinCap for RSI (batch to avoid rate limits)
    const tokensWithCapId = tokens.filter(t => t.capId);
    const batchSize = 10;
    
    for (let i = 0; i < Math.min(tokensWithCapId.length, 100); i += batchSize) {
      const batch = tokensWithCapId.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (token) => {
        try {
          const histRes = await fetch(
            `https://api.coincap.io/v2/assets/${token.capId}/history?interval=h1`,
            { signal: AbortSignal.timeout(5000) }
          );
          
          if (!histRes.ok) return;
          const { data: hist } = await histRes.json();
          
          if (!hist || hist.length < 20) return;
          
          // Get last 168 hours (7 days) of prices
          const prices = hist.slice(-168).map(h => parseFloat(h.priceUsd));
          const rsi = calcRSI(prices, 14);
          const sparkline = prices.slice(-48); // Last 48 hours for chart
          
          // Calculate 7d change from actual historical data
          const change7dReal = prices.length > 1 
            ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 
            : token.change7d;
          
          // Update token in place
          const idx = tokens.findIndex(t => t.symbol === token.symbol);
          if (idx !== -1) {
            tokens[idx].rsi = rsi;
            tokens[idx].sparkline = sparkline;
            tokens[idx].change7dReal = change7dReal;
          }
        } catch (e) {
          // Timeout or error - skip this token
        }
      }));
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < tokensWithCapId.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // 5. Return combined data
    res.status(200).json({
      tokens,
      timestamp: new Date().toISOString(),
      stats: {
        total: tokens.length,
        withRSI: tokens.filter(t => t.rsi !== null).length,
        cmcCredits: cmcData.status.credit_count,
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}