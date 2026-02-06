// ==================================================
// FILE: api/bybit.js
// Proxy endpoint for Bybit API (avoids CORS issues)
// ==================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const endpoint = url.searchParams.get('endpoint') || 'klines';
  const interval = url.searchParams.get('interval') || '60';
  const limit = url.searchParams.get('limit') || '200';

  if (!symbol) {
    return new Response(
      JSON.stringify({ error: 'Symbol is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Normalize symbol to Bybit format (e.g., BTC -> BTCUSDT)
  const normalizedSymbol = symbol.toUpperCase().trim()
    .replace(/USD$/, '')
    .replace(/USDT$/, '')
    .replace(/USDC$/, '') + 'USDT';

  try {
    let bybitUrl;
    
    switch (endpoint) {
      case 'klines':
        bybitUrl = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${normalizedSymbol}&interval=${interval}&limit=${limit}`;
        break;
      case 'ticker':
        bybitUrl = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${normalizedSymbol}`;
        break;
      case 'funding':
        bybitUrl = `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${normalizedSymbol}&limit=${limit}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const response = await fetch(bybitUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();

    // Check Bybit response code
    if (data.retCode !== 0) {
      return new Response(
        JSON.stringify({ error: data.retMsg || 'Bybit API error', retCode: data.retCode }),
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
    console.error('Bybit Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
