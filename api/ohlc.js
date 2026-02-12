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
  let priceIdx = 0;
  
  for (let i = 0; i < targetCandles; i++) {
    const candleStart = startTime + (i * candleDuration);
    const candleEnd = candleStart + candleDuration;
    
    // Advance to this candle's start
    while (priceIdx < prices.length && prices[priceIdx][0] < candleStart) {
      lastPrice = prices[priceIdx][1];
      priceIdx++;
    }
    
    // Collect prices in this window
    const candlePriceValues = [];
    const savedIdx = priceIdx;
    while (priceIdx < prices.length && prices[priceIdx][0] < candleEnd) {
      candlePriceValues.push(prices[priceIdx][1]);
      priceIdx++;
    }
    
    if (candlePriceValues.length === 0) {
      ohlc.push([candleStart, lastPrice, lastPrice, lastPrice, lastPrice]);
    } else {
      const open = candlePriceValues[0];
      const close = candlePriceValues[candlePriceValues.length - 1];
      let high = open, low = open;
      for (let j = 0; j < candlePriceValues.length; j++) {
        if (candlePriceValues[j] > high) high = candlePriceValues[j];
        if (candlePriceValues[j] < low) low = candlePriceValues[j];
      }
      ohlc.push([candleStart, open, high, low, close]);
      lastPrice = close;
    }
  }
  
  return ohlc;
};

// Target candle counts calibrated to match CoinGecko's visual density
const getTargetCandles = (actualDays) => {
  if (actualDays <= 1) return 24;      // 24H: hourly
  if (actualDays <= 7) return 42;      // 7D: ~4h candles
  if (actualDays <= 30) return 30;     // 1M: daily
  if (actualDays <= 90) return 45;     // 3M: ~2-day
  if (actualDays <= 365) return 52;    // 1Y: weekly
  if (actualDays <= 1825) return 60;   // up to 5Y: ~monthly
  return 60;                           // Max: ~monthly (capped at 60)
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

    // Pass daysParam directly — CoinGecko supports 'max' natively
    const chartUrl = `${baseUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${daysParam}`;
    const chartResponse = await fetch(chartUrl, { headers });

    if (!chartResponse.ok) {
      throw new Error(`CoinGecko API error: ${chartResponse.status}`);
    }

    const chartData = await chartResponse.json();

    if (!chartData.prices || chartData.prices.length < 2) {
      throw new Error('Insufficient price data');
    }

    // Calculate actual span from the data itself
    const startTime = chartData.prices[0][0];
    const endTime = chartData.prices[chartData.prices.length - 1][0];
    const actualDays = (endTime - startTime) / (86400000);

    const targetCandles = getTargetCandles(actualDays);
    const ohlc = generateOHLCFromPrices(chartData.prices, targetCandles);

    return new Response(
      JSON.stringify({ 
        ohlc, 
        dataPoints: chartData.prices.length,
        actualCandles: ohlc.length,
        spanDays: Math.round(actualDays)
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
