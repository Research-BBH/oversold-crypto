// ==================================================
// FILE: api/ohlc.js
// Proxy for CoinGecko's native OHLC endpoint
// Returns real candlestick data (not derived from price points)
// ==================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const tokenId = url.searchParams.get('id');
  const daysParam = url.searchParams.get('days') || '30';

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
    
    const headers = { 'Accept': 'application/json' };
    if (CG_API_KEY) headers['x-cg-pro-api-key'] = CG_API_KEY;

    // Use CoinGecko's native OHLC endpoint — returns proper candle data
    // Candle granularity is automatic:
    //   1-2 days  → 30 min candles
    //   3-30 days → 4 hour candles
    //   31+ days  → 4 day candles
    const ohlcUrl = `${baseUrl}/coins/${tokenId}/ohlc?vs_currency=usd&days=${daysParam}`;
    const ohlcResponse = await fetch(ohlcUrl, { headers });

    if (!ohlcResponse.ok) {
      throw new Error(`CoinGecko OHLC API error: ${ohlcResponse.status}`);
    }

    // Response format: [[timestamp, open, high, low, close], ...]
    const ohlcData = await ohlcResponse.json();

    if (!ohlcData || !Array.isArray(ohlcData) || ohlcData.length < 2) {
      throw new Error('Insufficient OHLC data');
    }

    return new Response(
      JSON.stringify({ 
        ohlc: ohlcData, 
        actualCandles: ohlcData.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
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
