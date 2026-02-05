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

// RSI Signal Chart - Shows daily price chart with zones and RSI labels
const RSISignalChart = ({ priceHistory, threshold, mode, darkMode, timeframe = '6m' }) => {
  const width = 900;
  const height = 380;
  const padding = { top: 30, right: 70, bottom: 60, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Convert to daily data with RSI
  const allDailyData = useMemo(() => {
    if (!priceHistory || priceHistory.length < 15) return [];
    
    const isAlreadyDaily = priceHistory.length <= 200;
    let result = [];
    
    if (isAlreadyDaily) {
      for (let i = 0; i < priceHistory.length; i++) {
        const pricesUpToNow = priceHistory.slice(0, i + 1);
        const rsi = calculateRSI(pricesUpToNow, 14);
        
        const daysAgo = priceHistory.length - i - 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        result.push({
          day: i,
          price: priceHistory[i],
          rsi: rsi,
          date: date,
          daysAgo: daysAgo
        });
      }
    } else {
      const totalDays = Math.min(180, Math.floor(priceHistory.length / 24));
      const pointsPerDay = Math.floor(priceHistory.length / totalDays);
      
      for (let day = 0; day < totalDays; day++) {
        const startIdx = day * pointsPerDay;
        const endIdx = Math.min(startIdx + pointsPerDay, priceHistory.length);
        
        const dayPrices = priceHistory.slice(startIdx, endIdx);
        
        if (dayPrices.length > 0) {
          const closePrice = dayPrices[dayPrices.length - 1];
          const pricesUpToNow = priceHistory.slice(0, endIdx);
          const rsi = calculateRSI(pricesUpToNow, 14);
          
          const daysAgo = totalDays - day - 1;
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          
          result.push({
            day: day,
            price: closePrice,
            rsi: rsi,
            date: date,
            daysAgo: daysAgo
          });
        }
      }
    }
    
    return result;
  }, [priceHistory]);

  // Filter data based on timeframe
  const dailyData = useMemo(() => {
    const daysToShow = timeframe === '1m' ? 30 : timeframe === '3m' ? 90 : allDailyData.length;
    return allDailyData.slice(-daysToShow);
  }, [allDailyData, timeframe]);

  // Find days where RSI is in the zone
  const signalDays = useMemo(() => {
    return dailyData.filter(d => {
      if (d.rsi === null) return false;
      return mode === 'oversold' ? d.rsi < threshold : d.rsi > threshold;
    });
  }, [dailyData, threshold, mode]);

  if (dailyData.length < 5) {
    return (
      <div className={`w-full h-64 rounded-xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Insufficient historical data for chart
        </p>
      </div>
    );
  }

  const prices = dailyData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const pricePadding = priceRange * 0.15; // More padding for labels

  const getX = (index) => padding.left + (index / (dailyData.length - 1)) * chartWidth;
  const getY = (price) => padding.top + chartHeight - ((price - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;

  // Generate smooth price line path
  const linePath = dailyData.map((d, i) => {
    const x = getX(i);
    const y = getY(d.price);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Generate area path
  const areaPath = linePath + 
    ` L ${getX(dailyData.length - 1)} ${padding.top + chartHeight}` +
    ` L ${padding.left} ${padding.top + chartHeight} Z`;

  const lineColor = mode === 'oversold' ? '#f97316' : '#22c55e';
  const signalColor = mode === 'oversold' ? '#f97316' : '#22c55e';

  // Generate x-axis labels
  const labelCount = timeframe === '1m' ? 6 : timeframe === '3m' ? 8 : 10;
  const labelStep = Math.max(1, Math.floor(dailyData.length / labelCount));
  const xLabels = dailyData.filter((_, i) => i % labelStep === 0 || i === dailyData.length - 1);

  // Find contiguous signal zones for shading
  const signalZones = useMemo(() => {
    const zones = [];
    let currentZone = null;
    
    dailyData.forEach((d, i) => {
      const inZone = d.rsi !== null && (mode === 'oversold' ? d.rsi < threshold : d.rsi > threshold);
      
      if (inZone) {
        if (!currentZone) {
          currentZone = { startIdx: i, endIdx: i };
        } else {
          currentZone.endIdx = i;
        }
      } else {
        if (currentZone) {
          zones.push(currentZone);
          currentZone = null;
        }
      }
    });
    
    if (currentZone) {
      zones.push(currentZone);
    }
    
    return zones;
  }, [dailyData, threshold, mode]);

  // Determine if we should show individual labels (when zoomed in and not too many signals)
  const showIndividualLabels = timeframe === '1m' || (timeframe === '3m' && signalDays.length <= 15);
  
  // For labels, stagger heights to avoid overlap
  const getLabelOffset = (idx, total) => {
    if (total <= 5) return 0;
    // Alternate between 3 heights
    const pattern = idx % 3;
    return pattern * 22;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px]">
        <defs>
          <linearGradient id="rsiChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="signalZoneGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={signalColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={signalColor} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={width - padding.right}
            y2={padding.top + chartHeight * ratio}
            stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            strokeDasharray="4,4"
          />
        ))}

        {/* Signal zone shading */}
        {signalZones.map((zone, idx) => {
          const x1 = getX(zone.startIdx);
          const x2 = getX(zone.endIdx);
          return (
            <rect
              key={idx}
              x={x1 - 2}
              y={padding.top}
              width={Math.max(x2 - x1 + 4, 8)}
              height={chartHeight}
              fill="url(#signalZoneGradient)"
              rx="2"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#rsiChartGradient)" />

        {/* Price line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Signal day markers and labels */}
        {signalDays.map((d, idx) => {
          const dataIdx = dailyData.indexOf(d);
          const x = getX(dataIdx);
          const y = getY(d.price);
          const labelOffset = getLabelOffset(idx, signalDays.length);
          
          return (
            <g key={idx}>
              {/* Dot on line */}
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={signalColor}
                stroke={darkMode ? '#1a1a2e' : '#fff'}
                strokeWidth="2"
              />
              
              {/* Show RSI labels when zoomed in */}
              {showIndividualLabels && d.rsi !== null && (
                <>
                  {/* Connecting line */}
                  <line
                    x1={x}
                    y1={y + 7}
                    x2={x}
                    y2={y + 18 + labelOffset}
                    stroke={signalColor}
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                  {/* Arrow head */}
                  <polygon
                    points={`${x},${y + 7} ${x - 4},${y + 13} ${x + 4},${y + 13}`}
                    fill={signalColor}
                  />
                  {/* RSI label background */}
                  <rect
                    x={x - 24}
                    y={y + 20 + labelOffset}
                    width="48"
                    height="18"
                    rx="4"
                    fill={d.rsi < 20 || d.rsi > 80 ? signalColor : '#facc15'}
                  />
                  {/* RSI value */}
                  <text
                    x={x}
                    y={y + 33 + labelOffset}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill={d.rsi < 20 || d.rsi > 80 ? '#fff' : '#000'}
                  >
                    {d.rsi.toFixed(1)}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((d, i) => {
          const originalIndex = dailyData.indexOf(d);
          const x = getX(originalIndex);
          const label = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <text
              key={i}
              x={x}
              y={height - 15}
              textAnchor="middle"
              className="text-[10px]"
              fill={darkMode ? '#6b7280' : '#9ca3af'}
            >
              {label}
            </text>
          );
        })}

        {/* Y-axis price labels */}
        {[0, 0.5, 1].map((ratio) => {
          const price = minPrice - pricePadding + (priceRange + pricePadding * 2) * (1 - ratio);
          return (
            <text
              key={ratio}
              x={width - padding.right + 8}
              y={padding.top + chartHeight * ratio + 4}
              textAnchor="start"
              className="text-[10px]"
              fill={darkMode ? '#6b7280' : '#9ca3af'}
            >
              {formatPrice(price)}
            </text>
          );
        })}

        {/* Current price indicator */}
        <circle
          cx={getX(dailyData.length - 1)}
          cy={getY(dailyData[dailyData.length - 1].price)}
          r="5"
          fill={lineColor}
          stroke={darkMode ? '#1a1a2e' : '#fff'}
          strokeWidth="2"
        />

        {/* Legend */}
        <g transform={`translate(${padding.left + 10}, ${padding.top + 10})`}>
          <rect x="0" y="0" width="12" height="12" fill={signalColor} opacity="0.4" rx="2" />
          <text x="18" y="10" className="text-[10px]" fill={darkMode ? '#9ca3af' : '#6b7280'}>
            RSI {mode === 'oversold' ? '<' : '>'} {threshold}
          </text>
        </g>
      </svg>
    </div>
  );
};

// RSI Indicator Chart
const RSIIndicatorChart = ({ priceHistory, threshold, mode, darkMode, timeframe = '6m' }) => {
  const width = 900;
  const height = 80;
  const padding = { top: 10, right: 70, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate daily RSI values
  const allDailyRsi = useMemo(() => {
    if (!priceHistory || priceHistory.length < 15) return [];
    
    const isAlreadyDaily = priceHistory.length <= 200;
    const result = [];
    
    if (isAlreadyDaily) {
      // Data is already daily
      for (let i = 0; i < priceHistory.length; i++) {
        const pricesUpToNow = priceHistory.slice(0, i + 1);
        result.push(calculateRSI(pricesUpToNow, 14));
      }
    } else {
      // Resample hourly to daily
      const totalDays = Math.min(180, Math.floor(priceHistory.length / 24));
      const pointsPerDay = Math.floor(priceHistory.length / totalDays);
      
      for (let day = 0; day < totalDays; day++) {
        const endIdx = Math.min((day + 1) * pointsPerDay, priceHistory.length);
        const pricesUpToNow = priceHistory.slice(0, endIdx);
        result.push(calculateRSI(pricesUpToNow, 14));
      }
    }
    
    return result;
  }, [priceHistory]);

  // Filter based on timeframe
  const dailyRsi = useMemo(() => {
    const daysToShow = timeframe === '1m' ? 30 : timeframe === '3m' ? 90 : allDailyRsi.length;
    return allDailyRsi.slice(-daysToShow);
  }, [allDailyRsi, timeframe]);

  if (dailyRsi.length < 5) return null;

  const getX = (index) => padding.left + (index / (dailyRsi.length - 1)) * chartWidth;
  const getY = (rsi) => {
    if (rsi === null) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - (rsi / 100) * chartHeight;
  };

  const linePath = dailyRsi.map((rsi, i) => {
    const x = getX(i);
    const y = getY(rsi || 50);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const thresholdY = getY(threshold);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px]">
        {/* Threshold line */}
        <line
          x1={padding.left}
          y1={thresholdY}
          x2={width - padding.right}
          y2={thresholdY}
          stroke={mode === 'oversold' ? '#f97316' : '#22c55e'}
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.7"
        />

        {/* RSI line */}
        <path
          d={linePath}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y-axis labels */}
        <text x={width - padding.right + 8} y={padding.top + 4} className="text-[9px]" fill={darkMode ? '#6b7280' : '#9ca3af'}>100</text>
        <text x={width - padding.right + 8} y={padding.top + chartHeight / 2 + 3} className="text-[9px]" fill={darkMode ? '#6b7280' : '#9ca3af'}>50</text>
        <text x={width - padding.right + 8} y={padding.top + chartHeight + 4} className="text-[9px]" fill={darkMode ? '#6b7280' : '#9ca3af'}>0</text>

        {/* Threshold label */}
        <text x={padding.left + 5} y={thresholdY - 4} className="text-[9px] font-medium" fill={mode === 'oversold' ? '#f97316' : '#22c55e'}>
          {mode === 'oversold' ? 'Oversold' : 'Overbought'} {threshold}
        </text>
      </svg>
    </div>
  );
};

// RSI Threshold Analysis Component
const RSIThresholdAnalysis = ({ rsi, priceHistory, darkMode }) => {
  const [mode, setMode] = useState('oversold');
  const [threshold, setThreshold] = useState(30);
  const [chartTimeframe, setChartTimeframe] = useState('6m');

  // Calculate daily RSI values
  const dailyRsiData = useMemo(() => {
    if (!priceHistory || priceHistory.length < 15) return [];
    
    const isAlreadyDaily = priceHistory.length <= 200;
    const result = [];
    
    if (isAlreadyDaily) {
      for (let i = 0; i < priceHistory.length; i++) {
        const pricesUpToNow = priceHistory.slice(0, i + 1);
        result.push(calculateRSI(pricesUpToNow, 14));
      }
    } else {
      const totalDays = Math.min(180, Math.floor(priceHistory.length / 24));
      const pointsPerDay = Math.floor(priceHistory.length / totalDays);
      
      for (let day = 0; day < totalDays; day++) {
        const endIdx = Math.min((day + 1) * pointsPerDay, priceHistory.length);
        const pricesUpToNow = priceHistory.slice(0, endIdx);
        result.push(calculateRSI(pricesUpToNow, 14));
      }
    }
    
    return result;
  }, [priceHistory]);

  // Filter based on chart timeframe for stats
  const filteredRsiData = useMemo(() => {
    const daysToShow = chartTimeframe === '1m' ? 30 : chartTimeframe === '3m' ? 90 : dailyRsiData.length;
    return dailyRsiData.slice(-daysToShow);
  }, [dailyRsiData, chartTimeframe]);

  // Count days where RSI is in the zone (monotonic with threshold)
  const daysInZone = useMemo(() => {
    return filteredRsiData.filter(rsi => {
      if (rsi === null) return false;
      return mode === 'oversold' ? rsi < threshold : rsi > threshold;
    }).length;
  }, [filteredRsiData, threshold, mode]);

  const totalDays = filteredRsiData.length;
  const percentInZone = totalDays > 0 ? ((daysInZone / totalDays) * 100).toFixed(1) : 0;

  const getMessage = () => {
    if (rsi === null) return 'RSI data unavailable.';
    
    if (mode === 'oversold') {
      if (rsi < 20) return 'Extremely oversold. High probability of bounce.';
      if (rsi < threshold) return 'Oversold territory. Potential buying opportunity.';
      if (rsi < 50) return 'Approaching fair value. Less predictive power.';
      return 'Above fair value. Not in oversold territory.';
    } else {
      if (rsi > 80) return 'Extremely overbought. High probability of pullback.';
      if (rsi > threshold) return 'Overbought territory. Consider taking profits.';
      if (rsi > 50) return 'Approaching fair value. Less predictive power.';
      return 'Below fair value. Not in overbought territory.';
    }
  };

  const hasData = priceHistory && priceHistory.length > 15;
  const dataMonths = Math.min(6, Math.floor(totalDays / 30));

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

      {/* Threshold Slider */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          RSI Threshold
        </span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
          mode === 'oversold' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
        }`}>
          <span className="text-lg font-bold tabular-nums">{threshold}</span>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="h-3 rounded-full overflow-hidden bg-gray-700">
          <div className={`h-full ${
            mode === 'oversold'
              ? 'bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-gray-500'
              : 'bg-gradient-to-r from-gray-500 via-yellow-500 via-emerald-500 to-green-500'
          }`} />
        </div>
        <input
          type="range"
          min={mode === 'oversold' ? 10 : 50}
          max={mode === 'oversold' ? 50 : 90}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-gray-300 pointer-events-none"
          style={{ left: `calc(${((threshold - (mode === 'oversold' ? 10 : 50)) / 40) * 100}% - 10px)` }}
        />
      </div>

      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        {getMessage()}
      </p>

      {/* Signal Chart */}
      {hasData ? (
        <div className="space-y-3">
          {/* Timeframe selector and stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {mode === 'oversold' ? '🔴' : '🟢'} {daysInZone} day{daysInZone !== 1 ? 's' : ''} in zone ({percentInZone}%)
              </span>
            </div>
            
            {/* Timeframe buttons */}
            <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
              {[
                { id: '1m', label: '1M' },
                { id: '3m', label: '3M' },
                { id: '6m', label: '6M' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setChartTimeframe(tf.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    chartTimeframe === tf.id
                      ? mode === 'oversold' 
                        ? 'bg-orange-500 text-white shadow'
                        : 'bg-green-500 text-white shadow'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hint for zooming */}
          {chartTimeframe === '6m' && daysInZone > 10 && (
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              💡 Zoom in to 1M or 3M to see individual RSI values
            </p>
          )}
          
          <RSISignalChart
            priceHistory={priceHistory}
            threshold={threshold}
            mode={mode}
            darkMode={darkMode}
            timeframe={chartTimeframe}
          />
          
          <RSIIndicatorChart
            priceHistory={priceHistory}
            threshold={threshold}
            mode={mode}
            darkMode={darkMode}
            timeframe={chartTimeframe}
          />
        </div>
      ) : (
        <div className={`text-center py-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            Historical price data not available
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Signal chart requires exchange data (Bybit/OKX/CoinGecko)
          </p>
        </div>
      )}
    </div>
  );
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
