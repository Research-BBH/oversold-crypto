// ==================================================
// FILE: api/ohlc.js
// Proxy endpoint for CoinGecko OHLC data (for candlestick charts)
// Uses market_chart endpoint to generate better granularity candles
// ==================================================

export const config = {
  runtime: 'edge',
};

// Aggregate price data into OHLC candles by dividing data evenly
// This guarantees uniform candle widths regardless of time gaps
const generateOHLCFromPrices = (prices, targetCandles = 60) => {
  if (!prices || prices.length < 2) return [];
  
  // Simply divide the data points evenly among candles
  const pointsPerCandle = Math.max(1, Math.floor(prices.length / targetCandles));
  const ohlc = [];
  
  for (let i = 0; i < targetCandles; i++) {
    const startIdx = i * pointsPerCandle;
    const endIdx = Math.min(startIdx + pointsPerCandle, prices.length);
    
    if (startIdx >= prices.length) break;
    
    const chunk = prices.slice(startIdx, endIdx);
    if (chunk.length === 0) break;
    
    const timestamp = chunk[0][0];
    const priceValues = chunk.map(p => p[1]);
    
    const open = priceValues[0];
    const close = priceValues[priceValues.length - 1];
    const high = Math.max(...priceValues);
    const low = Math.min(...priceValues);
    
    ohlc.push([timestamp, open, high, low, close]);
  }
  
  return ohlc;
};

// Determine target candle count based on timeframe
const getTargetCandles = (days) => {
  if (days <= 1) return 48;       // 30-min candles for 1 day
  if (days <= 7) return 56;       // 3-hour candles for 7 days  
  if (days <= 30) return 60;      // 12-hour candles for 30 days
  if (days <= 90) return 90;      // Daily candles for 90 days
  if (days <= 365) return 90;     // ~4-day candles for 1 year
  return 100;                      // ~weekly candles for max
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

    // Use market_chart endpoint for consistent results
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
      JSON.stringify({ 
        ohlc, 
        source: 'generated', 
        dataPoints: chartData.prices.length,
        actualCandles: ohlc.length
      }),
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
