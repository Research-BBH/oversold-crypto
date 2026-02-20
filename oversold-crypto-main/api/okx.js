// ==================================================
// FILE: api/okx.js
// Proxy endpoint for OKX API (avoids CORS issues)
// ==================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const endpoint = url.searchParams.get('endpoint') || 'candles';
  const bar = url.searchParams.get('bar') || '1H';
  const limit = url.searchParams.get('limit') || '200';

  if (!symbol) {
    return new Response(
      JSON.stringify({ error: 'Symbol is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Normalize symbol to OKX format (e.g., BTC -> BTC-USDT-SWAP)
  const normalizedSymbol = symbol.toUpperCase().trim()
    .replace(/USD$/, '')
    .replace(/USDT$/, '')
    .replace(/USDC$/, '') + '-USDT-SWAP';

  try {
    let okxUrl;
    
    switch (endpoint) {
      case 'candles':
        okxUrl = `https://www.okx.com/api/v5/market/candles?instId=${normalizedSymbol}&bar=${bar}&limit=${limit}`;
        break;
      case 'ticker':
        okxUrl = `https://www.okx.com/api/v5/market/ticker?instId=${normalizedSymbol}`;
        break;
      case 'funding':
        okxUrl = `https://www.okx.com/api/v5/public/funding-rate?instId=${normalizedSymbol}`;
        break;
      case 'funding-history':
        okxUrl = `https://www.okx.com/api/v5/public/funding-rate-history?instId=${normalizedSymbol}&limit=${limit}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const response = await fetch(okxUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`OKX API error: ${response.status}`);
    }

    const data = await response.json();

    // Check OKX response code
    if (data.code !== '0') {
      return new Response(
        JSON.stringify({ error: data.msg || 'OKX API error', code: data.code }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('OKX Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
