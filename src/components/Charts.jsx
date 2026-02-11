// ==================================================
// FILE: src/components/Charts.jsx
// ==================================================

import { formatPrice } from '../utils';

export const Spark = ({ data, color, h = 24 }) => {
  if (!data?.length || data.length < 2) {
    return <div className="w-24 h-6 bg-gray-800/30 rounded animate-pulse" />;
  }

  const w = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
};

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

// Candlestick Chart Component - CoinGecko style
export const CandlestickChart = ({ ohlcData, timeLabels, darkMode = true }) => {
  if (!ohlcData?.length || ohlcData.length < 2) {
    return (
      <div className="w-full h-80 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
        No OHLC data available
      </div>
    );
  }

  const W = 800;
  const H = 400;
  const PAD = { top: 30, right: 80, bottom: 50, left: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // ohlcData format from CoinGecko: [timestamp, open, high, low, close]
  const allHighs = ohlcData.map(d => d[2]);
  const allLows = ohlcData.map(d => d[3]);
  const minPrice = Math.min(...allLows);
  const maxPrice = Math.max(...allHighs);
  const priceRange = maxPrice - minPrice || minPrice * 0.01;
  const paddedMin = minPrice - priceRange * 0.05;
  const paddedMax = maxPrice + priceRange * 0.05;
  const paddedRange = paddedMax - paddedMin;

  // Calculate candle width - candles should be adjacent with small gap
  const numCandles = ohlcData.length;
  const candleWidth = Math.max(2, Math.min(15, (chartW / numCandles) * 0.8));
  const candleGap = (chartW / numCandles) - candleWidth;
  const wickWidth = Math.max(1, candleWidth * 0.15);

  // Price levels for grid
  const priceLevels = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => paddedMax - paddedRange * t);

  // Calculate price change
  const firstCandle = ohlcData[0];
  const lastCandle = ohlcData[ohlcData.length - 1];
  const startPrice = firstCandle[1]; // open of first candle
  const endPrice = lastCandle[4]; // close of last candle
  const isUp = endPrice >= startPrice;

  const fmtAxis = (p) => {
    if (p >= 1000) return '$' + (p / 1000).toFixed(1) + 'k';
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    return '$' + p.toFixed(6);
  };

  // Y coordinate helper
  const priceToY = (price) => {
    return PAD.top + chartH - ((price - paddedMin) / paddedRange) * chartH;
  };

  // Current price line Y
  const currentY = priceToY(endPrice);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid lines */}
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
                {fmtAxis(price)}
              </text>
            </g>
          );
        })}

        {/* Time labels */}
        {timeLabels && timeLabels.map((label, i) => {
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
          // Position candles adjacently with small gap
          const candleTotalWidth = chartW / numCandles;
          const x = PAD.left + (i * candleTotalWidth) + (candleTotalWidth / 2);
          
          const isGreen = close >= open;
          const bodyTop = priceToY(Math.max(open, close));
          const bodyBottom = priceToY(Math.min(open, close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);
          
          const wickTop = priceToY(high);
          const wickBottom = priceToY(low);

          // CoinGecko style colors
          const fillColor = isGreen ? '#16c784' : '#ea3943';
          const strokeColor = isGreen ? '#16c784' : '#ea3943';

          return (
            <g key={i}>
              {/* Wick (high-low line) */}
              <line
                x1={x}
                y1={wickTop}
                x2={x}
                y2={wickBottom}
                stroke={strokeColor}
                strokeWidth={wickWidth}
              />
              {/* Body (open-close rectangle) */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={0.5}
              />
            </g>
          );
        })}

        {/* Current price dashed line */}
        <line
          x1={PAD.left}
          y1={currentY}
          x2={PAD.left + chartW}
          y2={currentY}
          stroke={isUp ? '#16c784' : '#ea3943'}
          strokeWidth="1"
          strokeDasharray="6,3"
          opacity="0.6"
        />
      </svg>

      {/* Stats footer */}
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex gap-6 text-sm">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#16c784] mr-2"></span>
            High:{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {fmtAxis(maxPrice)}
            </span>
          </span>
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ea3943] mr-2"></span>
            Low:{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {fmtAxis(minPrice)}
            </span>
          </span>
        </div>
        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Spread:{' '}
          <span className={`font-semibold ${isUp ? 'text-[#16c784]' : 'text-[#ea3943]'}`}>
            {(((maxPrice - minPrice) / minPrice) * 100).toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  );
};

export const DetailChart = ({ data, basePrice, change7d }) => {
  if (!data?.length || data.length < 2) {
    return (
      <div className="w-full h-48 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
        No chart data
      </div>
    );
  }

  const W = 360;
  const H = 180;
  const PAD = { top: 20, right: 58, bottom: 35, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const endPrice = basePrice;
  const startPrice = endPrice / (1 + (change7d || 0) / 100);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const priceMin = startPrice * (min / 100);
  const priceMax = startPrice * (max / 100);
  const priceRange = priceMax - priceMin || priceMin * 0.01;
  const paddedMin = priceMin - priceRange * 0.1;
  const paddedMax = priceMax + priceRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const priceLevels = [0, 0.33, 0.66, 1].map((t) => paddedMax - paddedRange * t);
  const timeLabels = ['7d ago', '5d', '3d', '1d', 'Now'];

  const pts = data.map((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const actualPrice = startPrice * (v / 100);
    const y = PAD.top + chartH - ((actualPrice - paddedMin) / paddedRange) * chartH;
    return `${x},${y}`;
  });

  const areaPath =
    `M${PAD.left},${PAD.top + chartH} ` +
    pts.map((p) => `L${p}`).join(' ') +
    ` L${PAD.left + chartW},${PAD.top + chartH} Z`;

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  const fmtAxis = (p) => {
    if (p >= 1000) return '$' + (p / 1000).toFixed(1) + 'k';
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    return '$' + p.toFixed(6);
  };

  const currentY = PAD.top + chartH - ((endPrice - paddedMin) / paddedRange) * chartH;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '200px' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {priceLevels.map((price, i) => {
          const y = PAD.top + (i / 3) * chartH;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
                strokeDasharray="3,3"
              />
              <text
                x={W - 5}
                y={y + 3}
                textAnchor="end"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
              >
                {fmtAxis(price)}
              </text>
            </g>
          );
        })}
        {timeLabels.map((label, i) => {
          const x = PAD.left + (i / (timeLabels.length - 1)) * chartW;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={PAD.top}
                x2={x}
                y2={PAD.top + chartH}
                stroke="rgba(255,255,255,0.04)"
              />
              <text x={x} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
                {label}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#chartGrad)" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.join(' ')}
        />
        <line
          x1={PAD.left}
          y1={currentY}
          x2={PAD.left + chartW}
          y2={currentY}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity="0.5"
        />
      </svg>
      <div className="flex justify-between items-center mt-3 px-1">
        <div className="flex gap-4 text-xs">
          <span className="text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            High: <span className="text-white font-medium">{fmtAxis(startPrice * (max / 100))}</span>
          </span>
          <span className="text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
            Low: <span className="text-white font-medium">{fmtAxis(startPrice * (min / 100))}</span>
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Spread:{' '}
          <span className={`font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {(((max - min) / min) * 100).toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
};

export const FullPageChart = ({ data, basePrice, change7d, timeLabels: customTimeLabels, darkMode = true }) => {
  if (!data?.length || data.length < 2) {
    return (
      <div className={`w-full h-80 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100'} rounded-xl animate-pulse flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        No chart data
      </div>
    );
  }

  const W = 800;
  const H = 400;
  const PAD = { top: 30, right: 80, bottom: 50, left: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const endPrice = basePrice;
  const startPrice = endPrice / (1 + (change7d || 0) / 100);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const priceMin = startPrice * (min / 100);
  const priceMax = startPrice * (max / 100);
  const priceRange = priceMax - priceMin || priceMin * 0.01;
  const paddedMin = priceMin - priceRange * 0.1;
  const paddedMax = priceMax + priceRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const priceLevels = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => paddedMax - paddedRange * t);
  const timeLabels = customTimeLabels || ['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'];

  const pts = data.map((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const actualPrice = startPrice * (v / 100);
    const y = PAD.top + chartH - ((actualPrice - paddedMin) / paddedRange) * chartH;
    return `${x},${y}`;
  });

  const areaPath =
    `M${PAD.left},${PAD.top + chartH} ` +
    pts.map((p) => `L${p}`).join(' ') +
    ` L${PAD.left + chartW},${PAD.top + chartH} Z`;

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  const fmtAxis = (p) => {
    if (p >= 1000) return '$' + (p / 1000).toFixed(1) + 'k';
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    return '$' + p.toFixed(6);
  };

  const currentY = PAD.top + chartH - ((endPrice - paddedMin) / paddedRange) * chartH;

  // Theme-aware colors
  const gridColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const gridColorLight = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const textColor = darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="fullChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {priceLevels.map((price, i) => {
          const y = PAD.top + (i / 5) * chartH;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke={gridColor}
                strokeDasharray="4,4"
              />
              <text
                x={W - 10}
                y={y + 4}
                textAnchor="end"
                fill={textColor}
                fontSize="12"
              >
                {fmtAxis(price)}
              </text>
            </g>
          );
        })}
        {timeLabels.map((label, i) => {
          const x = PAD.left + (i / (timeLabels.length - 1)) * chartW;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={PAD.top}
                x2={x}
                y2={PAD.top + chartH}
                stroke={gridColorLight}
              />
              <text x={x} y={H - 15} textAnchor="middle" fill={textColor} fontSize="12">
                {label}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#fullChartGrad)" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.join(' ')}
        />
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
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex gap-6 text-sm">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
            High:{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fmtAxis(startPrice * (max / 100))}</span>
          </span>
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
            Low:{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fmtAxis(startPrice * (min / 100))}</span>
          </span>
        </div>
        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Spread:{' '}
          <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {(((max - min) / min) * 100).toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  );
};
