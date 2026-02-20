// ==================================================
// FILE: src/utils/coingecko-enhanced.js
// Enhanced CoinGecko data fetching for better signal analysis
// Uses server-side proxy to leverage Pro API key
// ==================================================

import { calculateRSI, calculateHistoricalRSI } from './rsi';

// Re-export RSI functions for backward compatibility
export { calculateHistoricalRSI };

/**
 * Fetch extended market chart data from CoinGecko via proxy
 * This gives us enough data for proper SMA50 and other indicators
 */
export const fetchExtendedMarketData = async (tokenId, days = 90) => {
  try {
    // Use our proxy API to leverage the Pro API key
    const url = `/api/chart?id=${encodeURIComponent(tokenId)}&days=${days}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko proxy error for ${tokenId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Extract prices and volumes
    const prices = data.prices?.map(p => p[1]) || [];
    const volumes = data.total_volumes?.map(v => v[1]) || [];
    const timestamps = data.prices?.map(p => p[0]) || [];
    
    return {
      prices,
      volumes,
      timestamps,
      source: 'coingecko'
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko extended data for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Get OHLC data from CoinGecko via proxy
 * Available for: 1, 7, 14, 30, 90, 180, 365, max days
 */
export const fetchOHLCData = async (tokenId, days = 90) => {
  try {
    // Use our proxy API - we'll need to add OHLC support to it
    // For now, fall back to market_chart which the proxy already supports
    const url = `/api/chart?id=${encodeURIComponent(tokenId)}&days=${days}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko proxy OHLC error for ${tokenId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // market_chart doesn't return OHLC, but we can use close prices
    const prices = data.prices?.map(p => p[1]) || [];
    const timestamps = data.prices?.map(p => p[0]) || [];
    
    return {
      prices,
      highs: prices, // Approximation since we don't have true OHLC
      lows: prices,  // Approximation since we don't have true OHLC
      timestamps,
      source: 'coingecko-proxy'
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko OHLC for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Get comprehensive token data for analysis
 * Tries multiple sources and methods
 */
export const getComprehensiveTokenData = async (tokenId, symbol) => {
  try {
    // Try to get market chart data via proxy (uses Pro API)
    let marketData = await fetchExtendedMarketData(tokenId, 90);
    
    if (!marketData || !marketData.prices || marketData.prices.length === 0) {
      console.warn(`No extended data available for ${tokenId}`);
      return null;
    }
    
    // Calculate RSI history using shared function
    const rsiValues = calculateHistoricalRSI(marketData.prices, 14);
    
    return {
      ...marketData,
      rsiValues,
      dataPoints: marketData.prices.length
    };
  } catch (error) {
    console.error(`Error getting comprehensive data for ${tokenId}:`, error);
    return null;
  }
};
