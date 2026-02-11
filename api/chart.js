// ==================================================
// FILE: api/chart.js
// Proxy endpoint for CoinGecko chart data (avoids CORS issues)
// ==================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const tokenId = url.searchParams.get('id');
  const days = url.searchParams.get('days') || '30';
  const type = url.searchParams.get('type') || 'line'; // 'line' or 'ohlc'

  if (!tokenId) {
    return new Response(
      JSON.stringify({ error: 'Token ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const CG_API_KEY = process.env.COINGECKO_API_KEY;

  try {
    // Use Pro API if key is available, otherwise use free API
    const baseUrl = CG_API_KEY 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    
    let chartUrl;
    if (type === 'ohlc') {
      // OHLC endpoint - CoinGecko returns candlestick data
      // days parameter determines candle granularity:
      // 1-2 days: 30 min candles
      // 3-30 days: 4 hour candles
      // 31-90 days: 4 hour candles
      // 91+ days: 4 day candles
      chartUrl = `${baseUrl}/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;
    } else {
      // Regular market chart for line charts
      chartUrl = `${baseUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
    }
    
    const headers = {
      'Accept': 'application/json',
    };
    
    if (CG_API_KEY) {
      headers['x-cg-pro-api-key'] = CG_API_KEY;
    }

    const response = await fetch(chartUrl, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600', // Cache 5 min
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Chart API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
