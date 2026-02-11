// ==================================================
// FILE: api/ohlc.js
// Proxy endpoint for CoinGecko OHLC data (for candlestick charts)
// ==================================================

export const config = {
  runtime: 'edge',
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
    // Use Pro API if key is available, otherwise use free API
    const baseUrl = CG_API_KEY 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    
    // CoinGecko OHLC endpoint
    // Valid days values: 1, 7, 14, 30, 90, 180, 365, max
    const ohlcUrl = `${baseUrl}/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;
    
    const headers = {
      'Accept': 'application/json',
    };
    
    if (CG_API_KEY) {
      headers['x-cg-pro-api-key'] = CG_API_KEY;
    }

    const response = await fetch(ohlcUrl, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // OHLC data format: [[timestamp, open, high, low, close], ...]
    return new Response(
      JSON.stringify({ ohlc: data }),
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
    console.error('OHLC API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
