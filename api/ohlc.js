// ==================================================
// FILE: api/ohlc.js
// Proxy endpoint for CoinGecko OHLC data (for candlestick charts)
// Uses market_chart endpoint to generate better granularity candles
// ==================================================

export const config = {
  runtime: 'edge',
};

// Aggregate price data into OHLC candles
const generateOHLCFromPrices = (prices, targetCandles = 90) => {
  if (!prices || prices.length < 2) return [];
  
  // Determine candle interval based on data points and target candles
  const totalDuration = prices[prices.length - 1][0] - prices[0][0];
  const candleInterval = Math.ceil(prices.length / targetCandles);
  
  const ohlc = [];
  
  for (let i = 0; i < prices.length; i += candleInterval) {
    const chunk = prices.slice(i, Math.min(i + candleInterval, prices.length));
    if (chunk.length === 0) continue;
    
    const timestamp = chunk[0][0];
    const chunkPrices = chunk.map(p => p[1]);
    
    const open = chunkPrices[0];
    const close = chunkPrices[chunkPrices.length - 1];
    const high = Math.max(...chunkPrices);
    const low = Math.min(...chunkPrices);
    
    ohlc.push([timestamp, open, high, low, close]);
  }
  
  return ohlc;
};

// Determine target candle count based on timeframe
const getTargetCandles = (days) => {
  if (days <= 1) return 48;      // 30-min candles for 1 day
  if (days <= 7) return 84;      // 2-hour candles for 7 days
  if (days <= 30) return 60;     // 12-hour candles for 30 days
  if (days <= 90) return 90;     // Daily candles for 90 days
  if (days <= 180) return 90;    // 2-day candles for 180 days
  return 120;                     // ~3-day candles for 1 year+
};

export default async function handler(req) {
  const url = new URL(req.url);
  const tokenId = url.searchParams.get('id');
  const days = url.searchParams.get('days') || '30';

  if (!tokenId) {
    return new Response(
      JSON.stringify({ error: 'Token ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const CG_API_KEY = process.env.COINGECKO_API_KEY;

  try {
    const baseUrl = CG_API_KEY 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    
    const headers = {
      'Accept': 'application/json',
    };
    
    if (CG_API_KEY) {
      headers['x-cg-pro-api-key'] = CG_API_KEY;
    }

    // Try native OHLC with daily interval for paid API
    if (CG_API_KEY && parseInt(days) <= 180) {
      const ohlcUrl = `${baseUrl}/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}&interval=daily`;
      const ohlcResponse = await fetch(ohlcUrl, { headers });
      
      if (ohlcResponse.ok) {
        const ohlcData = await ohlcResponse.json();
        if (ohlcData && ohlcData.length >= 10) {
          return new Response(
            JSON.stringify({ ohlc: ohlcData, source: 'native-daily' }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      }
    }

    // Fallback: Use market_chart endpoint and generate OHLC
    // This provides much better granularity for free API users
    const chartUrl = `${baseUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
    const chartResponse = await fetch(chartUrl, { headers });

    if (!chartResponse.ok) {
      throw new Error(`CoinGecko API error: ${chartResponse.status}`);
    }

    const chartData = await chartResponse.json();

    if (!chartData.prices || chartData.prices.length < 2) {
      throw new Error('Insufficient price data');
    }

    // Generate OHLC candles from price data
    const targetCandles = getTargetCandles(parseInt(days));
    const ohlc = generateOHLCFromPrices(chartData.prices, targetCandles);

    return new Response(
      JSON.stringify({ ohlc, source: 'generated', dataPoints: chartData.prices.length }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('OHLC API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
