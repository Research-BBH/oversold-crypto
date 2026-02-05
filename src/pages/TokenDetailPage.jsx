// ==================================================
// FILE: src/pages/TokenDetailPage.jsx
// ==================================================

import { formatPrice, formatNumber, getRsiStyle } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { RSIMeter, FullPageChart } from '../components/Charts';
import { FullSignalAnalysis } from '../components/SignalAnalysis';
import { RSIThresholdAnalysis } from '../components/RSIThresholdChart';
import { analyzeToken } from '../utils/signals';
import { getBybitTokenData, calculateHistoricalRSI as calculateBybitRSI } from '../utils/bybit';
import { getOKXTokenData, calculateHistoricalRSI as calculateOKXRSI } from '../utils/okx';
import { getComprehensiveTokenData } from '../utils/coingecko-enhanced';
import { useState, useEffect, useMemo } from 'react';

// Calculate RSI from price array
const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Chart Timeframe Component
const ChartWithTimeframe = ({ token, darkMode }) => {
  const [timeframe, setTimeframe] = useState('7d');
  
  const chartData = useMemo(() => {
    if (!token.sparkline || token.sparkline.length === 0) return null;
    
    if (timeframe === '24h') {
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
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
            changeValue >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {changeValue >= 0 ? '+' : ''}{changeValue?.toFixed(2)}%
          </span>
        </div>
      </div>
      <FullPageChart data={chartData} basePrice={token.price} change7d={changeValue} />
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
            const rsiValues = calculateBybitRSI(bybitData.prices, 14);
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
              const rsiValues = calculateOKXRSI(okxData.prices, 14);
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
        
        const analysis = analyzeToken(token, historicalData);
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200'
              } transition-colors`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <img src={token.image} alt={token.symbol} className="w-16 h-16 rounded-2xl bg-gray-800" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{token.name}</h1>
                <span className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{token.symbol}</span>
                <span className={`px-2 py-1 rounded text-sm ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                  Rank #{token.rank}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-bold">{formatPrice(token.price)}</span>
                <span className={`text-lg font-semibold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h?.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
          </div>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartWithTimeframe token={token} darkMode={darkMode} />
          </div>

          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
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

            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
              <h2 className="text-lg font-semibold mb-4">Price Changes</h2>
              <div className="grid grid-cols-2 gap-3">
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
          <h2 className="text-2xl font-bold mb-4">🎯 RSI Threshold Analysis</h2>
          <RSIThresholdAnalysis 
            rsi={token.rsi} 
            priceHistory={historicalPrices}
            darkMode={darkMode} 
          />
        </div>

        {/* Signal Analysis */}
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
        <div className={`mt-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
          <h2 className="text-lg font-semibold mb-4">Market Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className={`mt-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
            <h2 className="text-lg font-semibold mb-4">All-Time High &amp; Low</h2>
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
