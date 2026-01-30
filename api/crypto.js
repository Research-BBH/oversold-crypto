// ==================================================
// FILE: api/crypto.js (Updated with Categories)
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

// Map CoinGecko categories to our simplified categories
const mapCategory = (categories) => {
  if (!categories || categories.length === 0) return 'other';
  
  // Check categories array for matches (case-insensitive)
  const cats = categories.map(c => c.toLowerCase());
  
  // Layer 1 / Layer 2
  if (cats.some(c => c.includes('layer-1') || c.includes('layer-2') || 
                     c.includes('smart-contract') || c.includes('platform'))) {
    return 'layer-1';
  }
  
  // Meme coins
  if (cats.some(c => c.includes('meme') || c.includes('dog') || c.includes('cat'))) {
    return 'meme';
  }
  
  // DeFi
  if (cats.some(c => c.includes('defi') || c.includes('decentralized-finance') || 
                     c.includes('dex') || c.includes('lending') || c.includes('yield'))) {
    return 'defi';
  }
  
  // AI
  if (cats.some(c => c.includes('artificial-intelligence') || c.includes('ai') || 
                     c.includes('machine-learning'))) {
    return 'ai';
  }
  
  // Gaming
  if (cats.some(c => c.includes('gaming') || c.includes('metaverse') || 
                     c.includes('nft') || c.includes('collectibles'))) {
    return 'gaming';
  }
  
  // Exchange tokens
  if (cats.some(c => c.includes('exchange') || c.includes('centralized-exchange'))) {
    return 'exchange';
  }
  
  // Stablecoins
  if (cats.some(c => c.includes('stablecoin'))) {
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
    // Fetch market data with sparklines
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
    }
    
    // Fetch detailed data with categories for each coin (in batches to avoid rate limits)
    const detailedDataMap = new Map();
    
    // Process in batches of 50 to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (coin) => {
          try {
            const detailRes = await fetch(
              `https://pro-api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&community_data=false&developer_data=false`,
              {
                headers: {
                  'x-cg-pro-api-key': CG_API_KEY,
                  'Accept': 'application/json',
                },
              }
            );
            
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              detailedDataMap.set(coin.id, {
                categories: detailData.categories || [],
                description: detailData.description?.en || '',
              });
            }
          } catch (err) {
            console.error(`Failed to fetch details for ${coin.id}:`, err);
          }
        })
      );
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < allData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const cgData = allData;
    const totalMcap = cgData.reduce((sum, c) => sum + (c.market_cap || 0), 0);

    // Process tokens with category information
    const tokens = cgData.map((coin, index) => {
      const sparklineData = coin.sparkline_in_7d?.price || [];
      const rsi = calculateRSI(sparklineData, 14);
      
      let normalizedSparkline = [];
      if (sparklineData.length > 0) {
        const startPrice = sparklineData[0];
        normalizedSparkline = sparklineData.map(p => (p / startPrice) * 100);
      }
      
      // Get categories from detailed data
      const detailData = detailedDataMap.get(coin.id);
      const categories = detailData?.categories || [];
      const category = mapCategory(categories);
      
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
        category: category, // Now using CoinGecko's categories!
        categories: categories, // Store original categories for reference
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
