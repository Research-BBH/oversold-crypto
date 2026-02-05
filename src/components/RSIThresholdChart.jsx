// ==================================================
// FILE: src/components/RSIThresholdChart.jsx
// Improved RSI Threshold Analysis with Brush Zoom
// ==================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { formatPrice } from '../utils';

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

// Main component
export const RSIThresholdAnalysis = ({ rsi, priceHistory, darkMode }) => {
  const [mode, setMode] = useState('oversold');
  const [threshold, setThreshold] = useState(30);
  
  // Zoom state: start and end indices as percentage (0-1)
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 1 });
  const [activePreset, setActivePreset] = useState('6m'); // Track which button is active
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'left', 'right', 'middle'
  const [dragStartX, setDragStartX] = useState(0);
  const [initialRange, setInitialRange] = useState({ start: 0, end: 1 });
  
  // Tooltip state
  const [tooltip, setTooltip] = useState(null);
  
  const brushRef = useRef(null);
  const chartRef = useRef(null);

  // Convert to daily data with RSI
  const allDailyData = useMemo(() => {
    if (!priceHistory || priceHistory.length < 15) return [];
    
    const isAlreadyDaily = priceHistory.length <= 200;
    let result = [];
    
    if (isAlreadyDaily) {
      for (let i = 0; i < priceHistory.length; i++) {
        const pricesUpToNow = priceHistory.slice(0, i + 1);
        const rsiVal = calculateRSI(pricesUpToNow, 14);
        
        const daysAgo = priceHistory.length - i - 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        result.push({
          day: i,
          price: priceHistory[i],
          rsi: rsiVal,
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
          const rsiVal = calculateRSI(pricesUpToNow, 14);
          
          const daysAgo = totalDays - day - 1;
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          
          result.push({
            day: day,
            price: closePrice,
            rsi: rsiVal,
            date: date,
            daysAgo: daysAgo
          });
        }
      }
    }
    
    return result;
  }, [priceHistory]);

  // Visible data based on zoom
  const visibleData = useMemo(() => {
    const startIdx = Math.floor(zoomRange.start * allDailyData.length);
    const endIdx = Math.ceil(zoomRange.end * allDailyData.length);
    return allDailyData.slice(startIdx, Math.max(endIdx, startIdx + 2));
  }, [allDailyData, zoomRange]);

  // Calculate signal days within visible range
  const signalDays = useMemo(() => {
    return visibleData.filter(d => {
      if (d.rsi === null) return false;
      return mode === 'oversold' ? d.rsi < threshold : d.rsi > threshold;
    });
  }, [visibleData, threshold, mode]);

  // Signal zones for visible data
  const signalZones = useMemo(() => {
    const zones = [];
    let currentZone = null;
    
    visibleData.forEach((d, i) => {
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
  }, [visibleData, threshold, mode]);

  // Stats for all data
  const allSignalDays = useMemo(() => {
    return allDailyData.filter(d => {
      if (d.rsi === null) return false;
      return mode === 'oversold' ? d.rsi < threshold : d.rsi > threshold;
    }).length;
  }, [allDailyData, threshold, mode]);

  const percentInZone = allDailyData.length > 0 
    ? ((allSignalDays / allDailyData.length) * 100).toFixed(1) 
    : 0;

  // Chart dimensions
  const width = 900;
  const height = 380;
  const brushHeight = 80; // Increased for labels outside brush
  const padding = { top: 30, right: 70, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate if we should show labels (based on zoom level and density)
  const zoomLevel = 1 / (zoomRange.end - zoomRange.start);
  const pixelsPerSignal = signalDays.length > 0 ? chartWidth / signalDays.length : chartWidth;
  const showLabels = pixelsPerSignal > 60; // Only show labels if there's enough space

  // Price scaling for visible data
  const prices = visibleData.map(d => d.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
  const priceRange = maxPrice - minPrice || 1;
  const pricePadding = priceRange * 0.15;

  const getX = (index) => padding.left + (index / Math.max(visibleData.length - 1, 1)) * chartWidth;
  const getY = (price) => padding.top + chartHeight - ((price - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;

  // Line path for visible data
  const linePath = visibleData.map((d, i) => {
    const x = getX(i);
    const y = getY(d.price);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const areaPath = linePath + 
    ` L ${getX(visibleData.length - 1)} ${padding.top + chartHeight}` +
    ` L ${padding.left} ${padding.top + chartHeight} Z`;

  const lineColor = mode === 'oversold' ? '#f97316' : '#22c55e';
  const signalColor = mode === 'oversold' ? '#f97316' : '#22c55e';

  // Mini chart for brush (shows all data)
  // Brush area is y=8 to y=52, so chart draws from y=12 to y=48 (36px range)
  const miniPrices = allDailyData.map(d => d.price);
  const miniMin = miniPrices.length > 0 ? Math.min(...miniPrices) : 0;
  const miniMax = miniPrices.length > 0 ? Math.max(...miniPrices) : 1;
  const miniRange = miniMax - miniMin || 1;

  const getMiniX = (index) => padding.left + (index / Math.max(allDailyData.length - 1, 1)) * chartWidth;
  const getMiniY = (price) => 12 + 36 - ((price - miniMin) / miniRange) * 36;

  const miniLinePath = allDailyData.map((d, i) => {
    const x = getMiniX(i);
    const y = getMiniY(d.price);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // RSI mini line
  const getMiniRsiY = (rsiVal) => {
    if (rsiVal === null) return 30;
    return 12 + 36 - (rsiVal / 100) * 36;
  };

  const miniRsiPath = allDailyData
    .filter(d => d.rsi !== null)
    .map((d, i) => {
      const idx = allDailyData.indexOf(d);
      const x = getMiniX(idx);
      const y = getMiniRsiY(d.rsi);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

  // Brush interaction handlers
  const handleBrushMouseDown = useCallback((e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStartX(e.clientX);
    setInitialRange({ ...zoomRange });
  }, [zoomRange]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !brushRef.current) return;
    
    const brushRect = brushRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = deltaX / brushRect.width;
    
    let newStart = initialRange.start;
    let newEnd = initialRange.end;
    
    if (dragType === 'left') {
      newStart = Math.max(0, Math.min(initialRange.start + deltaPercent, initialRange.end - 0.05));
    } else if (dragType === 'right') {
      newEnd = Math.min(1, Math.max(initialRange.end + deltaPercent, initialRange.start + 0.05));
    } else if (dragType === 'middle') {
      const rangeSize = initialRange.end - initialRange.start;
      newStart = Math.max(0, Math.min(initialRange.start + deltaPercent, 1 - rangeSize));
      newEnd = newStart + rangeSize;
    }
    
    // Clear preset indicator when manually dragging
    setZoomRange({ start: newStart, end: newEnd });
    setActivePreset(null);
  }, [isDragging, dragType, dragStartX, initialRange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Chart hover handler
  const handleChartMouseMove = useCallback((e) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * width;
    
    if (svgX < padding.left || svgX > width - padding.right) {
      setTooltip(null);
      return;
    }
    
    const dataIndex = Math.round(((svgX - padding.left) / chartWidth) * (visibleData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, visibleData.length - 1));
    const dataPoint = visibleData[clampedIndex];
    
    if (dataPoint) {
      const isSignal = dataPoint.rsi !== null && 
        (mode === 'oversold' ? dataPoint.rsi < threshold : dataPoint.rsi > threshold);
      
      setTooltip({
        x: getX(clampedIndex),
        y: getY(dataPoint.price),
        data: dataPoint,
        isSignal
      });
    }
  }, [visibleData, width, chartWidth, padding, mode, threshold, getX, getY]);

  const handleChartMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Zoom presets
  const setZoomPreset = (preset) => {
    setActivePreset(preset);
    switch(preset) {
      case '1m':
        setZoomRange({ start: Math.max(0, 1 - 30/allDailyData.length), end: 1 });
        break;
      case '3m':
        setZoomRange({ start: Math.max(0, 1 - 90/allDailyData.length), end: 1 });
        break;
      case '6m':
        setZoomRange({ start: 0, end: 1 });
        break;
    }
  };
  
  // Clear active preset when user manually drags (since it's no longer matching a preset)
  const handleManualZoom = (newRange) => {
    setZoomRange(newRange);
    setActivePreset(null);
  };

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

  // X-axis labels
  const labelCount = Math.min(8, visibleData.length);
  const labelStep = Math.max(1, Math.floor(visibleData.length / labelCount));
  const xLabels = visibleData.filter((_, i) => i % labelStep === 0 || i === visibleData.length - 1);

  // Smart label positioning - avoid collisions and stay within chart bounds
  const labelPositions = useMemo(() => {
    if (!showLabels) return [];
    
    const positions = [];
    const usedRanges = [];
    const labelHeight = 20;
    const labelWidth = 48;
    const maxLabelY = padding.top + chartHeight - 10; // Don't go below chart
    
    // Sort signal days by x position for better placement
    const sortedSignals = [...signalDays].map(d => {
      const dataIdx = visibleData.indexOf(d);
      return { ...d, dataIdx, x: getX(dataIdx), y: getY(d.price) };
    }).sort((a, b) => a.x - b.x);
    
    sortedSignals.forEach((d) => {
      const x = d.x;
      const y = d.y;
      
      // Try placing label below the point first, then above if needed
      let labelY = y + 30;
      let placed = false;
      
      // Try positions below (up to 3 attempts)
      for (let attempt = 0; attempt < 3 && !placed; attempt++) {
        const testY = y + 30 + (attempt * (labelHeight + 4));
        
        // Check if within bounds
        if (testY + labelHeight > maxLabelY) continue;
        
        // Check for collisions with existing labels
        const overlaps = usedRanges.some(range => 
          Math.abs(range.x - x) < labelWidth &&
          Math.abs(range.y - testY) < labelHeight + 4
        );
        
        if (!overlaps) {
          labelY = testY;
          placed = true;
        }
      }
      
      // If couldn't place below, try above
      if (!placed) {
        for (let attempt = 0; attempt < 3; attempt++) {
          const testY = y - 35 - (attempt * (labelHeight + 4));
          
          // Check if within bounds (not above chart)
          if (testY < padding.top + 10) continue;
          
          const overlaps = usedRanges.some(range => 
            Math.abs(range.x - x) < labelWidth &&
            Math.abs(range.y - testY) < labelHeight + 4
          );
          
          if (!overlaps) {
            labelY = testY;
            placed = true;
            break;
          }
        }
      }
      
      // Final fallback - just use default position
      if (!placed) {
        labelY = Math.min(y + 30, maxLabelY - labelHeight);
      }
      
      usedRanges.push({ x, y: labelY });
      positions.push({ 
        x, 
        y, 
        labelY, 
        dataIdx: d.dataIdx, 
        rsi: d.rsi, 
        price: d.price, 
        date: d.date,
        above: labelY < y // Track if label is above the point
      });
    });
    
    return positions;
  }, [signalDays, visibleData, showLabels, getX, getY, padding.top, chartHeight]);

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

      {/* Chart */}
      {hasData ? (
        <div className="space-y-2">
          {/* Stats and zoom presets */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {mode === 'oversold' ? '🔴' : '🟢'} {allSignalDays} day{allSignalDays !== 1 ? 's' : ''} in zone ({percentInZone}%)
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                • Viewing {visibleData.length} of {allDailyData.length} days ({(zoomLevel).toFixed(1)}x zoom)
              </span>
            </div>
            
            {/* Quick zoom buttons */}
            <div className={`inline-flex rounded-lg p-1 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
              {[
                { id: '1m', label: '1M' },
                { id: '3m', label: '3M' },
                { id: '6m', label: '6M' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setZoomPreset(tf.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    activePreset === tf.id
                      ? mode === 'oversold'
                        ? 'bg-orange-500 text-white shadow'
                        : 'bg-green-500 text-white shadow'
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hint */}
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            💡 Drag the handles below the chart to zoom, or drag the selection to pan. Hover over the chart to see values.
          </p>
          
          {/* Main Chart */}
          <div className="w-full overflow-x-auto">
            <svg 
              ref={chartRef}
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-auto min-w-[700px]"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
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

              {/* Signal day dots */}
              {signalDays.map((d, idx) => {
                const dataIdx = visibleData.indexOf(d);
                const x = getX(dataIdx);
                const y = getY(d.price);
                
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="5"
                    fill={signalColor}
                    stroke={darkMode ? '#1a1a2e' : '#fff'}
                    strokeWidth="2"
                  />
                );
              })}

              {/* Smart labels (only when zoomed in enough) */}
              {labelPositions.map((pos, idx) => (
                <g key={idx}>
                  {/* Connecting line */}
                  <line
                    x1={pos.x}
                    y1={pos.above ? pos.y - 7 : pos.y + 7}
                    x2={pos.x}
                    y2={pos.above ? pos.labelY + 9 : pos.labelY - 9}
                    stroke={signalColor}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  {/* Label background */}
                  <rect
                    x={pos.x - 22}
                    y={pos.labelY - 9}
                    width="44"
                    height="18"
                    rx="4"
                    fill={pos.rsi < 20 || pos.rsi > 80 ? signalColor : '#facc15'}
                  />
                  {/* RSI value text */}
                  <text
                    x={pos.x}
                    y={pos.labelY + 4}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill={pos.rsi < 20 || pos.rsi > 80 ? '#fff' : '#000'}
                  >
                    {pos.rsi.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* X-axis labels */}
              {xLabels.map((d, i) => {
                const originalIndex = visibleData.indexOf(d);
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
              {visibleData.length > 0 && (
                <circle
                  cx={getX(visibleData.length - 1)}
                  cy={getY(visibleData[visibleData.length - 1].price)}
                  r="5"
                  fill={lineColor}
                  stroke={darkMode ? '#1a1a2e' : '#fff'}
                  strokeWidth="2"
                />
              )}

              {/* Tooltip */}
              {tooltip && (
                <g>
                  {/* Crosshair */}
                  <line
                    x1={tooltip.x}
                    y1={padding.top}
                    x2={tooltip.x}
                    y2={padding.top + chartHeight}
                    stroke={darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
                    strokeDasharray="4,4"
                  />
                  <circle
                    cx={tooltip.x}
                    cy={tooltip.y}
                    r="6"
                    fill={tooltip.isSignal ? signalColor : lineColor}
                    stroke={darkMode ? '#1a1a2e' : '#fff'}
                    strokeWidth="2"
                  />
                  {/* Tooltip box */}
                  <rect
                    x={tooltip.x - 65}
                    y={Math.min(tooltip.y - 70, padding.top + 10)}
                    width="130"
                    height="60"
                    rx="6"
                    fill={darkMode ? '#1f2937' : '#ffffff'}
                    stroke={darkMode ? '#374151' : '#e5e7eb'}
                    strokeWidth="1"
                  />
                  <text
                    x={tooltip.x}
                    y={Math.min(tooltip.y - 70, padding.top + 10) + 16}
                    textAnchor="middle"
                    className="text-[10px] font-medium"
                    fill={darkMode ? '#9ca3af' : '#6b7280'}
                  >
                    {tooltip.data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </text>
                  <text
                    x={tooltip.x}
                    y={Math.min(tooltip.y - 70, padding.top + 10) + 32}
                    textAnchor="middle"
                    className="text-[11px] font-bold"
                    fill={darkMode ? '#fff' : '#1f2937'}
                  >
                    {formatPrice(tooltip.data.price)}
                  </text>
                  <text
                    x={tooltip.x}
                    y={Math.min(tooltip.y - 70, padding.top + 10) + 50}
                    textAnchor="middle"
                    className="text-[11px] font-bold"
                    fill={tooltip.isSignal ? signalColor : (darkMode ? '#9ca3af' : '#6b7280')}
                  >
                    RSI: {tooltip.data.rsi !== null ? tooltip.data.rsi.toFixed(1) : 'N/A'}
                    {tooltip.isSignal && ' ⚡'}
                  </text>
                </g>
              )}

              {/* Legend */}
              <g transform={`translate(${padding.left + 10}, ${padding.top + 10})`}>
                <rect x="0" y="0" width="12" height="12" fill={signalColor} opacity="0.4" rx="2" />
                <text x="18" y="10" className="text-[10px]" fill={darkMode ? '#9ca3af' : '#6b7280'}>
                  RSI {mode === 'oversold' ? '<' : '>'} {threshold}
                </text>
              </g>
            </svg>
          </div>

          {/* RSI Mini Chart with Brush */}
          <div className="w-full overflow-x-auto mt-2">
            <svg 
              ref={brushRef}
              viewBox={`0 0 ${width} ${brushHeight}`} 
              className="w-full h-auto min-w-[700px]"
              style={{ cursor: isDragging ? 'grabbing' : 'default' }}
            >
              {/* Background */}
              <rect
                x={padding.left}
                y="8"
                width={chartWidth}
                height="44"
                fill={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                rx="4"
              />

              {/* Mini price line */}
              <path
                d={miniLinePath}
                fill="none"
                stroke={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
                strokeWidth="1"
              />

              {/* RSI line */}
              <path
                d={miniRsiPath}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* Threshold line */}
              <line
                x1={padding.left}
                y1={getMiniRsiY(threshold)}
                x2={width - padding.right}
                y2={getMiniRsiY(threshold)}
                stroke={signalColor}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />

              {/* Non-selected areas (dimmed) */}
              <rect
                x={padding.left}
                y="8"
                width={zoomRange.start * chartWidth}
                height="44"
                fill={darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'}
                rx="4"
              />
              <rect
                x={padding.left + zoomRange.end * chartWidth}
                y="8"
                width={(1 - zoomRange.end) * chartWidth}
                height="44"
                fill={darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'}
                rx="4"
              />

              {/* Selection box */}
              <rect
                x={padding.left + zoomRange.start * chartWidth}
                y="8"
                width={(zoomRange.end - zoomRange.start) * chartWidth}
                height="44"
                fill="transparent"
                stroke={signalColor}
                strokeWidth="2"
                rx="4"
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleBrushMouseDown(e, 'middle')}
              />

              {/* Left handle */}
              <g
                style={{ cursor: 'ew-resize' }}
                onMouseDown={(e) => handleBrushMouseDown(e, 'left')}
              >
                <rect
                  x={padding.left + zoomRange.start * chartWidth - 6}
                  y="14"
                  width="12"
                  height="32"
                  fill={signalColor}
                  rx="3"
                />
                <line
                  x1={padding.left + zoomRange.start * chartWidth - 2}
                  y1="22"
                  x2={padding.left + zoomRange.start * chartWidth - 2}
                  y2="38"
                  stroke="#fff"
                  strokeWidth="1"
                />
                <line
                  x1={padding.left + zoomRange.start * chartWidth + 2}
                  y1="22"
                  x2={padding.left + zoomRange.start * chartWidth + 2}
                  y2="38"
                  stroke="#fff"
                  strokeWidth="1"
                />
              </g>

              {/* Right handle */}
              <g
                style={{ cursor: 'ew-resize' }}
                onMouseDown={(e) => handleBrushMouseDown(e, 'right')}
              >
                <rect
                  x={padding.left + zoomRange.end * chartWidth - 6}
                  y="14"
                  width="12"
                  height="32"
                  fill={signalColor}
                  rx="3"
                />
                <line
                  x1={padding.left + zoomRange.end * chartWidth - 2}
                  y1="22"
                  x2={padding.left + zoomRange.end * chartWidth - 2}
                  y2="38"
                  stroke="#fff"
                  strokeWidth="1"
                />
                <line
                  x1={padding.left + zoomRange.end * chartWidth + 2}
                  y1="22"
                  x2={padding.left + zoomRange.end * chartWidth + 2}
                  y2="38"
                  stroke="#fff"
                  strokeWidth="1"
                />
              </g>

              {/* Labels - positioned below the brush area */}
              <text x={padding.left + 5} y="72" className="text-[9px]" fill={darkMode ? '#6b7280' : '#9ca3af'}>
                {allDailyData[0]?.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </text>
              <text x={width - padding.right - 5} y="72" textAnchor="end" className="text-[9px]" fill={darkMode ? '#6b7280' : '#9ca3af'}>
                {allDailyData[allDailyData.length - 1]?.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </text>
              <text x={width / 2} y="72" textAnchor="middle" className="text-[9px]" fill="#8b5cf6">
                RSI
              </text>
            </svg>
          </div>
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

export default RSIThresholdAnalysis;
