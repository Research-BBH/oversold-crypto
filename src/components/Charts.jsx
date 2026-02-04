// ==================================================
// FILE: src/components/Charts.jsx
// ==================================================

import { useState } from 'react';

// Time range configuration
export const TIME_RANGES = [
  { id: '24h', label: '24H', days: 1 },
  { id: '7d', label: '7D', days: 7 },
  { id: '1m', label: '1M', days: 30 },
  { id: '3m', label: '3M', days: 90 },
  { id: '1y', label: '1Y', days: 365 },
  { id: 'max', label: 'Max', days: 'max' },
];

// Chart type constants
export const CHART_TYPES = {
  LINE: 'line',
  CANDLESTICK: 'candlestick',
};

// Helper function to format price axis
const formatAxisPrice = (p) => {
  if (p >= 1000) return '$' + (p / 1000).toFixed(1) + 'k';
  if (p >= 1) return '$' + p.toFixed(2);
  if (p >= 0.01) return '$' + p.toFixed(4);
  return '$' + p.toFixed(6);
};

// Sparkline component for table rows
export const Spark = ({ data, color, h = 24 }) => {
  if (!data?.length || data.length < 2) {
    return <div className="w-20 h-6 bg-gray-800/30 rounded animate-pulse" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 80},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg width={80} height={h}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
};

// RSI Meter component
export const RSIMeter = ({ value }) => {
  if (value === null) return <div className="h-3 bg-gray-800 rounded-full" />;

  return (
    <div className="w-full">
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="w-[20%] bg-red-500/40" />
          <div className="w-[10%] bg-orange-500/40" />
          <div className="w-[30%] bg-gray-600/40" />
          <div className="w-[10%] bg-emerald-500/40" />
          <div className="w-[30%] bg-green-500/40" />
        </div>
        <div
          className="absolute top-0 h-full w-1.5 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-500"
          style={{ left: `calc(${Math.min(98, Math.max(1, value))}% - 3px)` }}
        />
      </div>
      <div className="flex justify-between text-[9px] mt-1 text-gray-600">
        <span>0</span>
        <span className="text-red-400/70">20</span>
        <span className="text-orange-400/70">30</span>
        <span>50</span>
        <span className="text-emerald-400/70">70</span>
        <span>100</span>
      </div>
    </div>
  );
};

// Time Range Selector Component
export const TimeRangeSelector = ({ selected, onChange, darkMode, disabled }) => {
  return (
    <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
      {TIME_RANGES.map((range) => (
        <button
          key={range.id}
          onClick={() => onChange(range.id)}
          disabled={disabled}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            selected === range.id
              ? 'bg-gray-700 text-white'
              : darkMode
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

// Chart Type Toggle Component
export const ChartTypeToggle = ({ selected, onChange, darkMode, disabled }) => {
  return (
    <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
      {/* Line Chart Button */}
      <button
        onClick={() => onChange(CHART_TYPES.LINE)}
        disabled={disabled}
        className={`p-2 rounded-md transition-all ${
          selected === CHART_TYPES.LINE
            ? 'bg-gray-700 text-white'
            : darkMode
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title="Line Chart"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </button>
      
      {/* Candlestick Chart Button */}
      <button
        onClick={() => onChange(CHART_TYPES.CANDLESTICK)}
        disabled={disabled}
        className={`p-2 rounded-md transition-all ${
          selected === CHART_TYPES.CANDLESTICK
            ? 'bg-gray-700 text-white'
            : darkMode
              ? 'text-gray-400 hover:text-white hover:bg-white/10'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title="Candlestick Chart"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="4" x2="9" y2="8" />
          <line x1="9" y1="16" x2="9" y2="20" />
          <rect x="6" y="8" width="6" height="8" fill="currentColor" rx="1" />
          <line x1="15" y1="2" x2="15" y2="6" />
          <line x1="15" y1="14" x2="15" y2="22" />
          <rect x="12" y="6" width="6" height="8" rx="1" />
        </svg>
      </button>
    </div>
  );
};

// Generate time labels based on range
const getTimeLabels = (timeRange) => {
  switch (timeRange) {
    case '24h':
      return ['24h ago', '18h', '12h', '6h', 'Now'];
    case '7d':
      return ['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
    case '1m':
      return ['30d', '25d', '20d', '15d', '10d', '5d', 'Now'];
    case '3m':
      return ['3m', '2.5m', '2m', '1.5m', '1m', '15d', 'Now'];
    case '1y':
      return ['1y', '10m', '8m', '6m', '4m', '2m', 'Now'];
    case 'max':
      return ['Start', '', '', '', '', '', 'Now'];
    default:
      return ['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
  }
};

// Line Chart Component
export const LineChart = ({ prices, darkMode, timeRange = '7d' }) => {
  if (!prices?.length || prices.length < 2) {
    return (
      <div className={`w-full h-80 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-800/30 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
        No chart data available
      </div>
    );
  }

  const W = 800;
  const H = 400;
  const PAD = { top: 30, right: 80, bottom: 50, left: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const priceRange = max - min || min * 0.01;
  const paddedMin = min - priceRange * 0.1;
  const paddedMax = max + priceRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const priceLevels = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => paddedMax - paddedRange * t);
  const timeLabels = getTimeLabels(timeRange);

  const pts = prices.map((price, i) => {
    const x = PAD.left + (i / (prices.length - 1)) * chartW;
    const y = PAD.top + chartH - ((price - paddedMin) / paddedRange) * chartH;
    return `${x},${y}`;
  });

  const areaPath =
    `M${PAD.left},${PAD.top + chartH} ` +
    pts.map((p) => `L${p}`).join(' ') +
    ` L${PAD.left + chartW},${PAD.top + chartH} Z`;

  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? '#22c55e' : '#ef4444';
  const currentPrice = prices[prices.length - 1];
  const currentY = PAD.top + chartH - ((currentPrice - paddedMin) / paddedRange) * chartH;
  const changePercent = ((prices[prices.length - 1] - prices[0]) / prices[0] * 100);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="lineChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines and price labels */}
        {priceLevels.map((price, i) => {
          const y = PAD.top + (i / 5) * chartH;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke={darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                strokeDasharray="4,4"
              />
              <text
                x={W - 10}
                y={y + 4}
                textAnchor="end"
                fill={darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}
                fontSize="12"
              >
                {formatAxisPrice(price)}
              </text>
            </g>
          );
        })}
        
        {/* Vertical grid lines and time labels */}
        {timeLabels.map((label, i) => {
          const x = PAD.left + (i / (timeLabels.length - 1)) * chartW;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={PAD.top}
                x2={x}
                y2={PAD.top + chartH}
                stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              />
              <text 
                x={x} 
                y={H - 15} 
                textAnchor="middle" 
                fill={darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} 
                fontSize="12"
              >
                {label}
              </text>
            </g>
          );
        })}
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#lineChartGrad)" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.join(' ')}
        />
        
        {/* Current price line */}
        <line
          x1={PAD.left}
          y1={currentY}
          x2={PAD.left + chartW}
          y2={currentY}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="6,3"
          opacity="0.6"
        />
      </svg>
      
      {/* Chart footer */}
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex gap-6 text-sm">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
            High: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAxisPrice(max)}</span>
          </span>
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
            Low: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAxisPrice(min)}</span>
          </span>
        </div>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Change: <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  );
};

// Candlestick Chart Component
export const CandlestickChart = ({ ohlcData, darkMode, timeRange = '7d' }) => {
  if (!ohlcData?.length || ohlcData.length < 2) {
    return (
      <div className={`w-full h-80 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-800/30 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
        No OHLC data available
      </div>
    );
  }

  const W = 800;
  const H = 400;
  const PAD = { top: 30, right: 80, bottom: 50, left: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // OHLC format: [timestamp, open, high, low, close]
  const allHighs = ohlcData.map(c => c[2]);
  const allLows = ohlcData.map(c => c[3]);
  const min = Math.min(...allLows);
  const max = Math.max(...allHighs);
  const priceRange = max - min || min * 0.01;
  const paddedMin = min - priceRange * 0.1;
  const paddedMax = max + priceRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const priceLevels = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => paddedMax - paddedRange * t);
  const timeLabels = getTimeLabels(timeRange);

  // Calculate candle width
  const candleSpacing = chartW / ohlcData.length;
  const candleWidth = Math.max(2, Math.min(12, candleSpacing * 0.7));

  const firstClose = ohlcData[0][4];
  const lastClose = ohlcData[ohlcData.length - 1][4];
  const isUp = lastClose >= firstClose;
  const changePercent = ((lastClose - firstClose) / firstClose * 100);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Horizontal grid lines and price labels */}
        {priceLevels.map((price, i) => {
          const y = PAD.top + (i / 5) * chartH;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke={darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                strokeDasharray="4,4"
              />
              <text
                x={W - 10}
                y={y + 4}
                textAnchor="end"
                fill={darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}
                fontSize="12"
              >
                {formatAxisPrice(price)}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines and time labels */}
        {timeLabels.map((label, i) => {
          const x = PAD.left + (i / (timeLabels.length - 1)) * chartW;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={PAD.top}
                x2={x}
                y2={PAD.top + chartH}
                stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              />
              <text 
                x={x} 
                y={H - 15} 
                textAnchor="middle" 
                fill={darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} 
                fontSize="12"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {ohlcData.map((candle, i) => {
          const [timestamp, open, high, low, close] = candle;
          const x = PAD.left + ((i + 0.5) / ohlcData.length) * chartW;

          const highY = PAD.top + chartH - ((high - paddedMin) / paddedRange) * chartH;
          const lowY = PAD.top + chartH - ((low - paddedMin) / paddedRange) * chartH;
          const openY = PAD.top + chartH - ((open - paddedMin) / paddedRange) * chartH;
          const closeY = PAD.top + chartH - ((close - paddedMin) / paddedRange) * chartH;

          const isBullish = close >= open;
          const candleColor = isBullish ? '#22c55e' : '#ef4444';
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(1, Math.abs(closeY - openY));

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={candleColor}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={candleColor}
                stroke={candleColor}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Current price line */}
        <line
          x1={PAD.left}
          y1={PAD.top + chartH - ((lastClose - paddedMin) / paddedRange) * chartH}
          x2={PAD.left + chartW}
          y2={PAD.top + chartH - ((lastClose - paddedMin) / paddedRange) * chartH}
          stroke={isUp ? '#22c55e' : '#ef4444'}
          strokeWidth="1"
          strokeDasharray="6,3"
          opacity="0.6"
        />
      </svg>

      {/* Chart footer */}
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex gap-6 text-sm">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
            High: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAxisPrice(max)}</span>
          </span>
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
            Low: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAxisPrice(min)}</span>
          </span>
        </div>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Change: <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  );
};

// Main Interactive Price Chart Component
export const PriceChart = ({
  prices,
  ohlcData,
  timeRange,
  chartType,
  darkMode,
  loading
}) => {
  if (loading) {
    return (
      <div className={`w-full h-80 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading chart...</span>
        </div>
      </div>
    );
  }

  if (chartType === CHART_TYPES.CANDLESTICK && ohlcData?.length > 0) {
    return <CandlestickChart ohlcData={ohlcData} darkMode={darkMode} timeRange={timeRange} />;
  }

  return <LineChart prices={prices} darkMode={darkMode} timeRange={timeRange} />;
};

// Legacy FullPageChart for backward compatibility
export const FullPageChart = ({ data, basePrice, change7d }) => {
  if (!data?.length || data.length < 2) {
    return (
      <div className="w-full h-80 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
        No chart data
      </div>
    );
  }

  // Convert normalized data back to prices if needed
  const startPrice = basePrice / (1 + (change7d || 0) / 100);
  const prices = data.map(v => startPrice * (v / 100));

  return <LineChart prices={prices} darkMode={true} timeRange="7d" />;
};

// Legacy DetailChart for backward compatibility
export const DetailChart = ({ data, basePrice, change7d }) => {
  return <FullPageChart data={data} basePrice={basePrice} change7d={change7d} />;
};
