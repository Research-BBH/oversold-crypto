// ==================================================
// FILE: src/pages/TokenDetailPage.jsx
// ==================================================

import { formatPrice, formatNumber, getRsiStyle } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { RSIMeter, FullPageChart } from '../components/Charts';
import { FullSignalAnalysis } from '../components/SignalAnalysis';
import { analyzeToken } from '../utils/signals';
import { getBybitTokenData, calculateHistoricalRSI as calculateBybitRSI } from '../utils/bybit';
import { getOKXTokenData, calculateHistoricalRSI as calculateOKXRSI } from '../utils/okx';
import { getComprehensiveTokenData } from '../utils/coingecko-enhanced';
import { useState, useEffect, useMemo } from 'react';

// RSI Threshold Analysis Component
const RSIThresholdAnalysis = ({ rsi, darkMode }) => {
  const [mode, setMode] = useState('oversold'); // 'oversold' or 'overbought'
  const [threshold, setThreshold] = useState(30);
  
  // Get message based on RSI vs threshold
  const getMessage = () => {
    if (rsi === null) return { text: 'RSI data unavailable.', color: 'gray' };
    
    if (mode === 'oversold') {
      if (rsi < 20) {
        return { text: 'Extremely oversold. High probability of bounce.', color: 'red' };
      } else if (rsi < threshold) {
        return { text: 'Oversold territory. Potential buying opportunity.', color: 'orange' };
      } else if (rsi < 50) {
        return { text: 'Approaching fair value. Less predictive power.', color: 'yellow' };
      } else {
        return { text: 'Above fair value. Not in oversold territory.', color: 'gray' };
      }
    } else {
      if (rsi > 80) {
        return { text: 'Extremely overbought. High probability of pullback.', color: 'green' };
      } else if (rsi > threshold) {
        return { text: 'Overbought territory. Consider taking profits.', color: 'emerald' };
      } else if (rsi > 50) {
        return { text: 'Approaching fair value. Less predictive power.', color: 'yellow' };
      } else {
        return { text: 'Below fair value. Not in overbought territory.', color: 'gray' };
      }
    }
  };

  const message = getMessage();
  
  // Check if RSI meets threshold condition
  const meetsCondition = rsi !== null && (
    mode === 'oversold' ? rsi < threshold : rsi > threshold
  );

  return (
    <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className={`inline-flex rounded-xl p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
          <button
            onClick={() => { setMode('oversold'); setThreshold(30); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'oversold'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Oversold
          </button>
          <button
            onClick={() => { setMode('overbought'); setThreshold(70); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'overbought'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overbought
          </button>
        </div>
      </div>

      {/* Threshold Label */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          RSI Threshold
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
          mode === 'oversold' 
            ? 'bg-orange-500/20 text-orange-400' 
            : 'bg-green-500/20 text-green-400'
        }`}>
          <span className="text-lg font-bold tabular-nums">{threshold}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative mb-4">
        {/* Track background with gradient */}
        <div className="h-3 rounded-full overflow-hidden bg-gray-700">
          <div 
            className={`h-full transition-all duration-300 ${
              mode === 'oversold'
                ? 'bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-gray-500'
                : 'bg-gradient-to-r from-gray-500 via-yellow-500 via-emerald-500 to-green-500'
            }`}
          />
        </div>
        
        {/* Slider input */}
        <input
          type="range"
          min={mode === 'oversold' ? 10 : 50}
          max={mode === 'oversold' ? 50 : 90}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />
        
        {/* Thumb indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-gray-300 pointer-events-none transition-all duration-150"
          style={{ 
            left: `calc(${((threshold - (mode === 'oversold' ? 10 : 50)) / 40) * 100}% - 10px)` 
          }}
        />
      </div>

      {/* Message */}
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
        {message.text}
      </p>

      {/* Current RSI vs Threshold */}
      {rsi !== null && (
        <div className={`flex items-center justify-between p-4 rounded-xl ${
          meetsCondition
            ? mode === 'oversold' 
              ? 'bg-orange-500/10 border border-orange-500/30' 
              : 'bg-green-500/10 border border-green-500/30'
            : darkMode ? 'bg-white/5' : 'bg-gray-100'
        }`}>
          <div>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Current RSI</p>
            <p className={`text-2xl font-bold ${
              rsi < 30 ? 'text-orange-400' : rsi > 70 ? 'text-green-400' : darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {rsi.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mb-1`}>
              {mode === 'oversold' ? 'Below' : 'Above'} Threshold?
            </p>
            <p className={`text-lg font-bold ${meetsCondition ? 'text-green-400' : 'text-gray-500'}`}>
              {meetsCondition ? '✓ Yes' : '✗ No'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Chart Timeframe Component
const ChartWithTimeframe = ({ token, darkMode }) => {
  const [timeframe, setTimeframe] = useState('7d');
  
  // For 24h, we'll use the last portion of sparkline data
  const chartData = useMemo(() => {
    if (!token.sparkline || token.sparkline.length === 0) return null;
    
    if (timeframe === '24h') {
      // Sparkline is 7 days, so 24h is roughly 1/7 of the data
      const dataPoints = Math.floor(token.sparkline.length / 7);
      return token.sparkline.slice(-dataPoints);
    }
    return token.sparkline;
  }, [token.sparkline, timeframe]);
  
  const changeValue = timeframe === '24h' ? token.change24h : token.change7d;

  return (
    <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Price Chart</h2>
        <div className="flex items-center gap-3">
          {/* Timeframe Toggle */}
          <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
            {['24h', '7d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-orange-500 text-white shadow'
                    : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
          
          {/* Change Badge */}
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
            changeValue >= 0
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {changeValue >= 0 ? '+' : ''}{changeValue?.toFixed(2)}%
          </span>
        </div>
      </div>
      <FullPageChart 
        data={chartData} 
        basePrice={token.price} 
        change7d={changeValue}
      />
    </div>
  );
};

export const TokenDetailPage = ({ token, onBack, darkMode, setDarkMode }) => {
  // All hooks must be called before any early returns (React rules of hooks)
  const [signalAnalysis, setSignalAnalysis] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(true);

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

        {/* Main Grid - Chart and RSI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart with Timeframe Toggle */}
          <div className="lg:col-span-2">
            <ChartWithTimeframe token={token} darkMode={darkMode} />
          </div>

          {/* RSI Section */}
          <div className="space-y-6">
            {/* Basic RSI Display */}
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

            {/* Price Changes */}
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

        {/* RSI Threshold Analysis - Full Width */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">🎯 RSI Threshold Analysis</h2>
          <RSIThresholdAnalysis rsi={token.rsi} darkMode={darkMode} />
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

        {/* Market Data */}
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

        {/* ATH/ATL */}
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
