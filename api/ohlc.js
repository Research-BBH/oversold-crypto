// ==================================================
// FILE: api/ohlc.js
// Proxy endpoint for CoinGecko OHLC data (for candlestick charts)
// Uses market_chart endpoint to generate better granularity candles
// ==================================================

export const config = {
  runtime: 'edge',
};

// Generate exactly N candles covering equal time intervals
const generateOHLCFromPrices = (prices, targetCandles = 60) => {
  if (!prices || prices.length < 2) return [];
  
  const startTime = prices[0][0];
  const endTime = prices[prices.length - 1][0];
  const candleDuration = (endTime - startTime) / targetCandles;
  
  const ohlc = [];
  let lastPrice = prices[0][1];
  
  for (let i = 0; i < targetCandles; i++) {
    const candleStart = startTime + (i * candleDuration);
    const candleEnd = candleStart + candleDuration;
    
    // Filter prices for this candle's time window
    const candlePrices = prices.filter(p => p[0] >= candleStart && p[0] < candleEnd);
    
    if (candlePrices.length === 0) {
      // No data - flat candle with last known price
      ohlc.push([candleStart, lastPrice, lastPrice, lastPrice, lastPrice]);
    } else {
      const priceValues = candlePrices.map(p => p[1]);
      const open = priceValues[0];
      const close = priceValues[priceValues.length - 1];
      const high = Math.max(...priceValues);
      const low = Math.min(...priceValues);
      ohlc.push([candleStart, open, high, low, close]);
      lastPrice = close;
    }
  }
  
  return ohlc;
};

// Target candle counts - balanced for readability
const getTargetCandles = (days) => {
  if (days <= 1) return 48;
  if (days <= 7) return 56;
  if (days <= 30) return 60;
  if (days <= 90) return 75;
  if (days <= 365) return 80;
  return 80;  // Max - same as 1Y for good visibility
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
    
    const headers = { 'Accept': 'application/json' };
    if (CG_API_KEY) headers['x-cg-pro-api-key'] = CG_API_KEY;

    const chartUrl = `${baseUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
    const chartResponse = await fetch(chartUrl, { headers });

    if (!chartResponse.ok) {
      throw new Error(`CoinGecko API error: ${chartResponse.status}`);
    }

    const chartData = await chartResponse.json();

    if (!chartData.prices || chartData.prices.length < 2) {
      throw new Error('Insufficient price data');
    }

    const targetCandles = getTargetCandles(parseInt(days));
    const ohlc = generateOHLCFromPrices(chartData.prices, targetCandles);

    return new Response(
      JSON.stringify({ 
        ohlc, 
        dataPoints: chartData.prices.length,
        actualCandles: ohlc.length
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
