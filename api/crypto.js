// ==================================================
// FILE: api/crypto.js (CoinGecko API with Real RSI)
// ==================================================

export const config = {
  runtime: 'edge',
};

// Calculate actual RSI from price data
// RSI = 100 - (100 / (1 + RS))
// RS = Average Gain / Average Loss over N periods
const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return null;
  
  // Calculate price changes
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  // We need at least 'period' changes
  if (changes.length < period) return null;
  
  // Use the most recent data for RSI calculation
  // For 7-day hourly data (168 points), we'll use the last 'period' hours
  const recentChanges = changes.slice(-period * 2); // Get more data for smoothing
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // Initial SMA for first 'period' changes
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
  
  // Apply smoothing for remaining changes (Wilder's smoothing)
  for (let i = period; i < recentChanges.length; i++) {
    const change = recentChanges[i] || 0;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100; // No losses = RSI 100
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 10) / 10; // Round to 1 decimal
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
    // CoinGecko Pro API endpoint with sparkline data
    // sparkline=true gives us 7 days of hourly price data (168 data points)
    const cgRes = await fetch(
      'https://pro-api.coingecko.com/api/v3/coins/markets?' + new URLSearchParams({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: '150',
        page: '1',
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
      throw new Error(`CoinGecko API error: ${cgRes.status} - ${errorText}`);
    }
    
    const cgData = await cgRes.json();
    
    // Calculate total market cap for dominance
    const totalMcap = cgData.reduce((sum, c) => sum + (c.market_cap || 0), 0);

    // Process tokens
    const tokens = cgData.map((coin, index) => {
      const sparklineData = coin.sparkline_in_7d?.price || [];
      
      // Calculate real RSI from sparkline data
      const rsi = calculateRSI(sparklineData, 14);
      
      // Normalize sparkline to percentage scale (starting at 100) for chart compatibility
      let normalizedSparkline = [];
      if (sparklineData.length > 0) {
        const startPrice = sparklineData[0];
        normalizedSparkline = sparklineData.map(p => (p / startPrice) * 100);
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
        sparkline: normalizedSparkline,
        sparklineRaw: sparklineData, // Keep raw prices for detailed view
        image: coin.image, // CoinGecko provides image URLs directly
      };
    });

    const withRSI = tokens.filter(t => t.rsi !== null).length;

    return new Response(
      JSON.stringify({
        tokens,
        timestamp: new Date().toISOString(),
        source: 'coingecko',
        stats: {
          total: tokens.length,
          withRSI: withRSI,
          dataPoints: tokens[0]?.sparkline?.length || 0,
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
