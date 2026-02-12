// ==================================================
// FILE: src/components/Charts.jsx
// ==================================================

import { formatPrice } from '../utils';
import { useState, useRef, useCallback } from 'react';

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

// CoinGecko-style Candlestick Chart with hover tooltip
export const CandlestickChart = ({ ohlcData, darkMode = true }) => {
  const [hoverInfo, setHoverInfo] = useState(null);
  const svgRef = useRef(null);

  if (!ohlcData?.length || ohlcData.length < 2) {
    return (
      <div className="w-full h-80 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
        No OHLC data available
      </div>
    );
  }

  const W = 900;
  const H = 450;
  const PAD = { top: 15, right: 65, bottom: 40, left: 5 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Downsample OHLC if too many candles for the chart width
  const downsampleOHLC = (data, maxCandles) => {
    if (data.length <= maxCandles) return data;
    const factor = Math.ceil(data.length / maxCandles);
    const result = [];
    for (let i = 0; i < data.length; i += factor) {
      const chunk = data.slice(i, Math.min(i + factor, data.length));
      const open = chunk[0][1];
      const close = chunk[chunk.length - 1][4];
      let high = -Infinity, low = Infinity;
      let ts = chunk[0][0];
      for (const c of chunk) {
        if (c[2] > high) high = c[2];
        if (c[3] < low) low = c[3];
      }
      result.push([ts, open, high, low, close]);
    }
    return result;
  };

  // Cap at ~80 candles max for clean visuals
  const processedData = downsampleOHLC(ohlcData, 80);

  // ohlcData format: [[timestamp, open, high, low, close], ...]
  const allHighs = processedData.map(c => c[2]);
  const allLows = processedData.map(c => c[3]);
  const dataMax = Math.max(...allHighs);
  const dataMin = Math.min(...allLows);
  const dataRange = dataMax - dataMin || dataMin * 0.01;

  // Nice round grid levels matching CoinGecko ($55K, $60K, $65K, $70K...)
  const getNiceGridLevels = (min, max) => {
    const range = max - min;
    const rawStep = range / 8; // target ~8-10 grid lines like CoinGecko
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let niceStep;
    if (residual <= 1.5) niceStep = 1 * magnitude;
    else if (residual <= 3) niceStep = 2 * magnitude;
    else if (residual <= 7) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;

    const gridMin = Math.floor(min / niceStep) * niceStep;
    const gridMax = Math.ceil(max / niceStep) * niceStep;
    const levels = [];
    for (let v = gridMin; v <= gridMax + niceStep * 0.5; v += niceStep) {
      levels.push(v);
    }
    return levels;
  };

  const gridLevels = getNiceGridLevels(dataMin - dataRange * 0.08, dataMax + dataRange * 0.08);
  const paddedMin = gridLevels[0];
  const paddedMax = gridLevels[gridLevels.length - 1];
  const paddedRange = paddedMax - paddedMin || 1;

  const candleCount = processedData.length;
  const slotW = chartW / candleCount;
  // CoinGecko proportions: body ~70% of slot, rest is gap
  const candleW = Math.max(3, slotW * 0.7);

  const priceToY = (price) => PAD.top + chartH - ((price - paddedMin) / paddedRange) * chartH;
  const getCandleX = (i) => PAD.left + i * slotW + (slotW - candleW) / 2;
  const getCandleCenterX = (i) => PAD.left + i * slotW + slotW / 2;

  // Time labels — CoinGecko shows every 1-2 days for 1M, every few hours for 24H, etc.
  const totalDurationMs = processedData[processedData.length - 1][0] - processedData[0][0];
  const totalDays = totalDurationMs / (86400000);

  const getTimeLabels = () => {
    const labels = [];
    const minPixelGap = 70; // minimum SVG units between labels
    let lastLabelX = -999;
    let lastLabelKey = ''; // prevents duplicate labels

    for (let i = 0; i < candleCount; i++) {
      const ts = processedData[i][0];
      const d = new Date(ts);
      const x = getCandleCenterX(i);

      if (x - lastLabelX < minPixelGap) continue;

      let label;
      let key;

      if (totalDays <= 1.5) {
        // 24H: every 2-3 hours "00:00", "03:00"...
        const h = d.getHours();
        if (h % 2 !== 0 && i > 0) continue;
        label = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        key = label;
      } else if (totalDays <= 8) {
        // 7D: "6. Feb", "7. Feb"...
        label = d.getDate() + '. ' + d.toLocaleString('en', { month: 'short' });
        key = d.getDate() + '-' + d.getMonth();
      } else if (totalDays <= 35) {
        // 1M: every 2 days "14. Jan", "16. Jan"...
        const day = d.getDate();
        if (day % 2 !== 0 && i > 0 && i < candleCount - 1) continue;
        label = d.getDate() + '. ' + d.toLocaleString('en', { month: 'short' });
        key = d.getDate() + '-' + d.getMonth();
      } else if (totalDays <= 100) {
        // 3M: weekly-ish "14. Jan", "21. Jan"...
        label = d.getDate() + '. ' + d.toLocaleString('en', { month: 'short' });
        key = d.getDate() + '-' + d.getMonth();
      } else if (totalDays <= 400) {
        // 1Y: monthly "Feb 25", "Mar 25"...
        label = d.toLocaleString('en', { month: 'short' }) + ' ' + d.getFullYear().toString().slice(2);
        key = d.getMonth() + '-' + d.getFullYear();
      } else {
        // Max / multi-year: show years "2014", "2015", "2016"...
        const year = d.getFullYear();
        label = year.toString();
        key = year.toString();
      }

      // Skip duplicate labels
      if (key === lastLabelKey) continue;

      labels.push({ label, x });
      lastLabelX = x;
      lastLabelKey = key;
    }
    return labels;
  };

  const timeLabels = getTimeLabels();

  // Format price for axis — clean round numbers
  const fmtAxis = (p) => {
    if (p <= 0) return '$0';
    if (p >= 100000) return '$' + (p / 1000).toFixed(0) + 'K';
    if (p >= 10000) return '$' + (p / 1000).toFixed(0) + 'K';
    if (p >= 1000) {
      const k = p / 1000;
      return '$' + (k === Math.floor(k) ? k.toFixed(0) : k.toFixed(1)) + 'K';
    }
    if (p >= 100) return '$' + p.toFixed(0);
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    if (p >= 0.0001) return '$' + p.toFixed(6);
    return '$' + p.toFixed(8);
  };

  // Format price for tooltip — full precision
  const fmtTooltip = (p) => {
    if (p >= 1) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 0.01) return '$' + p.toFixed(4);
    if (p >= 0.0001) return '$' + p.toFixed(6);
    return '$' + p.toFixed(8);
  };

  // CoinGecko colors
  const bullColor = '#16c784';
  const bearColor = '#ea3943';
  const gridColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';

  // Mouse handlers for hover tooltip
  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    // Find nearest candle
    const candleIdx = Math.floor((mouseX - PAD.left) / slotW);
    if (candleIdx < 0 || candleIdx >= candleCount) {
      setHoverInfo(null);
      return;
    }

    const candle = processedData[candleIdx];
    const x = getCandleCenterX(candleIdx);
    setHoverInfo({
      idx: candleIdx,
      x,
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
    });
  }, [processedData, candleCount, slotW]);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // Tooltip positioning
  const tooltipW = 220;
  const tooltipH = 110;
  const getTooltipX = (hx) => {
    if (hx + tooltipW / 2 + 10 > W - PAD.right) return hx - tooltipW - 10;
    if (hx - tooltipW / 2 - 10 < PAD.left) return hx + 10;
    return hx - tooltipW / 2;
  };

  return (
    <div className="w-full relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Horizontal grid lines */}
        {gridLevels.map((price, i) => {
          const y = priceToY(price);
          if (y < PAD.top - 2 || y > PAD.top + chartH + 2) return null;
          return (
            <g key={`grid-${i}`}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke={gridColor}
                strokeWidth="0.8"
              />
              <text
                x={W - 4}
                y={y + 4}
                textAnchor="end"
                fill={textColor}
                fontSize="11"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              >
                {fmtAxis(price)}
              </text>
            </g>
          );
        })}

        {/* Vertical time lines + labels */}
        {timeLabels.map((t, i) => (
          <g key={`time-${i}`}>
            <text
              x={t.x}
              y={H - 12}
              textAnchor="middle"
              fill={textColor}
              fontSize="10.5"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Candlesticks */}
        {processedData.map((candle, i) => {
          const [, open, high, low, close] = candle;
          const isBull = close >= open;
          const color = isBull ? bullColor : bearColor;

          const x = getCandleX(i);
          const bodyTop = priceToY(Math.max(open, close));
          const bodyBottom = priceToY(Math.min(open, close));
          const bodyHeight = Math.max(1.2, bodyBottom - bodyTop);
          const wickX = getCandleCenterX(i);

          return (
            <g key={`candle-${i}`}>
              {/* Wick — single thin line from high to low */}
              <line
                x1={wickX}
                y1={priceToY(high)}
                x2={wickX}
                y2={priceToY(low)}
                stroke={color}
                strokeWidth="1"
              />
              {/* Candle body */}
              <rect
                x={x}
                y={bodyTop}
                width={candleW}
                height={bodyHeight}
                fill={color}
              />
            </g>
          );
        })}

        {/* Hover crosshair + tooltip */}
        {hoverInfo && (
          <>
            {/* Vertical crosshair line */}
            <line
              x1={hoverInfo.x}
              y1={PAD.top}
              x2={hoverInfo.x}
              y2={PAD.top + chartH}
              stroke={darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth="0.8"
              strokeDasharray="4,3"
            />
            {/* Highlight the hovered candle */}
            <rect
              x={PAD.left + hoverInfo.idx * slotW}
              y={PAD.top}
              width={slotW}
              height={chartH}
              fill={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
            />
            {/* Tooltip background */}
            <rect
              x={getTooltipX(hoverInfo.x)}
              y={PAD.top + 5}
              width={tooltipW}
              height={tooltipH}
              rx="6"
              fill={darkMode ? 'rgba(30,32,38,0.95)' : 'rgba(255,255,255,0.97)'}
              stroke={darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              filter="url(#tooltipShadow)"
            />
            {/* Tooltip text */}
            {(() => {
              const tx = getTooltipX(hoverInfo.x) + 12;
              const d = new Date(hoverInfo.timestamp);
              const dateStr = d.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              }) + ', ' + d.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
              });
              const isBull = hoverInfo.close >= hoverInfo.open;
              const ohlcColor = isBull ? bullColor : bearColor;

              return (
                <>
                  <text x={tx} y={PAD.top + 23} fill={textColor} fontSize="10" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
                    {dateStr}
                  </text>
                  <text x={tx} y={PAD.top + 42} fill={darkMode ? '#ddd' : '#333'} fontSize="11.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontWeight="500">
                    {'O: '}{fmtTooltip(hoverInfo.open)}
                  </text>
                  <text x={tx} y={PAD.top + 58} fill={darkMode ? '#ddd' : '#333'} fontSize="11.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontWeight="500">
                    {'H: '}{fmtTooltip(hoverInfo.high)}
                  </text>
                  <text x={tx} y={PAD.top + 74} fill={darkMode ? '#ddd' : '#333'} fontSize="11.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontWeight="500">
                    {'L: '}{fmtTooltip(hoverInfo.low)}
                  </text>
                  <text x={tx} y={PAD.top + 90} fill={darkMode ? '#ddd' : '#333'} fontSize="11.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontWeight="500">
                    {'C: '}{fmtTooltip(hoverInfo.close)}
                  </text>
                </>
              );
            })()}
          </>
        )}

        {/* Drop shadow filter for tooltip */}
        <defs>
          <filter id="tooltipShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity={darkMode ? '0.5' : '0.15'} />
          </filter>
        </defs>
      </svg>

      {/* Bottom info bar */}
      <div className="flex justify-between items-center mt-3 px-2">
        <div className="flex gap-6 text-sm">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: bullColor }}></span>
            High:{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fmtAxis(dataMax)}</span>
          </span>
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: bearColor }}></span>
            Low:{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fmtAxis(dataMin)}</span>
          </span>
        </div>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Spread:{' '}
          <span className={`font-semibold ${processedData[processedData.length - 1][4] >= processedData[0][1] ? 'text-green-400' : 'text-red-400'}`}>
            {(((dataMax - dataMin) / dataMin) * 100).toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  );
};

export const FullPageChart = ({ data, basePrice, change7d, timeLabels: customTimeLabels }) => {
  if (!data?.length || data.length < 2) {
    return (
      <div className="w-full h-80 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
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
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4,4"
              />
              <text
                x={W - 10}
                y={y + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.5)"
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
                stroke="rgba(255,255,255,0.05)"
              />
              <text x={x} y={H - 15} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">
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
          <span className="text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
            High:{' '}
            <span className="text-white font-semibold">{fmtAxis(startPrice * (max / 100))}</span>
          </span>
          <span className="text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
            Low:{' '}
            <span className="text-white font-semibold">{fmtAxis(startPrice * (min / 100))}</span>
          </span>
        </div>
        <span className="text-sm text-gray-400">
          Spread:{' '}
          <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {(((max - min) / min) * 100).toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  );
};
