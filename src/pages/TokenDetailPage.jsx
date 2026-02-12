// ==================================================
// FILE: src/pages/TokenDetailPage.jsx
// ==================================================

import { formatPrice, formatNumber, getRsiStyle } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { RSIMeter, FullPageChart, CandlestickChart } from '../components/Charts';
import { FullSignalAnalysis } from '../components/SignalAnalysis';
import { RSIThresholdAnalysis } from '../components/RSIThresholdChart';
import { analyzeToken } from '../utils/signals';
import { getBybitTokenData } from '../utils/bybit';
import { getOKXTokenData } from '../utils/okx';
import { getComprehensiveTokenData } from '../utils/coingecko-enhanced';
import { calculateRSI, calculateHistoricalRSI } from '../utils/rsi';
import { useState, useEffect, useMemo } from 'react';

// RSI calculation imported from ../utils/rsi

// Timeframe configuration
const TIMEFRAMES = [
  { id: '24h', label: '24H', days: 1 },
  { id: '7d', label: '7D', days: 7 },
  { id: '1m', label: '1M', days: 30 },
  { id: '3m', label: '3M', days: 90 },
  { id: '1y', label: '1Y', days: 365 },
  { id: 'max', label: 'Max', days: 'max' },
];

// Generate time labels based on timeframe
const getTimeLabels = (timeframe) => {
  switch (timeframe) {
    case '24h':
      return ['24h ago', '18h', '12h', '6h', 'Now'];
    case '7d':
      return ['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
    case '1m':
      return ['30d ago', '25d', '20d', '15d', '10d', '5d', 'Now'];
    case '3m':
      return ['3m ago', '2.5m', '2m', '1.5m', '1m', '2w', 'Now'];
    case '1y':
      return ['1y ago', '10m', '8m', '6m', '4m', '2m', 'Now'];
    case 'max':
      return ['Start', '', '', '', '', '', 'Now'];
    default:
      return ['Start', '', '', '', '', '', 'Now'];
  }
};

// Chart Timeframe Component
const ChartWithTimeframe = ({ token, darkMode }) => {
  const [timeframe, setTimeframe] = useState('7d');
  const [chartType, setChartType] = useState('line'); // 'line' or 'candle'
  const [chartData, setChartData] = useState(null);
  const [ohlcData, setOhlcData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // Fetch data when timeframe changes
  useEffect(() => {
    const fetchChartData = async () => {
      // For 24h and 7d, use existing sparkline data
      if (timeframe === '24h') {
        if (token.sparkline && token.sparkline.length > 0) {
          const dataPoints = Math.floor(token.sparkline.length / 7);
          setChartData(token.sparkline.slice(-dataPoints));
          setPriceChange(token.change24h);
        }
        return;
      }
      
      if (timeframe === '7d') {
        if (token.sparkline && token.sparkline.length > 0) {
          setChartData(token.sparkline);
          setPriceChange(token.change7d);
        }
        return;
      }

      // For longer timeframes, fetch from CoinGecko via our API proxy
      setLoading(true);
      setError(null);
      
      try {
        const tf = TIMEFRAMES.find(t => t.id === timeframe);
        const days = tf?.days || 30;
        
        // Use our proxy API to avoid CORS issues
        const url = `/api/chart?id=${token.id}&days=${days}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.prices && data.prices.length > 0) {
          const prices = data.prices.map(p => p[1]);
          
          // Normalize to percentage (like sparkline)
          const startPrice = prices[0];
          const normalizedPrices = prices.map(p => (p / startPrice) * 100);
          
          // Calculate price change
          const endPrice = prices[prices.length - 1];
          const change = ((endPrice - startPrice) / startPrice) * 100;
          
          setChartData(normalizedPrices);
          setPriceChange(change);
        } else {
          setError('No data available');
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [timeframe, token.id, token.sparkline, token.change24h, token.change7d]);

  // Fetch OHLC data for candlestick chart
  useEffect(() => {
    if (chartType !== 'candle') return;

    const fetchOhlcData = async () => {
      setLoading(true);
      setError(null);
      setOhlcData(null); // Clear stale data so loading spinner shows

      try {
        const tf = TIMEFRAMES.find(t => t.id === timeframe);
        const days = tf?.days === 'max' ? 1825 : (tf?.days || 30); // Max = ~5 years

        const url = `/api/ohlc?id=${token.id}&days=${days}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch OHLC data: ${response.status}`);
        }

        const data = await response.json();

        if (data.ohlc && data.ohlc.length > 0) {
          setOhlcData(data.ohlc);
          // Calculate price change from OHLC
          const firstOpen = data.ohlc[0][1];
          const lastClose = data.ohlc[data.ohlc.length - 1][4];
          const change = ((lastClose - firstOpen) / firstOpen) * 100;
          setPriceChange(change);
        } else {
          setError('No OHLC data available');
        }
      } catch (err) {
        console.error('Error fetching OHLC data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOhlcData();
  }, [chartType, timeframe, token.id]);

  const timeLabels = getTimeLabels(timeframe);

  return (
    <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 border h-full flex flex-col`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Price Chart</h2>
          {/* Chart type toggle - CoinGecko style */}
          <div className={`inline-flex rounded-lg p-0.5 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'line'
                  ? darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </button>
            <button
              onClick={() => setChartType('candle')}
              title="Candlestick Chart"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'candle'
                  ? darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4v2" /><path d="M9 18v2" /><rect x="7" y="6" width="4" height="12" rx="1" />
                <path d="M17 2v4" /><path d="M17 16v4" /><rect x="15" y="6" width="4" height="10" rx="1" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'} overflow-x-auto`}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                  timeframe === tf.id
                    ? 'bg-orange-500 text-white shadow'
                    : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          {priceChange !== null && (
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px]">
      {loading ? (
        <div className="w-full h-full min-h-[200px] sm:min-h-[320px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading chart data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="w-full h-full min-h-[200px] sm:min-h-[320px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-2">⚠️ {error}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Try a different timeframe
            </p>
          </div>
        </div>
      ) : chartType === 'candle' ? (
        ohlcData ? (
          <CandlestickChart 
            ohlcData={ohlcData} 
            darkMode={darkMode}
          />
        ) : (
          <div className="w-full h-full min-h-[200px] sm:min-h-[320px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading candlestick data...</p>
            </div>
          </div>
        )
      ) : (
        <FullPageChart 
          data={chartData} 
          basePrice={token.price} 
          change7d={priceChange} 
          timeLabels={timeLabels}
        />
      )}
      </div>
    </div>
  );
};

export const TokenDetailPage = ({ token, onBack, darkMode, setDarkMode }) => {
  const [signalAnalysis, setSignalAnalysis] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [historicalPrices, setHistoricalPrices] = useState([]);

  useEffect(() => {
    if (!token) return;
    
    const fetchSignalData = async () => {
      setLoadingSignals(true);
      
      try {
        let historicalData = null;
        let dataSource = 'none';
        
        // Try Bybit first - request 6 months of hourly data (4320 hours)
        try {
          const bybitData = await getBybitTokenData(token.symbol, 4320);
          
          if (bybitData && bybitData.prices.length >= 50) {
            const rsiValues = calculateHistoricalRSI(bybitData.prices, 14);
            historicalData = {
              prices: bybitData.prices,
              volumes: bybitData.volumes,
              rsiValues: rsiValues,
              fundingRate: bybitData.fundingRate,
              source: 'bybit'
            };
            dataSource = 'bybit';
            setHistoricalPrices(bybitData.prices);
            console.log(`✅ Bybit: ${bybitData.prices.length} points (~${Math.floor(bybitData.prices.length/24)} days)`);
          }
        } catch (error) {
          console.log(`Bybit failed for ${token.symbol}, trying OKX...`);
        }
        
        // Try OKX if Bybit failed - request 6 months
        if (!historicalData) {
          try {
            const okxData = await getOKXTokenData(token.symbol, 4320);
            
            if (okxData && okxData.prices.length >= 50) {
              const rsiValues = calculateHistoricalRSI(okxData.prices, 14);
              historicalData = {
                prices: okxData.prices,
                volumes: okxData.volumes,
                rsiValues: rsiValues,
                fundingRate: okxData.fundingRate,
                source: 'okx'
              };
              dataSource = 'okx';
              setHistoricalPrices(okxData.prices);
              console.log(`✅ OKX: ${okxData.prices.length} points (~${Math.floor(okxData.prices.length/24)} days)`);
            }
          } catch (error) {
            console.log(`OKX failed for ${token.symbol}, trying CoinGecko...`);
          }
        }
        
        // Use CoinGecko data
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
            setHistoricalPrices(cgData.prices);
            console.log(`✅ CoinGecko: ${cgData.prices.length} points`);
          }
        }
        
        // Fallback to sparkline
        if (!historicalData && token.sparklineRaw && token.sparklineRaw.length > 0) {
          historicalData = {
            prices: token.sparklineRaw,
            volumes: [],
            rsiValues: [],
            fundingRate: null,
            source: 'sparkline'
          };
          dataSource = 'sparkline';
          setHistoricalPrices(token.sparklineRaw);
        }
        
        // Use API signal data if available (already calculated with proper point values)
        let analysis;
        if (token.signalScoreDetails && token.signals) {
          // Token already has signals from API - use those
          analysis = {
            token: token.symbol,
            price: token.price,
            rsi: token.rsi,
            score: token.signalScore,
            signalLabel: token.signalLabel,
            signalStrength: token.signalStrength,
            signals: token.signals,
            signalDetails: token.signalScoreDetails,
            signalScoreDetails: token.signalScoreDetails, // Alias for compatibility
            sma50: token.sma50,
            sma20: token.sma20,
            bollingerBands: token.bollingerBands,
            volumeRatio: token.volumeRatio,
            volMcapRatio: token.volMcapRatio,
            fundingRate: token.fundingRate,
            dataSource: token.dataSource || 'api',
            enhanced: token.enhanced
          };
        } else {
          // No API data - calculate from historical data
          analysis = analyzeToken(token, historicalData);
        }
        
        analysis.dataSource = dataSource;
        analysis.dataPoints = historicalData?.prices?.length || 0;
        
        setSignalAnalysis(analysis);
        
      } catch (error) {
        console.error('Error fetching signal data:', error);
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

  if (!token) return null;

  const rs = getRsiStyle(token.rsi);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onBack}
              className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200'
              } transition-colors`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <img src={token.image} alt={token.symbol} className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gray-800 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold truncate">{token.name}</h1>
                <span className={`text-base sm:text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{token.symbol}</span>
                <span className={`px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                  Rank #{token.rank}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 flex-wrap">
                <span className="text-lg sm:text-2xl font-bold">{formatPrice(token.price)}</span>
                <span className={`text-sm sm:text-lg font-semibold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h?.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
          </div>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 flex flex-col">
            <ChartWithTimeframe token={token} darkMode={darkMode} />
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 border`}>
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
                  {token.rsi < 30 ? 'This token may be oversold.' : token.rsi > 70 ? 'This token may be overbought.' : 'Neutral territory.'}
                </p>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 border flex-1 flex flex-col`}>
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Price Changes</h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1">
                {[
                  { l: '1 Hour', v: token.change1h },
                  { l: '24 Hours', v: token.change24h },
                  { l: '7 Days', v: token.change7d },
                  { l: '30 Days', v: token.change30d },
                ].map((x) => (
                  <div key={x.l} className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
                    <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{x.l}</p>
                    <p className={`text-lg font-bold ${(x.v || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {x.v != null ? `${x.v >= 0 ? '+' : ''}${x.v.toFixed(2)}%` : '--'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RSI Threshold Analysis */}
        <div className="mt-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">🎯 RSI Threshold Analysis</h2>
          <RSIThresholdAnalysis 
            rsi={token.rsi} 
            priceHistory={historicalPrices}
            darkMode={darkMode} 
          />
        </div>

        {/* Signal Analysis */}
        <div className="mt-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">📊 Trading Signal Analysis</h2>
          {loadingSignals ? (
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-12 text-center`}>
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Fetching enhanced signal data...</p>
            </div>
          ) : (
            <FullSignalAnalysis analysis={signalAnalysis} darkMode={darkMode} />
          )}
        </div>

        {/* Market Data */}
        <div className={`mt-4 sm:mt-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 border`}>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Market Data</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {[
              { icon: '💰', label: 'Price', value: formatPrice(token.price) },
              { icon: '📊', label: 'Market Cap', value: '$' + formatNumber(token.mcap) },
              { icon: '📈', label: '24h Volume', value: '$' + formatNumber(token.volume) },
              { icon: '🔄', label: 'Vol/MCap', value: token.volMcap?.toFixed(2) + '%' },
              { icon: '💎', label: 'Supply', value: formatNumber(token.supply) + ' ' + token.symbol },
              { icon: '🏆', label: 'Dominance', value: (token.dominance || 0).toFixed(3) + '%' },
            ].map((x) => (
              <div key={x.label} className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4`}>
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{x.icon} {x.label}</p>
                <p className="text-lg font-bold truncate">{x.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ATH/ATL */}
        {token.ath && (
          <div className={`mt-4 sm:mt-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 border`}>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">All-Time High &amp; Low</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🚀</span>
                  <h3 className="font-semibold text-green-400">All-Time High</h3>
                </div>
                <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4`}>
                  <p className="text-2xl font-bold mb-2">{formatPrice(token.ath)}</p>
                  <p className="text-sm text-gray-500 mb-1">{new Date(token.athDate).toLocaleDateString()}</p>
                  <p className={`text-sm ${token.athChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {token.athChange >= 0 ? '+' : ''}{token.athChange?.toFixed(2)}% from ATH
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
                  <p className="text-sm text-gray-500 mb-1">{new Date(token.atlDate).toLocaleDateString()}</p>
                  <p className={`text-sm ${token.atlChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.atlChange >= 0 ? '+' : ''}{token.atlChange?.toFixed(2)}% from ATL
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CoinGecko Link */}
        <div className="mt-4 sm:mt-6">
          <a
            href={`https://coingecko.com/en/coins/${token.id}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-3 sm:py-4 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-center text-green-400 font-medium transition-colors text-base sm:text-lg"
          >
            View on CoinGecko ↗
          </a>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};
