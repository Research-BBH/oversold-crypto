// ==================================================
// FILE: src/components/SignalAnalysis.jsx (FIXED)
// ==================================================

import { formatPrice } from '../utils';

export const SignalStrengthBadge = ({ strength }) => {
  if (!strength) return null;

  const colors = {
    HIGH: 'bg-green-500/20 border-green-500/40 text-green-400',
    MODERATE: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    LOW: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    NONE: 'bg-gray-500/20 border-gray-500/40 text-gray-400'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors[strength.level]}`}>
      <span className="font-bold text-sm">{strength.label}</span>
    </div>
  );
};

export const SignalScoreCircle = ({ score }) => {
  const safeScore = score || 0;

  const getColor = (s) => {
    if (s >= 75) return 'text-green-400';
    if (s >= 60) return 'text-blue-400';
    if (s >= 45) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStroke = (s) => {
    if (s >= 75) return '#22c55e';
    if (s >= 60) return '#3b82f6';
    if (s >= 45) return '#eab308';
    return '#9ca3af';
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={getStroke(safeScore)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${getColor(safeScore)}`}>{Math.round(safeScore)}</span>
      </div>
    </div>
  );
};

// Signal descriptions for education - BUY signals
const BUY_SIGNAL_DESCRIPTIONS = {
  'RSI Oversold': 'RSI below 30 indicates the asset may be undervalued. Historically, prices tend to bounce from oversold levels.',
  'RSI Oversold (Extreme)': 'RSI below 25 is extremely oversold. This often precedes strong reversals, but can also indicate serious fundamental issues. +5 bonus points for < 25, +10 for < 20.',
  'Above 50 SMA': 'Price is above the 50-period Simple Moving Average, indicating an uptrend. Buying dips in uptrends has higher success rates.',
  'Below BB Lower': 'Price is below the lower Bollinger Band (2 standard deviations below 20-period SMA). This is statistically rare and often precedes mean reversion.',
  'Volume Spike': 'Trading volume is significantly higher than the 20-period average. High volume on dips can indicate capitulation or accumulation.',
  'Bullish Divergence': 'Price made a lower low, but RSI made a higher low. This momentum divergence often precedes bullish reversals.',
  'Bullish Engulfing': 'A bullish engulfing candlestick pattern where the current green candle completely engulfs the previous red candle. This is a reversal signal.',
  'Negative Funding': 'Perpetual futures funding rate is negative, meaning shorts are paying longs. This indicates bearish sentiment that often marks bottoms.',
};

// Signal descriptions for education - SELL signals
const SELL_SIGNAL_DESCRIPTIONS = {
  'RSI Overbought': 'RSI above 70 indicates the asset may be overvalued. Historically, prices tend to pull back from overbought levels.',
  'RSI Overbought (Extreme)': 'RSI above 80 is extremely overbought. This often precedes corrections. +5 bonus points for > 75, +10 for > 80.',
  'Below 50 SMA': 'Price is below the 50-period Simple Moving Average, indicating a downtrend. Selling rallies in downtrends has higher success rates.',
  'Below 20 SMA': 'Price is below the 20-period Simple Moving Average, indicating short-term weakness. This is a faster signal than SMA50.',
  'Above BB Upper': 'Price is above the upper Bollinger Band (2 standard deviations above 20-period SMA). This is statistically rare and often precedes mean reversion.',
  'Bearish Divergence': 'Price made a higher high, but RSI made a lower high. This momentum divergence often precedes bearish reversals.',
  'Bearish Engulfing': 'A bearish engulfing candlestick pattern where the current red candle completely engulfs the previous green candle. This is a reversal signal.',
  'Positive Funding': 'Perpetual futures funding rate is highly positive (>0.01%), meaning longs are paying shorts. This indicates crowded long positions.',
  'Near ATH': 'Price is within 10% of the all-time high (from available data). This level often acts as resistance where selling pressure increases.',
  'High Vol/MCap': 'Trading volume exceeds 10% of market cap. This unusually high activity can indicate distribution (selling) or heightened speculation.',
};

// Combined for backward compatibility
const SIGNAL_DESCRIPTIONS = {
  ...BUY_SIGNAL_DESCRIPTIONS,
  ...SELL_SIGNAL_DESCRIPTIONS,
};

export const SignalsList = ({ signals, darkMode, showDescriptions = true }) => {
  if (!signals || !Array.isArray(signals) || signals.length === 0) {
    return <p className="text-gray-500 text-sm">No signal data available</p>;
  }

  return (
    <div className="space-y-3">
      {signals.map((signal, index) => {
        const isUnavailable = signal.unavailable === true;
        const isActive = signal.active && !isUnavailable;
        
        return (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              darkMode ? 'bg-white/5' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  isUnavailable ? 'bg-gray-600' : 
                  isActive ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className={`text-sm font-medium ${
                  isUnavailable ? 'text-gray-600' :
                  isActive ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'
                }`}>
                  {signal.name}
                </span>
                {isUnavailable && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-500">
                    Data N/A
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{signal.weight}pts</span>
                {isActive && <span className="text-green-500 text-xs">✓</span>}
              </div>
            </div>
            {showDescriptions && SIGNAL_DESCRIPTIONS[signal.name] && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {SIGNAL_DESCRIPTIONS[signal.name]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const MarketCapReliability = ({ reliability, darkMode }) => {
  if (!reliability) return null;

  const colors = {
    green: darkMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700',
    blue: darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: darkMode ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: darkMode ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700',
    red: darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
  };

  return (
    <div className={`border rounded-xl p-4 ${colors[reliability.color] || colors.gray}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{reliability.tier.replace(/_/g, ' ')}</span>
        <span className="text-xs opacity-75">{reliability.confidence}</span>
      </div>
      <p className="text-xs opacity-90">{reliability.description}</p>
    </div>
  );
};

export const BuyRecommendation = ({ recommendation, darkMode }) => {
  if (!recommendation) return null;

  const colors = {
    STRONG_BUY: darkMode ? 'bg-green-500/20 border-green-500' : 'bg-green-50 border-green-500',
    BUY: darkMode ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-50 border-blue-500',
    CONSIDER: darkMode ? 'bg-yellow-500/20 border-yellow-500' : 'bg-yellow-50 border-yellow-500',
    WAIT: darkMode ? 'bg-gray-500/20 border-gray-500' : 'bg-gray-50 border-gray-500'
  };

  return (
    <div className={`border-2 rounded-xl p-4 ${colors[recommendation.action] || colors.WAIT}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{recommendation.emoji}</span>
        <div>
          <h3 className="font-bold text-lg">{recommendation.action.replace(/_/g, ' ')}</h3>
          <p className="text-xs opacity-75">Confidence: {recommendation.confidence}</p>
        </div>
      </div>
      <p className="text-sm mt-2">{recommendation.message}</p>
    </div>
  );
};

export const TechnicalIndicators = ({ analysis, darkMode }) => {
  if (!analysis) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {analysis.sma50 && (
        <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3`}>
          <p className="text-xs text-gray-500 mb-1">50 SMA</p>
          <p className="text-sm font-bold">{formatPrice(analysis.sma50)}</p>
          <p className={`text-xs mt-1 ${analysis.signals?.aboveSMA ? 'text-green-400' : 'text-red-400'}`}>
            {analysis.signals?.aboveSMA ? '↑ Above' : '↓ Below'}
          </p>
        </div>
      )}
      
      {analysis.bollingerBands && (
        <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3`}>
          <p className="text-xs text-gray-500 mb-1">Bollinger Bands</p>
          <p className="text-xs">Upper: {formatPrice(analysis.bollingerBands.upper)}</p>
          <p className="text-xs">Lower: {formatPrice(analysis.bollingerBands.lower)}</p>
          <p className={`text-xs mt-1 ${analysis.signals?.belowBB ? 'text-orange-400' : 'text-gray-500'}`}>
            {analysis.signals?.belowBB ? '⚠️ Below Lower' : '✓ In Range'}
          </p>
        </div>
      )}
      
      {analysis.volumeRatio && (
        <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3`}>
          <p className="text-xs text-gray-500 mb-1">Volume Ratio</p>
          <p className="text-sm font-bold">{analysis.volumeRatio.toFixed(2)}x</p>
          <p className={`text-xs mt-1 ${analysis.signals?.volumeSpike ? 'text-green-400' : 'text-gray-500'}`}>
            {analysis.signals?.volumeSpike ? '🔥 High Volume' : '✓ Normal'}
          </p>
        </div>
      )}
      
      {analysis.divergence && (
        <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3`}>
          <p className="text-xs text-gray-500 mb-1">Divergence</p>
          <p className="text-sm font-bold">
            {analysis.divergence.bullish ? 'Bullish 🟢' : analysis.divergence.bearish ? 'Bearish 🔴' : 'None'}
          </p>
          <p className="text-xs mt-1 text-gray-500">
            {analysis.divergence.bullish ? 'Reversal likely' : 'No signal'}
          </p>
        </div>
      )}
      
      {/* Add Funding Rate Display */}
      {analysis.fundingRate !== undefined && analysis.fundingRate !== null && (
        <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3`}>
          <p className="text-xs text-gray-500 mb-1">Funding Rate</p>
          <p className={`text-sm font-bold ${analysis.fundingRate < 0 ? 'text-green-400' : analysis.fundingRate > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {(analysis.fundingRate * 100).toFixed(4)}%
          </p>
          <p className={`text-xs mt-1 ${analysis.fundingRate < 0 ? 'text-green-400' : 'text-gray-500'}`}>
            {analysis.fundingRate < 0 ? '💰 Shorts Pay Longs' : analysis.fundingRate > 0 ? '⚠️ Longs Pay Shorts' : 'Neutral'}
          </p>
        </div>
      )}
    </div>
  );
};

export const FullSignalAnalysis = ({ analysis, darkMode }) => {
  if (!analysis) {
    return (
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6 text-center`}>
        <p className="text-gray-500">Loading signal analysis...</p>
      </div>
    );
  }

  // Get the unified score
  const score = analysis.score || 0;
  const signalDetails = analysis.signalScoreDetails || analysis.signalDetails || {};
  const activeSignals = signalDetails.activeSignals || [];
  const signalPairs = signalDetails.signalPairs || [];
  const bullishTotal = signalDetails.bullishTotal || 0;
  const bearishTotal = signalDetails.bearishTotal || 0;
  
  // Determine the label and color based on score
  let label, bgClass, textClass, dotClass;
  if (score >= 50) {
    label = 'STRONG BUY';
    bgClass = darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-300';
    textClass = 'text-green-500';
    dotClass = 'bg-green-500';
  } else if (score >= 25) {
    label = 'BUY';
    bgClass = darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300';
    textClass = 'text-emerald-500';
    dotClass = 'bg-emerald-500';
  } else if (score > -25) {
    label = 'NEUTRAL';
    bgClass = darkMode ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-50 border-gray-300';
    textClass = 'text-gray-500';
    dotClass = 'bg-gray-400';
  } else if (score > -50) {
    label = 'SELL';
    bgClass = darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-300';
    textClass = 'text-orange-500';
    dotClass = 'bg-orange-500';
  } else {
    label = 'STRONG SELL';
    bgClass = darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300';
    textClass = 'text-red-500';
    dotClass = 'bg-red-500';
  }

  // Separate bullish and bearish signals
  const bullishSignals = activeSignals.filter(s => s.points > 0);
  const bearishSignals = activeSignals.filter(s => s.points < 0);

  return (
    <div className="space-y-4">
      {/* Unified Score Display */}
      <div className={`${bgClass} border rounded-xl p-4 sm:p-6`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
          {/* Score Circle */}
          <div className="flex flex-col items-center shrink-0">
            <UnifiedScoreCircle score={score} />
            <p className="text-xs text-gray-500 mt-2">
              {activeSignals.length} signals active
            </p>
          </div>
          
          {/* Label and Description */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${dotClass}`}></span>
              <span className={`text-xl sm:text-2xl font-bold ${textClass}`}>{label}</span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {score >= 50 && 'Multiple bullish signals aligned. High conviction setup.'}
              {score >= 25 && score < 50 && 'Moderate bullish signals present. Consider entry with proper risk management.'}
              {score > -25 && score < 25 && 'Mixed or weak signals. Wait for clearer setup or trade with caution.'}
              {score > -50 && score <= -25 && 'Moderate bearish signals present. Consider reducing exposure.'}
              {score <= -50 && 'Multiple bearish signals aligned. High conviction sell setup.'}
            </p>
            <div className="flex gap-4 mt-3 text-xs justify-center sm:justify-start">
              <span className="text-green-500">▲ +{bullishTotal} bullish</span>
              <span className="text-red-500">▼ -{bearishTotal} bearish</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Cap Reliability */}
      {analysis.reliability && (
        <MarketCapReliability reliability={analysis.reliability} darkMode={darkMode} />
      )}

      {/* Signal Pairs - Symmetrical Display */}
      {signalPairs && signalPairs.length > 0 && (
        <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-4 sm:p-6`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              <h3 className="font-semibold text-sm sm:text-base">Signal Analysis</h3>
            </div>
            <div className="text-xs text-gray-500">
              Max ±100 per side
            </div>
          </div>
          
          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_80px_1fr] sm:grid-cols-[1fr_100px_1fr] gap-1 sm:gap-2 mb-3 px-1">
            <div className="text-[10px] sm:text-xs font-semibold text-green-500 text-center">BULLISH</div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-500 text-center">SIGNAL</div>
            <div className="text-[10px] sm:text-xs font-semibold text-red-500 text-center">BEARISH</div>
          </div>
          
          {/* Signal Pairs */}
          <div className="space-y-2">
            {signalPairs.map((pair, index) => (
              <div 
                key={index}
                className={`grid grid-cols-[1fr_80px_1fr] sm:grid-cols-[1fr_100px_1fr] gap-1 sm:gap-2 items-center p-1.5 sm:p-2 rounded-lg ${
                  darkMode ? 'bg-white/5' : 'bg-gray-50'
                }`}
              >
                {/* Bullish Side */}
                <div className={`flex items-center justify-between p-2 rounded-md text-xs transition-all ${
                  pair.bullish?.active 
                    ? (darkMode ? 'bg-green-500/25 border border-green-500/50' : 'bg-green-100 border border-green-400')
                    : pair.unavailable
                    ? (darkMode ? 'bg-white/5 opacity-40' : 'bg-gray-100 opacity-50')
                    : (darkMode ? 'bg-white/5 border border-transparent' : 'bg-white border border-gray-200')
                }`}>
                  <span className={`truncate ${
                    pair.bullish?.active 
                      ? 'text-green-400 font-semibold' 
                      : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {pair.bullish?.label || '—'}
                  </span>
                  <span className={`ml-2 ${
                    pair.bullish?.active ? 'font-bold text-green-400' : 'font-normal text-gray-600/40'
                  }`}>
                    {pair.bullish?.active ? `+${Math.round(pair.bullish.points)}` : `+${pair.bullish?.weight || 0}`}
                  </span>
                </div>
                
                {/* Center - Signal Name */}
                <div className={`text-center text-xs font-medium px-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {pair.name}
                </div>
                
                {/* Bearish Side */}
                <div className={`flex items-center justify-between p-2 rounded-md text-xs transition-all ${
                  pair.bearish?.active 
                    ? (darkMode ? 'bg-red-500/25 border border-red-500/50' : 'bg-red-100 border border-red-400')
                    : pair.unavailable
                    ? (darkMode ? 'bg-white/5 opacity-40' : 'bg-gray-100 opacity-50')
                    : (darkMode ? 'bg-white/5 border border-transparent' : 'bg-white border border-gray-200')
                }`}>
                  <span className={`mr-2 ${
                    pair.bearish?.active ? 'font-bold text-red-400' : 'font-normal text-gray-600/40'
                  }`}>
                    {pair.bearish?.active ? `-${Math.round(pair.bearish.points)}` : `-${pair.bearish?.weight || 0}`}
                  </span>
                  <span className={`truncate text-right ${
                    pair.bearish?.active 
                      ? 'text-red-400 font-semibold' 
                      : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {pair.bearish?.label || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Score Summary Bar */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-green-500 font-medium">+{bullishTotal}</span>
              <span className={`font-bold ${
                score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-gray-400'
              }`}>
                Net: {score > 0 ? '+' : ''}{score}
              </span>
              <span className="text-red-500 font-medium">-{bearishTotal}</span>
            </div>
            <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500 z-10"></div>
              {/* Score indicator */}
              <div 
                className={`absolute top-0 bottom-0 transition-all ${
                  score >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  left: score >= 0 ? '50%' : `${50 + (score / 2)}%`,
                  width: `${Math.abs(score) / 2}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 text-gray-500">
              <span>-100</span>
              <span>0</span>
              <span>+100</span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: Legacy Active Signals (if no pairs available) */}
      {(!signalPairs || signalPairs.length === 0) && activeSignals.length > 0 && (
        <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="font-semibold">Active Signals</h3>
            <span className="text-xs text-gray-500 ml-auto">Contributing to score</span>
          </div>
          <div className="space-y-2">
            {activeSignals.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).map((signal, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  signal.points > 0 
                    ? (darkMode ? 'bg-green-500/10' : 'bg-green-50')
                    : (darkMode ? 'bg-red-500/10' : 'bg-red-50')
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${signal.points > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {signal.name}
                  </span>
                  {signal.value !== undefined && (
                    <span className="text-xs text-gray-500">
                      ({typeof signal.value === 'number' ? signal.value.toFixed(2) : signal.value})
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${signal.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {signal.points > 0 ? '+' : ''}{signal.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Indicators */}
      {(analysis.sma50 || analysis.bollingerBands || analysis.volumeRatio || analysis.divergence) && (
        <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
          <h3 className="font-semibold mb-4">Technical Indicators</h3>
          <TechnicalIndicators analysis={analysis} darkMode={darkMode} />
        </div>
      )}
      
      {/* Data Source Info */}
      {analysis.dataSource && (
        <div className={`${darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-sm">ℹ️</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-500 mb-1">Data Source Information</p>
              <p className={`text-xs ${darkMode ? 'text-blue-400/80' : 'text-blue-700'}`}>
                {analysis.dataSource === 'bybit' && 
                  `Using Bybit real-time data (${analysis.dataPoints} data points). All signals available with highest accuracy including funding rates.`}
                {analysis.dataSource === 'okx' && 
                  `Using OKX real-time data (${analysis.dataPoints} data points). All signals available including funding rates.`}
                {analysis.dataSource === 'coingecko' && 
                  `Using CoinGecko historical data (${analysis.dataPoints} data points). Most signals available - funding rate unavailable (requires futures market).`}
                {analysis.dataSource === 'sparkline' && 
                  `Using limited 7-day data (${analysis.dataPoints} points). Some signals unavailable - needs longer historical data for SMA calculations.`}
                {analysis.dataSource === 'fallback' && 
                  'Using minimal data. Signal analysis is limited. Consider checking back later for updated data.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Unified Score Circle (-100 to +100)
const UnifiedScoreCircle = ({ score }) => {
  const safeScore = score || 0;
  
  // Map -100 to +100 to 0-100 for the circle fill
  const normalizedScore = (safeScore + 100) / 2;

  const getColor = (s) => {
    if (s >= 50) return 'text-green-400';
    if (s >= 25) return 'text-emerald-400';
    if (s > -25) return 'text-gray-400';
    if (s > -50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStroke = (s) => {
    if (s >= 50) return '#22c55e';
    if (s >= 25) return '#10b981';
    if (s > -25) return '#9ca3af';
    if (s > -50) return '#f97316';
    return '#ef4444';
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={getStroke(safeScore)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${getColor(safeScore)}`}>
          {safeScore >= 0 ? '+' : ''}{Math.round(safeScore)}
        </span>
      </div>
    </div>
  );
};

// Legacy Sell Score Circle (kept for any remaining references)
const SellScoreCircle = ({ score }) => {
  const safeScore = score || 0;

  const getColor = (s) => {
    if (s >= 75) return 'text-red-400';
    if (s >= 60) return 'text-orange-400';
    if (s >= 45) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStroke = (s) => {
    if (s >= 75) return '#ef4444';
    if (s >= 60) return '#f97316';
    if (s >= 45) return '#eab308';
    return '#9ca3af';
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
        <circle
          cx="48" cy="48" r={radius}
          stroke={getStroke(safeScore)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${getColor(safeScore)}`}>{Math.round(safeScore)}</span>
      </div>
    </div>
  );
};

// Enhanced signals list with descriptions
const SignalsListEnhanced = ({ signals, darkMode, descriptions, type = 'buy' }) => {
  if (!signals || signals.length === 0) {
    return <p className="text-gray-500 text-sm">No signal data available</p>;
  }

  const activeColor = type === 'buy' ? 'bg-green-500' : 'bg-red-500';
  const activeTextColor = type === 'buy' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-3">
      {signals.map((signal, index) => {
        const isUnavailable = signal.unavailable === true;
        const isActive = signal.active && !isUnavailable;
        
        return (
          <div
            key={index}
            className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  isUnavailable ? 'bg-gray-600' : 
                  isActive ? activeColor : 'bg-gray-500'
                }`} />
                <span className={`text-sm font-medium ${
                  isUnavailable ? 'text-gray-600' :
                  isActive ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'
                }`}>
                  {signal.name}
                </span>
                {isUnavailable && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-500">
                    Data N/A
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{signal.weight}pts</span>
                {isActive && <span className={`${activeTextColor} text-xs`}>✓</span>}
              </div>
            </div>
            {descriptions[signal.name] && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {descriptions[signal.name]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Build buy signals array from analysis
const buildBuySignals = (analysis) => {
  const signals = [];
  const s = analysis.signals || {};
  
  // RSI Oversold (20 pts + bonus)
  const rsiOversold = analysis.rsi !== null && analysis.rsi < 30;
  const rsiExtreme = analysis.rsi !== null && analysis.rsi < 25;
  const rsiWeight = rsiExtreme ? 30 : (rsiOversold ? 25 : 25); // 25 base, +5 for extreme = 30
  signals.push({
    name: rsiExtreme ? 'RSI Oversold (Extreme)' : 'RSI Oversold',
    weight: rsiWeight,
    active: rsiOversold,
    unavailable: analysis.rsi === null
  });
  
  // Above SMA50 (30 pts)
  signals.push({
    name: 'Above 50 SMA',
    weight: 30,
    active: s.aboveSMA50 === true,
    unavailable: s.aboveSMA50 === null
  });
  
  // Below BB (15 pts)
  signals.push({
    name: 'Below BB Lower',
    weight: 15,
    active: s.belowBB === true,
    unavailable: s.belowBB === null
  });
  
  // Volume Spike (15 pts)
  signals.push({
    name: 'Volume Spike',
    weight: 15,
    active: s.volumeSpike === true,
    unavailable: s.volumeSpike === null
  });
  
  // Bullish Divergence (10 pts)
  signals.push({
    name: 'Bullish Divergence',
    weight: 10,
    active: s.bullishDivergence === true,
    unavailable: s.bullishDivergence === null
  });
  
  // Negative Funding (15 pts)
  signals.push({
    name: 'Negative Funding',
    weight: 15,
    active: s.negativeFunding === true,
    unavailable: s.negativeFunding === null && s.hasFunding !== true
  });
  
  // Bullish Engulfing (10 pts)
  signals.push({
    name: 'Bullish Engulfing',
    weight: 10,
    active: s.bullishEngulfing === true,
    unavailable: s.bullishEngulfing === null
  });
  
  return signals;
};

// Build sell signals array from analysis
const buildSellSignals = (analysis) => {
  const signals = [];
  const s = analysis.signals || {};
  
  // RSI Overbought (20 pts + bonus)
  const rsiOverbought = analysis.rsi !== null && analysis.rsi > 70;
  const rsiExtreme = analysis.rsi !== null && analysis.rsi > 80;
  const rsiWeight = rsiExtreme ? 30 : (rsiOverbought ? 20 : 20);
  signals.push({
    name: rsiExtreme ? 'RSI Overbought (Extreme)' : 'RSI Overbought',
    weight: rsiWeight,
    active: rsiOverbought,
    unavailable: analysis.rsi === null
  });
  
  // Below SMA50 (15 pts)
  signals.push({
    name: 'Below 50 SMA',
    weight: 15,
    active: s.belowSMA50 === true,
    unavailable: s.belowSMA50 === null
  });
  
  // Below SMA20 (10 pts)
  signals.push({
    name: 'Below 20 SMA',
    weight: 10,
    active: s.belowSMA20 === true,
    unavailable: s.belowSMA20 === null
  });
  
  // Above BB (15 pts)
  signals.push({
    name: 'Above BB Upper',
    weight: 15,
    active: s.aboveBB === true,
    unavailable: s.aboveBB === null
  });
  
  // Positive Funding (10 pts)
  signals.push({
    name: 'Positive Funding',
    weight: 10,
    active: s.positiveFunding === true,
    unavailable: s.positiveFunding === null && s.hasFunding !== true
  });
  
  // Bearish Divergence (15 pts)
  signals.push({
    name: 'Bearish Divergence',
    weight: 15,
    active: s.bearishDivergence === true,
    unavailable: s.bearishDivergence === null
  });
  
  // Bearish Engulfing (10 pts)
  signals.push({
    name: 'Bearish Engulfing',
    weight: 10,
    active: s.bearishEngulfing === true,
    unavailable: s.bearishEngulfing === null
  });
  
  // Near ATH (10 pts)
  signals.push({
    name: 'Near ATH',
    weight: 10,
    active: s.nearATH === true,
    unavailable: s.nearATH === null
  });
  
  // High Vol/MCap (5 pts)
  signals.push({
    name: 'High Vol/MCap',
    weight: 5,
    active: s.highVolMcap === true,
    unavailable: s.highVolMcap === null
  });
  
  return signals;
};

// Sell Recommendation component
const SellRecommendation = ({ recommendation, darkMode }) => {
  if (!recommendation) return null;

  const colors = {
    STRONG_SELL: darkMode ? 'bg-red-500/20 border-red-500' : 'bg-red-50 border-red-500',
    SELL: darkMode ? 'bg-orange-500/20 border-orange-500' : 'bg-orange-50 border-orange-500',
    CONSIDER_SELLING: darkMode ? 'bg-yellow-500/20 border-yellow-500' : 'bg-yellow-50 border-yellow-500',
    HOLD: darkMode ? 'bg-gray-500/20 border-gray-500' : 'bg-gray-50 border-gray-500'
  };

  return (
    <div className={`border-2 rounded-xl p-4 ${colors[recommendation.action] || colors.HOLD}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{recommendation.emoji}</span>
        <div>
          <h3 className="font-bold text-base">{recommendation.action.replace(/_/g, ' ')}</h3>
          <p className="text-xs opacity-75">Confidence: {recommendation.confidence}</p>
        </div>
      </div>
      <p className="text-xs mt-1">{recommendation.message}</p>
    </div>
  );
};

// Helper to get sell recommendation
const getSellRecommendation = (analysis) => {
  if (!analysis) return null;

  const sellScore = analysis.signalScoreDetails?.sellScore || analysis.signalDetails?.sellScore || analysis.sellScore || 0;
  const { reliability } = analysis;
  
  let adjustedScore = sellScore;
  
  if (reliability) {
    switch (reliability.tier) {
      case 'HIGHLY_RELIABLE': break;
      case 'RELIABLE': adjustedScore *= 0.95; break;
      case 'MODERATELY_RELIABLE': adjustedScore *= 0.85; break;
      case 'UNRELIABLE': adjustedScore *= 0.70; break;
      case 'HIGHLY_UNRELIABLE': adjustedScore *= 0.50; break;
    }
  }
  
  if (adjustedScore >= 75) {
    return {
      action: 'STRONG_SELL',
      emoji: '🔴',
      confidence: 'Very High',
      message: 'Multiple sell signals active - consider taking profits'
    };
  } else if (adjustedScore >= 60) {
    return {
      action: 'SELL',
      emoji: '🟠',
      confidence: 'High',
      message: 'Sell signals present - review your position'
    };
  } else if (adjustedScore >= 45) {
    return {
      action: 'CONSIDER_SELLING',
      emoji: '🟡',
      confidence: 'Moderate',
      message: 'Some warning signs - monitor closely'
    };
  } else {
    return {
      action: 'HOLD',
      emoji: '⚪',
      confidence: 'Low',
      message: 'Few sell signals - no immediate action needed'
    };
  }
};

// Helper to get recommendation
const getBuyRecommendation = (analysis) => {
  if (!analysis) return null;

  const { score, reliability } = analysis;
  
  let adjustedScore = score || 0;
  
  if (reliability) {
    switch (reliability.tier) {
      case 'HIGHLY_RELIABLE':
        break;
      case 'RELIABLE':
        adjustedScore *= 0.95;
        break;
      case 'MODERATELY_RELIABLE':
        adjustedScore *= 0.85;
        break;
      case 'UNRELIABLE':
        adjustedScore *= 0.70;
        break;
      case 'HIGHLY_UNRELIABLE':
        adjustedScore *= 0.50;
        break;
    }
  }
  
  if (adjustedScore >= 75) {
    return {
      action: 'STRONG_BUY',
      emoji: '🟢',
      confidence: 'Very High',
      message: 'Excellent buying opportunity with multiple confirmations'
    };
  } else if (adjustedScore >= 60) {
    return {
      action: 'BUY',
      emoji: '🔵',
      confidence: 'High',
      message: 'Good buying opportunity with solid confirmations'
    };
  } else if (adjustedScore >= 45) {
    return {
      action: 'CONSIDER',
      emoji: '🟡',
      confidence: 'Moderate',
      message: 'Potential opportunity, but wait for more confirmation'
    };
  } else {
    return {
      action: 'WAIT',
      emoji: '⚪',
      confidence: 'Low',
      message: 'Insufficient signals - better opportunities available'
    };
  }
};
