// ==================================================
// FILE: src/pages/TokenDetailPage.jsx
// ==================================================

import { formatPrice, formatNumber, getRsiStyle } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { 
  RSIMeter, 
  PriceChart, 
  TimeRangeSelector, 
  ChartTypeToggle,
  TIME_RANGES,
  CHART_TYPES 
} from '../components/Charts';
import { FullSignalAnalysis } from '../components/SignalAnalysis';
import { analyzeToken } from '../utils/signals';
import { getBybitTokenData, calculateHistoricalRSI as calculateBybitRSI } from '../utils/bybit';
import { getOKXTokenData, calculateHistoricalRSI as calculateOKXRSI } from '../utils/okx';
import { getComprehensiveTokenData, fetchChartDataForRange } from '../utils/coingecko-enhanced';
import { useState, useEffect } from 'react';

export const TokenDetailPage = ({ token, onBack, darkMode, setDarkMode }) => {
  // Signal analysis state
  const [signalAnalysis, setSignalAnalysis] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(true);
  
  // Chart state - initialize with sparkline data if available
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState(CHART_TYPES.LINE);
  const [chartData, setChartData] = useState(() => {
    // Initialize with sparkline data if available
    if (token?.sparklineRaw && token.sparklineRaw.length > 0) {
      const prices = token.sparklineRaw;
      const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
      return {
        prices,
        ohlc: null,
        change,
        timeRange: '7d',
        source: 'initial-sparkline'
      };
    }
    return null;
  });
  const [loadingChart, setLoadingChart] = useState(true);

  // Fetch chart data when time range changes
  useEffect(() => {
    if (!token?.id) return;
    
    const fetchChart = async () => {
      setLoadingChart(true);
      
      // Prepare fallback prices from sparkline
      let fallbackPrices = null;
      if (token.sparklineRaw && token.sparklineRaw.length > 0) {
        fallbackPrices = token.sparklineRaw;
        console.log(`Fallback available: ${fallbackPrices.length} sparklineRaw points`);
      } else if (token.sparkline && token.sparkline.length > 0 && token.price) {
        // Convert normalized sparkline back to prices
        const startPrice = token.price / (1 + (token.change7d || 0) / 100);
        fallbackPrices = token.sparkline.map(v => startPrice * (v / 100));
        console.log(`Fallback available: ${fallbackPrices.length} converted sparkline points`);
      }
      
      try {
        console.log(`Fetching chart data for ${token.id} with range ${timeRange}...`);
        
        const data = await fetchChartDataForRange(token.id, timeRange, fallbackPrices);
        
        if (data && data.prices && data.prices.length > 0) {
          console.log(`Chart data received: ${data.prices.length} prices, source: ${data.source}`);
          setChartData(data);
        } else if (fallbackPrices && fallbackPrices.length > 0) {
          // API returned nothing, use fallback
          console.log(`API returned no data, using fallback for ${token.id}`);
          const change = ((fallbackPrices[fallbackPrices.length - 1] - fallbackPrices[0]) / fallbackPrices[0]) * 100;
          setChartData({
            prices: fallbackPrices,
            ohlc: null,
            change,
            timeRange,
            source: 'sparkline-fallback'
          });
        } else {
          console.warn('No chart data available and no fallback');
          setChartData(null);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Use fallback on error
        if (fallbackPrices && fallbackPrices.length > 0) {
          console.log(`Error occurred, using fallback for ${token.id}`);
          const change = ((fallbackPrices[fallbackPrices.length - 1] - fallbackPrices[0]) / fallbackPrices[0]) * 100;
          setChartData({
            prices: fallbackPrices,
            ohlc: null,
            change,
            timeRange,
            source: 'error-fallback'
          });
        } else {
          setChartData(null);
        }
      } finally {
        setLoadingChart(false);
      }
    };
    
    fetchChart();
  }, [token?.id, token?.sparklineRaw, token?.sparkline, token?.price, token?.change7d, timeRange]);

  // Fetch signal analysis data
  useEffect(() => {
    if (!token) return;
    
    const fetchSignalData = async () => {
      setLoadingSignals(true);
      
      try {
        let historicalData = null;
        let dataSource = 'none';
        
        // STRATEGY 1: Try Bybit first (best data for futures, free volume + funding)
        try {
          const bybitData = await getBybitTokenData(token.symbol, 168);
          
          if (bybitData && bybitData.prices.length >= 50) {
            const rsiValues = calculateBybitRSI(bybitData.prices, 14);
            historicalData = {
              prices: bybitData.prices,
              volumes: bybitData.volumes,
              rsiValues: rsiValues,
              fundingRate: bybitData.fundingRate,
              source: 'bybit'
            };
            dataSource = 'bybit';
            console.log(`✅ Bybit data loaded for ${token.symbol}: ${bybitData.dataPoints} points, funding: ${bybitData.fundingRate}`);
          }
        } catch (error) {
          console.log(`Bybit failed for ${token.symbol}, trying OKX...`);
        }
        
        // STRATEGY 2: Try OKX if Bybit failed (different token coverage)
        if (!historicalData) {
          try {
            const okxData = await getOKXTokenData(token.symbol, 168);
            
            if (okxData && okxData.prices.length >= 50) {
              const rsiValues = calculateOKXRSI(okxData.prices, 14);
              historicalData = {
                prices: okxData.prices,
                volumes: okxData.volumes,
                rsiValues: rsiValues,
                fundingRate: okxData.fundingRate,
                source: 'okx'
              };
              dataSource = 'okx';
              console.log(`✅ OKX data loaded for ${token.symbol}: ${okxData.dataPoints} points, funding: ${okxData.fundingRate}`);
            }
          } catch (error) {
            console.log(`OKX failed for ${token.symbol}, trying CoinGecko...`);
          }
        }
        
        // STRATEGY 3: Use enhanced CoinGecko data (works for all tokens, but no funding)
        if (!historicalData) {
          const cgData = await getComprehensiveTokenData(token.id, token.symbol);
          
          if (cgData && cgData.prices.length >= 50) {
            historicalData = {
              prices: cgData.prices,
              volumes: cgData.volumes || [],
              rsiValues: cgData.rsiValues || [],
              fundingRate: null,
              source: 'coingecko'
            };
            dataSource = 'coingecko';
            console.log(`✅ CoinGecko data loaded for ${token.symbol}: ${cgData.dataPoints} points`);
          }
        }
        
        // STRATEGY 4: Last resort - use sparkline (limited but better than nothing)
        if (!historicalData && token.sparklineRaw && token.sparklineRaw.length > 0) {
          historicalData = {
            prices: token.sparklineRaw,
            volumes: [],
            rsiValues: [],
            fundingRate: null,
            source: 'sparkline'
          };
          dataSource = 'sparkline';
          console.log(`⚠️ Using sparkline fallback for ${token.symbol}: ${token.sparklineRaw.length} points`);
        }
        
        // Analyze with whatever data we have
        const analysis = analyzeToken(token, historicalData);
        
        // Add data source info to analysis
        analysis.dataSource = dataSource;
        analysis.dataPoints = historicalData?.prices?.length || 0;
        
        setSignalAnalysis(analysis);
        
      } catch (error) {
        console.error('Error fetching signal data:', error);
        // Still provide basic analysis
        const basicAnalysis = analyzeToken(token, {
          prices: token.sparklineRaw || [],
          volumes: [],
          rsiValues: [],
          fundingRate: null
        });
        basicAnalysis.dataSource = 'fallback';
        setSignalAnalysis(basicAnalysis);
      } finally {
        setLoadingSignals(false);
      }
    };
    
    fetchSignalData();
  }, [token?.id, token?.symbol]);

  // Early return AFTER all hooks have been called
  if (!token) return null;

  const rs = getRsiStyle(token.rsi);
  
  // Get the change percentage for the selected time range
  const getChangeForRange = () => {
    if (chartData?.change !== undefined) {
      return chartData.change;
    }
    // Fallback to token data
    switch (timeRange) {
      case '24h': return token.change24h;
      case '7d': return token.change7d;
      case '1m': return token.change30d;
      default: return token.change7d;
    }
  };
  
  const currentChange = getChangeForRange();

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg ${
                darkMode
                  ? 'bg-white/5 hover:bg-white/10'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              } transition-colors`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <img
              src={token.image}
              alt={token.symbol}
              className="w-16 h-16 rounded-2xl bg-gray-800"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{token.name}</h1>
                <span className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {token.symbol}
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Rank #{token.rank}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-bold">{formatPrice(token.price)}</span>
                <span
                  className={`text-lg font-semibold ${
                    token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {token.change24h >= 0 ? '+' : ''}
                  {token.change24h?.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
          </div>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div
            className={`lg:col-span-2 ${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            } rounded-2xl p-6 border`}
          >
            {/* Chart Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Price Chart</h2>
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    (currentChange || 0) >= 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {(currentChange || 0) >= 0 ? '+' : ''}
                  {(currentChange || 0).toFixed(2)}%
                </span>
              </div>
              
              {/* Chart Controls */}
              <div className="flex items-center gap-3">
                <ChartTypeToggle
                  selected={chartType}
                  onChange={setChartType}
                  darkMode={darkMode}
                  disabled={loadingChart}
                />
                <TimeRangeSelector
                  selected={timeRange}
                  onChange={setTimeRange}
                  darkMode={darkMode}
                  disabled={loadingChart}
                />
              </div>
            </div>
            
            {/* Chart */}
            <PriceChart
              prices={chartData?.prices}
              ohlcData={chartData?.ohlc}
              timeRange={timeRange}
              chartType={chartType}
              darkMode={darkMode}
              loading={loadingChart}
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* RSI Section */}
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } rounded-2xl p-6 border`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">RSI (14)</h2>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${rs.dot}`} />
                  <span className={`text-2xl font-bold ${rs.text}`}>
                    {token.rsi !== null ? token.rsi.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
              <RSIMeter value={token.rsi} />
              <div className={`mt-4 p-3 rounded-xl ${rs.bg} border ${rs.text}`}>
                <span className="font-semibold">{rs.label}</span>
                <p className="text-sm opacity-80 mt-1">
                  {token.rsi < 30
                    ? 'This token may be oversold.'
                    : token.rsi > 70
                    ? 'This token may be overbought.'
                    : 'Neutral territory.'}
                </p>
              </div>
            </div>

            {/* Price Changes Section */}
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } rounded-2xl p-6 border`}
            >
              <h2 className="text-lg font-semibold mb-4">Price Changes</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: '1 Hour', v: token.change1h },
                  { l: '24 Hours', v: token.change24h },
                  { l: '7 Days', v: token.change7d },
                  { l: '30 Days', v: token.change30d },
                ].map((x) => (
                  <div
                    key={x.l}
                    className={`${
                      darkMode ? 'bg-white/5' : 'bg-gray-100'
                    } rounded-xl p-4 text-center`}
                  >
                    <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {x.l}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        (x.v || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {x.v != null ? `${x.v >= 0 ? '+' : ''}${x.v.toFixed(2)}%` : '--'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Signal Analysis Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">📊 Trading Signal Analysis</h2>
          {loadingSignals ? (
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-12 text-center`}>
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Fetching enhanced signal data...</p>
            </div>
          ) : (
            <FullSignalAnalysis analysis={signalAnalysis} darkMode={darkMode} />
          )}
        </div>

        {/* Market Data Section */}
        <div
          className={`mt-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } rounded-2xl p-6 border`}
        >
          <h2 className="text-lg font-semibold mb-4">Market Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '💰', label: 'Price', value: formatPrice(token.price) },
              { icon: '📊', label: 'Market Cap', value: '$' + formatNumber(token.mcap) },
              { icon: '📈', label: '24h Volume', value: '$' + formatNumber(token.volume) },
              { icon: '🔄', label: 'Vol/MCap', value: token.volMcap?.toFixed(2) + '%' },
              {
                icon: '💎',
                label: 'Supply',
                value: formatNumber(token.supply) + ' ' + token.symbol,
              },
              { icon: '🏆', label: 'Dominance', value: (token.dominance || 0).toFixed(3) + '%' },
            ].map((x) => (
              <div
                key={x.label}
                className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4`}
              >
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {x.icon} {x.label}
                </p>
                <p className="text-lg font-bold truncate">{x.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ATH/ATL Section */}
        {token.ath && (
          <div
            className={`mt-6 ${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            } rounded-2xl p-6 border`}
          >
            <h2 className="text-lg font-semibold mb-4">All-Time High & Low</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🚀</span>
                  <h3 className="font-semibold text-green-400">All-Time High</h3>
                </div>
                <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4`}>
                  <p className="text-2xl font-bold mb-2">{formatPrice(token.ath)}</p>
                  <p className="text-sm text-gray-500 mb-1">
                    {new Date(token.athDate).toLocaleDateString()}
                  </p>
                  <p className={`text-sm ${token.athChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {token.athChange >= 0 ? '+' : ''}
                    {token.athChange?.toFixed(2)}% from ATH
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📉</span>
                  <h3 className="font-semibold text-red-400">All-Time Low</h3>
                </div>
                <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4`}>
                  <p className="text-2xl font-bold mb-2">{formatPrice(token.atl)}</p>
                  <p className="text-sm text-gray-500 mb-1">
                    {new Date(token.atlDate).toLocaleDateString()}
                  </p>
                  <p className={`text-sm ${token.atlChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.atlChange >= 0 ? '+' : ''}
                    {token.atlChange?.toFixed(2)}% from ATL
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CoinGecko Link */}
        <div className="mt-6">
          <a
            href={`https://coingecko.com/en/coins/${token.id}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-4 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-center text-green-400 font-medium transition-colors text-lg"
          >
            View on CoinGecko ↗
          </a>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};
