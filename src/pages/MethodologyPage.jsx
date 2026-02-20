// ==================================================
// FILE: src/pages/MethodologyPage.jsx
// ==================================================

import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';

// Reusable section card
const Section = ({ children, darkMode, className = '' }) => (
  <div
    className={`${
      darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
    } border rounded-2xl p-4 sm:p-8 mb-8 ${className}`}
  >
    {children}
  </div>
);

// Reusable signal card
const SignalCard = ({ darkMode, color, title, points, children }) => {
  const dotColors = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    cyan: 'bg-cyan-500',
    pink: 'bg-pink-500',
  };
  return (
    <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${dotColors[color] || 'bg-gray-500'}`}></span>
          {title}
        </h3>
        <span className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{points}</span>
      </div>
      <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {children}
      </div>
    </div>
  );
};

// Formula block
const Formula = ({ darkMode, children, note }) => (
  <div className={`${darkMode ? 'bg-black/40' : 'bg-gray-100'} rounded-xl p-5 font-mono text-sm mb-3`}>
    <div className={darkMode ? 'text-gray-300' : 'text-gray-800'}>{children}</div>
    {note && (
      <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{note}</div>
    )}
  </div>
);

// Callout / info box
const Callout = ({ darkMode, type = 'warning', icon, title, children }) => {
  const styles = {
    warning: darkMode
      ? 'bg-yellow-500/10 border-yellow-500/30'
      : 'bg-yellow-50 border-yellow-200',
    info: darkMode
      ? 'bg-blue-500/10 border-blue-500/30'
      : 'bg-blue-50 border-blue-200',
    gradient: darkMode
      ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20'
      : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200',
  };
  const titleColors = {
    warning: darkMode ? 'text-yellow-400' : 'text-yellow-700',
    info: darkMode ? 'text-blue-400' : 'text-blue-700',
    gradient: darkMode ? 'text-orange-400' : 'text-orange-700',
  };
  return (
    <div className={`mt-6 p-5 rounded-xl border ${styles[type]}`}>
      <div className="flex gap-3">
        {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}
        <div>
          {title && <h4 className={`font-semibold mb-1 ${titleColors[type]}`}>{title}</h4>}
          <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export const MethodologyPage = ({ onBack, darkMode, setDarkMode }) => (
  <div
    className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
    }`}
  >
    {darkMode && (
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>
    )}
    <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${
            darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          } transition-colors`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>

      {/* Title */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-5xl font-black mb-3">
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Methodology
          </span>
        </h1>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          How we calculate signals, score momentum, and analyze cryptocurrency markets
        </p>
      </div>

      {/* ============================================================ */}
      {/* OVERVIEW CARDS */}
      {/* ============================================================ */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div
          className={`${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3">10 Signal Categories</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            RSI, SMA50 trend, Bollinger Bands, funding rates, divergence, engulfing patterns, price
            position, volume, MACD, and Stochastic RSI — each scored on a graduated scale for both bullish and bearish signals.
          </p>
        </div>

        <div
          className={`${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Multi-Source Data</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Market data from CoinGecko for 1,000 tokens, enhanced with hourly candlestick and funding
            rate data from Bybit and OKX for the top 250 tokens. Refreshed every 60 seconds.
          </p>
        </div>

        <div
          className={`${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Graduated Scoring</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Unified momentum score from −100 (max bearish) to +100 (max bullish).
            Signal strength scales with indicator intensity — not just binary on/off.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RSI CALCULATION */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">Understanding RSI</h2>

        <div className="mb-8">
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            What is RSI?
          </h3>
          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            The Relative Strength Index (RSI) is a momentum oscillator developed by J. Welles Wilder
            in 1978. It measures the speed and magnitude of price movements on a scale from 0 to 100,
            helping traders identify potential overbought or oversold conditions in the market.
          </p>
        </div>

        <div className="mb-8">
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            The Formula
          </h3>
          <Formula darkMode={darkMode} note="Where RS = Average Gain / Average Loss over 14 periods">
            RSI = 100 − (100 / (1 + RS))
          </Formula>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            We use the standard 14-period RSI as recommended by Wilder. The first average is a simple
            mean; subsequent periods use an exponentially-weighted (Wilder) smoothing formula that gives
            more weight to recent data.
          </p>
        </div>

        <div className="mb-8">
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            Step-by-Step Calculation
          </h3>
          <ol className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {[
              'Calculate price changes for each period (Close − Previous Close)',
              'Separate gains (positive changes) and losses (negative changes)',
              'Calculate the first Average Gain: Sum of Gains over 14 periods / 14',
              'Calculate the first Average Loss: Sum of Losses over 14 periods / 14',
              'For subsequent periods, use Wilder smoothing:',
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full ${
                    darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                  } flex items-center justify-center text-sm font-bold`}
                >
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <Formula darkMode={darkMode}>
            <div>Avg Gain = [(Prev Avg Gain) × 13 + Current Gain] / 14</div>
            <div className="mt-1">Avg Loss = [(Prev Avg Loss) × 13 + Current Loss] / 14</div>
          </Formula>
        </div>
      </Section>

      {/* RSI Interpretation */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-3xl font-bold mb-6">Interpreting RSI Values</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`${darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <h3 className="font-bold text-lg text-red-500">Extreme Oversold (RSI &lt; 20)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Extremely oversold conditions. The asset has experienced severe selling pressure. These
              readings often precede sharp rebounds, but can also signal serious fundamental issues —
              always do additional research.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <h3 className="font-bold text-lg text-orange-500">Oversold (RSI &lt; 30)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Indicates the asset may be undervalued. Selling pressure has been dominant, potentially
              creating buying opportunities. Consider researching for potential entry points.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <h3 className="font-bold text-lg text-gray-500">Neutral (RSI 30–70)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              The asset is in neutral territory with balanced buying and selling pressure. No extreme
              conditions detected. Watch for trends developing toward either extreme.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h3 className="font-bold text-lg text-green-500">Overbought (RSI &gt; 70)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Indicates the asset may be overvalued. Buying pressure has been dominant. Consider
              taking profits or waiting for a pullback before entering new positions.
            </p>
          </div>
        </div>

        <Callout darkMode={darkMode} type="info" icon="ℹ️" title="RSI 30 vs 25: Two Different Thresholds">
          Traditional technical analysis considers RSI below 30 as "oversold." Our signal scoring
          system uses a stricter threshold of 25 before awarding bullish points, requiring deeper
          oversold conditions for higher conviction. The dashboard filter buttons follow the scoring
          thresholds (Oversold = RSI &lt; 25, Extreme = RSI &lt; 20), while the educational
          descriptions above use the standard TA definitions.
        </Callout>
      </div>

      {/* ============================================================ */}
      {/* GRADUATED SIGNAL SCORING SYSTEM */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-2">⚖️ Unified Momentum Score</h2>
        <p className={`mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Our signal system produces a single score from <strong>−100</strong> (max bearish) to{' '}
          <strong>+100</strong> (max bullish). Each of the 10 signal categories has both a bullish and a
          bearish side. Points are graduated — they scale with the intensity of the signal rather than
          using simple on/off thresholds.
        </p>

        <Formula darkMode={darkMode} note="Bullish signals add points; bearish signals subtract points. Clamped to [−100, +100].">
          Score = Σ (bullish points) − Σ (bearish points)
        </Formula>

        {/* Weight overview table */}
        <div className={`rounded-xl overflow-hidden border mb-8 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={darkMode ? 'bg-white/5' : 'bg-gray-50'}>
                <th className="text-left px-4 py-3 font-semibold">Signal</th>
                <th className={`text-center px-4 py-3 font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Bullish</th>
                <th className={`text-center px-4 py-3 font-semibold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Bearish</th>
                <th className="text-center px-4 py-3 font-semibold">Max Pts</th>
                <th className="text-center px-4 py-3 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
              {[
                { name: 'RSI Level', bull: 'Oversold (< 25)', bear: 'Overbought (> 75)', pts: '10–35', type: 'Graduated' },
                { name: 'Trend (SMA50)', bull: 'Price above SMA50', bear: 'Price below SMA50', pts: '5–20', type: 'Graduated' },
                { name: 'Bollinger Bands', bull: 'Below lower band', bear: 'Above upper band', pts: '5–15', type: 'Graduated' },
                { name: 'Funding Rate', bull: 'Negative (< −0.005%)', bear: 'Positive (> 0.01%)', pts: '5–15', type: 'Graduated' },
                { name: 'RSI Divergence', bull: 'Bullish divergence', bear: 'Bearish divergence', pts: '15', type: 'Binary' },
                { name: 'Candlestick', bull: 'Bullish engulfing', bear: 'Bearish engulfing', pts: '10', type: 'Binary' },
                { name: 'Price Position', bull: 'Near ATL (≤ 50%)', bear: 'Near ATH (≤ 10%)', pts: '3–10', type: 'Graduated' },
                { name: 'Volume', bull: 'Accumulation', bear: 'Distribution', pts: '3–10', type: 'Graduated' },
                { name: 'MACD', bull: 'Bullish crossover', bear: 'Bearish crossover', pts: '8', type: 'Binary' },
                { name: 'Stochastic RSI', bull: 'Oversold (K < 20)', bear: 'Overbought (K > 80)', pts: '4–8', type: 'Graduated' },
              ].map((row, i) => (
                <tr key={i} className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-2.5 font-medium">{row.name}</td>
                  <td className={`px-4 py-2.5 text-center text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{row.bull}</td>
                  <td className={`px-4 py-2.5 text-center text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{row.bear}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs">{row.pts}</td>
                  <td className={`px-4 py-2.5 text-center text-xs ${row.type === 'Graduated' ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signal details */}
        <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
          Signal Details
        </h3>
        <div className="space-y-6">
          {/* 1. RSI Level */}
          <SignalCard darkMode={darkMode} color="red" title="1. RSI Level" points="±10 to ±35 pts">
            <p className="mb-2">
              <strong>Bullish:</strong> RSI below 25 earns 10 pts at the threshold, scaling to 35 pts
              at RSI ≤ 5. Labels: <em>Oversold</em> (20–25), <em>Very Oversold</em> (15–20),{' '}
              <em>Extreme Oversold</em> (&lt; 15).
            </p>
            <p className="mb-2">
              <strong>Bearish:</strong> RSI above 75 earns 10 pts at the threshold, scaling to 35 pts
              at RSI ≥ 95. Labels: <em>Overbought</em> (75–80), <em>Very Overbought</em> (80–85),{' '}
              <em>Extreme Overbought</em> (&gt; 85).
            </p>
            <Formula darkMode={darkMode}>
              <div>{'strength = (25 − RSI) / 20   // 0 at RSI 25, 1 at RSI 5'}</div>
              <div>points = lerp(10, 35, strength)</div>
            </Formula>
            <p>
              <strong>Why it matters:</strong> RSI below 30 indicates the asset may be undervalued.
              The deeper the oversold reading, the more extreme the selling exhaustion — and the
              stronger the potential for a reversal. The same logic applies in reverse for overbought
              conditions above 70.
            </p>
          </SignalCard>

          {/* 2. SMA50 Trend */}
          <SignalCard darkMode={darkMode} color="blue" title="2. Trend — SMA50" points="±5 to ±20 pts">
            <p className="mb-2">
              <strong>Bullish:</strong> Price above the 50-period Simple Moving Average earns 5 pts at
              the threshold, scaling to 20 pts when ≥ 10% above.
            </p>
            <p className="mb-2">
              <strong>Bearish:</strong> Price below SMA50 follows the same graduated scale.
            </p>
            <Formula darkMode={darkMode}>
              <div>{'pctFromSMA = ((price − SMA50) / SMA50) × 100'}</div>
              <div>{'strength = |pctFromSMA| / 10'}</div>
              <div>points = lerp(5, 20, strength)</div>
            </Formula>
            <p>
              <strong>Why it matters:</strong> The 50 SMA acts as a dynamic support/resistance level
              and trend indicator. Buying oversold dips in uptrends has significantly higher success
              rates than buying in downtrends. The further price is from the SMA, the stronger the
              trend conviction.
            </p>
          </SignalCard>

          {/* 3. Bollinger Bands */}
          <SignalCard darkMode={darkMode} color="purple" title="3. Bollinger Bands" points="±5 to ±15 pts">
            <p className="mb-2">
              <strong>Parameters:</strong> 20-period SMA, 2 standard deviations.
            </p>
            <p className="mb-2">
              <strong>Bullish:</strong> Price below the lower band earns 5–15 pts, scaled by how far
              below (up to 20% of band width for max score).
            </p>
            <p className="mb-2">
              <strong>Bearish:</strong> Price above the upper band follows the same graduated scale.
            </p>
            <Formula darkMode={darkMode}>
              <div>Upper = SMA20 + 2 × σ</div>
              <div>Lower = SMA20 − 2 × σ</div>
              <div className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>σ = population standard deviation of last 20 prices</div>
            </Formula>
            <p>
              <strong>Why it matters:</strong> Bollinger Bands contain approximately 95% of price
              action. When price moves outside the bands, it is statistically unusual and often
              indicates an extreme that will revert to the mean.
            </p>
          </SignalCard>

          {/* 4. Funding Rate */}
          <SignalCard darkMode={darkMode} color="cyan" title="4. Funding Rate" points="±5 to ±15 pts">
            <p className="mb-2">
              <strong>Bullish:</strong> Negative funding rate below −0.005% earns 5–15 pts, scaling
              with magnitude up to −0.05%.
            </p>
            <p className="mb-2">
              <strong>Bearish:</strong> Positive funding rate above 0.01% earns 5–15 pts, scaling up
              to 0.05%.
            </p>
            <p className="mb-2">
              <strong>Source:</strong> Perpetual futures funding rates from Bybit or OKX. Only
              available for the top 250 tokens that are listed on these exchanges.
            </p>
            <p>
              <strong>Why it matters:</strong> Funding rates reflect derivatives market sentiment.
              Negative funding means shorts are paying longs — indicating heavy bearish positioning
              that often marks local bottoms as over-leveraged shorts get squeezed. The reverse
              signals crowded longs.
            </p>
          </SignalCard>

          {/* 5. RSI Divergence */}
          <SignalCard darkMode={darkMode} color="green" title="5. RSI Divergence" points="±15 pts (binary)">
            <p className="mb-2">
              <strong>Bullish divergence:</strong> Price makes a lower low, but RSI makes a higher low.
              Detected by finding local extremes over a 20-bar lookback window using 2-bar-either-side
              pivot points.
            </p>
            <p className="mb-2">
              <strong>Bearish divergence:</strong> Price makes a higher high, but RSI makes a lower
              high.
            </p>
            <p>
              <strong>Why it matters:</strong> Divergence between price and momentum is one of the
              most powerful reversal signals. When price makes new extremes but RSI does not confirm,
              it indicates the trend is losing steam.
            </p>
          </SignalCard>

          {/* 6. Engulfing Patterns */}
          <SignalCard darkMode={darkMode} color="orange" title="6. Engulfing Candlestick Patterns" points="±10 pts (binary)">
            <p className="mb-2">
              <strong>Bullish engulfing:</strong> The previous candle is red (close &lt; open), the
              current candle is green (close &gt; open), the current candle's body completely engulfs
              the previous candle's body, and the current body is larger.
            </p>
            <p className="mb-2">
              <strong>Bearish engulfing:</strong> The mirror pattern — a red candle engulfing a green
              candle.
            </p>
            <p className="mb-2">
              <strong>Data:</strong> Requires OHLC (open-high-low-close) candlestick data from Bybit
              or OKX. Only available for enhanced tokens (top 250).
            </p>
            <p>
              <strong>Why it matters:</strong> Engulfing patterns represent a decisive shift in
              sentiment within a single period, where buyers overwhelm sellers (or vice versa) with
              enough conviction to completely reverse the prior bar's range.
            </p>
          </SignalCard>

          {/* 7. Price Position */}
          <SignalCard darkMode={darkMode} color="pink" title="7. Price Position — ATL / ATH" points="±3 to ±10 pts">
            <p className="mb-2">
              <strong>Bullish (Near ATL):</strong> Price within 50% of the all-time low earns 3–10
              pts. The closer to ATL, the higher the score (max at ≤ 2% from ATL).
            </p>
            <p className="mb-2">
              <strong>Bearish (Near ATH):</strong> Price within 10% of the all-time high (based on
              available data window) earns 3–10 pts, scaling similarly.
            </p>
            <p>
              <strong>Why it matters:</strong> All-time lows often serve as major support zones with
              historical buying interest, while all-time highs act as resistance where profit-taking
              accelerates.
            </p>
          </SignalCard>

          {/* 8. Volume */}
          <SignalCard darkMode={darkMode} color="yellow" title="8. Volume Analysis" points="±3 to ±10 pts">
            <p className="mb-2">
              <strong>Trigger:</strong> Current volume exceeds 1.5× the 20-period average.
            </p>
            <p className="mb-2">
              <strong>Accumulation (bullish):</strong> Volume spike when RSI &lt; 35 — smart money may
              be buying the dip. Score scales from 3 pts at 1.5× to 10 pts at 4×.
            </p>
            <p className="mb-2">
              <strong>Distribution (bearish):</strong> Volume spike when RSI &gt; 65 — large holders
              may be selling into strength. Same graduated scale.
            </p>
            <p>
              <strong>Why it matters:</strong> High volume during extreme RSI conditions can indicate
              capitulation selling (creating a bottom) or heavy accumulation by informed participants.
              Either way, unusual volume often marks significant turning points.
            </p>
          </SignalCard>

          {/* 9. MACD */}
          <SignalCard darkMode={darkMode} color="cyan" title="9. MACD (Moving Average Convergence Divergence)" points="±8 pts (binary)">
            <p className="mb-2">
              <strong>Parameters:</strong> Fast EMA 12, Slow EMA 26, Signal EMA 9 (standard settings).
            </p>
            <p className="mb-2">
              <strong>Bullish:</strong> MACD line crosses above the signal line (+8 pts). This indicates
              short-term momentum is accelerating faster than longer-term momentum.
            </p>
            <p className="mb-2">
              <strong>Bearish:</strong> MACD line crosses below the signal line (−8 pts). This indicates
              momentum is decelerating.
            </p>
            <Formula darkMode={darkMode}>
              <div>MACD Line = EMA(12) − EMA(26)</div>
              <div>Signal Line = EMA(9) of MACD Line</div>
              <div>Histogram = MACD Line − Signal Line</div>
            </Formula>
            <p>
              <strong>Why it matters:</strong> MACD crossovers are among the most widely followed
              momentum signals. A bullish cross after a period of negative histogram suggests buyers
              are regaining control. The signal is binary (on/off) because the crossover itself is
              the event — its strength is already reflected in other indicators like RSI and trend.
            </p>
          </SignalCard>

          {/* 10. Stochastic RSI */}
          <SignalCard darkMode={darkMode} color="purple" title="10. Stochastic RSI" points="±4 to ±8 pts">
            <p className="mb-2">
              <strong>Parameters:</strong> RSI period 14, Stochastic period 14, K smoothing 3, D smoothing 3.
            </p>
            <p className="mb-2">
              <strong>Bullish:</strong> StochRSI K below 20 (oversold) earns 4–8 pts, graduating by depth.
              A K/D bullish crossover (K crosses above D) outside of oversold territory earns a bonus of 4 pts.
            </p>
            <p className="mb-2">
              <strong>Bearish:</strong> StochRSI K above 80 (overbought) earns 4–8 pts, with the same
              graduated scale. A K/D bearish crossover outside overbought adds 4 pts.
            </p>
            <Formula darkMode={darkMode}>
              <div>StochRSI = (RSI − RSI_Low) / (RSI_High − RSI_Low)</div>
              <div>K = SMA(3) of StochRSI × 100</div>
              <div>D = SMA(3) of K</div>
              <div className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                RSI_Low and RSI_High are the lowest and highest RSI values over the lookback period
              </div>
            </Formula>
            <p>
              <strong>Why it matters:</strong> Stochastic RSI applies stochastic oscillator math to
              RSI values rather than price, making it more sensitive to momentum shifts than RSI alone.
              It cycles between 0–100 more frequently, catching overbought/oversold conditions that
              standard RSI misses — especially useful when RSI is in the 30–70 neutral range.
            </p>
          </SignalCard>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* SCORE INTERPRETATION */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">📈 Interpreting Signal Scores</h2>

        <div className="grid md:grid-cols-5 gap-4 mb-6">
          {[
            { range: '+50 to +100', label: 'STRONG BUY', color: 'text-green-500', desc: 'Multiple bullish signals aligned. High conviction setup.' },
            { range: '+25 to +49', label: 'BUY', color: 'text-emerald-500', desc: 'Moderate bullish signals. Consider entry with proper risk management.' },
            { range: '−24 to +24', label: 'NEUTRAL', color: 'text-gray-400', desc: 'Mixed or weak signals. Wait for a clearer setup.' },
            { range: '−49 to −25', label: 'SELL', color: 'text-orange-500', desc: 'Moderate bearish signals. Consider reducing exposure.' },
            { range: '−100 to −50', label: 'STRONG SELL', color: 'text-red-500', desc: 'Multiple bearish signals aligned. High conviction sell.' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className={`text-xl font-bold ${item.color}`}>{item.range}</div>
              <div className={`text-sm font-semibold mt-1 ${item.color}`}>{item.label}</div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div className={`relative h-4 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-red-600 to-red-400 opacity-60" />
          <div className="absolute left-1/4 top-0 bottom-0 w-1/4 bg-gradient-to-r from-orange-500 to-yellow-400 opacity-40" />
          <div className="absolute left-1/2 top-0 bottom-0 w-1/4 bg-gradient-to-r from-emerald-400 to-green-400 opacity-40" />
          <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-green-400 to-green-600 opacity-60" />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 z-10" />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <span>−100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* MARKET CAP RELIABILITY */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">🛡️ Market Cap Reliability</h2>
        <p className={`mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Signal scores are adjusted based on market capitalization because technical analysis is more
          reliable for liquid, large-cap assets. The adjustment multiplies the raw score before
          determining the final recommendation label.
        </p>

        <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={darkMode ? 'bg-white/5' : 'bg-gray-50'}>
                <th className="text-left px-4 py-3 font-semibold">Tier</th>
                <th className="text-left px-4 py-3 font-semibold">Market Cap</th>
                <th className="text-center px-4 py-3 font-semibold">Score Multiplier</th>
                <th className="text-left px-4 py-3 font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
              <tr className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-green-500">HIGHLY RELIABLE</td>
                <td className="px-4 py-2.5">&gt; $10 B</td>
                <td className="px-4 py-2.5 text-center font-mono">100%</td>
                <td className="px-4 py-2.5">HIGH</td>
              </tr>
              <tr className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-blue-500">RELIABLE</td>
                <td className="px-4 py-2.5">$1 B – $10 B</td>
                <td className="px-4 py-2.5 text-center font-mono">95%</td>
                <td className="px-4 py-2.5">GOOD</td>
              </tr>
              <tr className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-yellow-500">MODERATELY RELIABLE</td>
                <td className="px-4 py-2.5">$200 M – $1 B</td>
                <td className="px-4 py-2.5 text-center font-mono">85%</td>
                <td className="px-4 py-2.5">MODERATE</td>
              </tr>
              <tr className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-orange-500">UNRELIABLE</td>
                <td className="px-4 py-2.5">$50 M – $200 M</td>
                <td className="px-4 py-2.5 text-center font-mono">70%</td>
                <td className="px-4 py-2.5">LOW</td>
              </tr>
              <tr className={darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-red-500">HIGHLY UNRELIABLE</td>
                <td className="px-4 py-2.5">&lt; $50 M</td>
                <td className="px-4 py-2.5 text-center font-mono">50%</td>
                <td className="px-4 py-2.5">VERY LOW</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout darkMode={darkMode} type="warning" icon="⚠️" title="Small-Cap Warning">
          Micro-cap tokens (&lt; $50 M) may show technical signals, but they are generally unreliable
          due to low liquidity, thin order books, and higher manipulation risk. Scores for these tokens
          are halved automatically.
        </Callout>
      </Section>

      {/* ============================================================ */}
      {/* STABLECOIN FILTERING */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">🚫 Stablecoin Filtering</h2>
        <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Stablecoins are excluded from all analysis and rankings because technical analysis
          does not meaningfully apply to price-pegged assets. The detection uses a multi-layered
          approach:
        </p>
        <div className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
          <p>
            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>1. ID Allowlist:</strong>{' '}
            A curated list of 150+ known stablecoin CoinGecko IDs covering USD, EUR, GBP, JPY, BRL,
            and other fiat-pegged tokens, gold-backed tokens, yield-bearing stables, and tokenized
            real-world assets.
          </p>
          <p>
            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>2. Symbol Detection:</strong>{' '}
            Known stablecoin symbols (USDT, USDC, DAI, BUSD, TUSD, FRAX, PYUSD, EURC, etc.) are
            matched by pattern.
          </p>
          <p>
            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>3. Name Pattern Matching:</strong>{' '}
            Tokens with names containing keywords like "stablecoin", "dollar", "tether", "pegged",
            "USD", etc. are flagged.
          </p>
          <p>
            <strong className={darkMode ? 'text-white' : 'text-gray-900'}>4. Price-Based Detection:</strong>{' '}
            Tokens trading between $0.98–$1.02 with less than 0.5% daily and 1% weekly volatility are
            classified as stablecoins even if they do not match name patterns.
          </p>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* TOKEN CATEGORIES */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">🏷️ Token Categories</h2>
        <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Each token is classified into one of six categories based on its CoinGecko ID, name, and
          symbol using keyword matching and curated allowlists. You can filter the dashboard by
          category.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: '⛓️', name: 'L1/L2', desc: 'Layer 1 and Layer 2 blockchains (BTC, ETH, SOL, etc.)' },
            { icon: '🦄', name: 'DeFi', desc: 'Decentralized finance protocols (LINK, UNI, AAVE, etc.)' },
            { icon: '🐸', name: 'Meme', desc: 'Meme and community tokens (DOGE, SHIB, PEPE, etc.)' },
            { icon: '🎮', name: 'Gaming', desc: 'Gaming and metaverse tokens (SAND, AXS, GALA, etc.)' },
            { icon: '🤖', name: 'AI', desc: 'AI and compute tokens (RNDR, FET, TAO, etc.)' },
            { icon: '💱', name: 'Exchange', desc: 'Exchange tokens (BNB, CRO, OKB, etc.)' },
          ].map((cat, i) => (
            <div key={i} className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="font-bold text-sm mb-1">{cat.name}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{cat.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* DASHBOARD FILTERS */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">🎯 Dashboard Filters</h2>
        <p className={`mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          The main table can be filtered using four rows of combinable signal filters. Multiple
          filters can be active simultaneously — tokens must match <strong>all</strong> selected
          filters.
        </p>

        <div className="space-y-4">
          {[
            {
              group: 'RSI',
              color: 'purple',
              filters: [
                'Extreme (RSI < 20)',
                'Oversold (RSI < 25)',
                'Neutral (RSI 25–75)',
                'Overbought (RSI > 75)',
                'Extreme OB (RSI > 80)',
              ],
            },
            {
              group: 'MOVERS',
              color: 'blue',
              filters: ['24h Losers', '7d Losers', '24h Gainers', '7d Gainers'],
            },
            {
              group: 'BUY',
              color: 'green',
              filters: [
                'Uptrend (above SMA50)',
                'Below lower Bollinger Band',
                'Negative Funding',
                'Bullish Divergence',
                'Bullish Engulfing',
                'Near ATL (within 50%)',
                'Volume Spike (> 1.5× avg)',
                'MACD Bullish Cross',
                'StochRSI Oversold (K < 20)',
                'StochRSI Bullish Cross (K > D)',
              ],
            },
            {
              group: 'SELL',
              color: 'red',
              filters: [
                'Downtrend (below SMA50)',
                'Above upper Bollinger Band',
                'Positive Funding',
                'Bearish Divergence',
                'Bearish Engulfing',
                'Near ATH (within 10%)',
                'High Vol/MCap (> 10%)',
                'MACD Bearish Cross',
                'StochRSI Overbought (K > 80)',
                'StochRSI Bearish Cross (K < D)',
              ],
            },
          ].map((row, i) => (
            <div key={i} className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
              <span className={`inline-block text-xs font-bold px-2 py-1 rounded mb-2 ${
                row.color === 'purple' ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600') :
                row.color === 'blue' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600') :
                row.color === 'green' ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600') :
                (darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600')
              }`}>
                {row.group}
              </span>
              <div className="flex flex-wrap gap-2">
                {row.filters.map((f, j) => (
                  <span key={j} className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Callout darkMode={darkMode} type="info" icon="ℹ️" title="Enhanced vs Basic Tokens">
          Buy and sell signal filters that require exchange data (SMA50, Bollinger Bands, funding
          rate, divergence, engulfing patterns, volume spike, MACD, and Stochastic RSI) are only available for the top 250
          tokens. These filters are grayed out when using the basic API.
          Tokens ranked 251–1,000 still receive RSI, price position, and high vol/mcap signals
          calculated from CoinGecko sparkline data.
        </Callout>
      </Section>

      {/* ============================================================ */}
      {/* MAIN TABLE COLUMNS */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">📋 Main Table Columns</h2>
        <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          The dashboard table displays the following data for each token, all of which are sortable
          by clicking the column header:
        </p>
        <div className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
          {[
            { col: 'Token', desc: 'Rank, icon, name, symbol, and category tag. Rank is by market cap from CoinGecko.' },
            { col: 'Price', desc: 'Current USD price with adaptive decimal formatting (0–10 decimals based on magnitude).' },
            { col: 'Volume', desc: '24-hour trading volume in USD, formatted with K/M/B/T suffixes.' },
            { col: 'MCap', desc: 'Market capitalization in USD with K/M/B/T suffixes.' },
            { col: '24H', desc: '24-hour price change percentage. Green for positive, red for negative.' },
            { col: '7D', desc: '7-day price change percentage.' },
            { col: 'Signal', desc: 'Unified momentum score (−100 to +100) with color-coded label (STRONG BUY through STRONG SELL). Shows number of active signals on hover.' },
            { col: '7D Chart', desc: "Sparkline chart from CoinGecko's 7-day hourly price data, color-coded by performance." },
            { col: 'Actions', desc: 'Add/remove from watchlist (requires Google sign-in) and navigate to token detail page.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className={`font-semibold flex-shrink-0 w-20 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.col}</span>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* TOKEN DETAIL PAGE */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">🔍 Token Detail Page</h2>
        <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Clicking any token opens a detailed analysis view with several sections:
        </p>

        <div className="space-y-4">
          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">Price Chart with Timeframes</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Interactive price chart with 24H, 7D, 1M, 3M, 1Y, and Max timeframes. Short
              timeframes use CoinGecko sparkline data; longer timeframes fetch historical data via a
              proxy API. Displays price change for the selected period.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">RSI Threshold Analysis</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A historical backtest visualization that shows what would have happened if you bought
              whenever RSI crossed below a configurable threshold and sold when it crossed above. Supports both
              oversold and overbought modes with adjustable thresholds and multiple time windows
              (1M, 3M, 6M, 1Y, 2Y, All). Includes an interactive brush zoom and crosshair tooltips.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">Full Signal Analysis</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Complete breakdown of all 10 signal categories in a symmetrical bullish vs bearish
              layout. Shows each signal pair with its active state, point contribution, and a visual
              score summary bar. Also displays the market cap reliability tier and overall
              recommendation. Technical indicator values (SMA50, SMA20, Bollinger Bands, Volume Ratio,
              Divergence, Funding Rate) are shown when available.
            </p>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* DATA SOURCES & LIMITATIONS */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">Data Sources & Technical Details</h2>

        <div className="space-y-5">
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Data Providers
            </h3>
            <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="mb-3">
                <strong className={darkMode ? 'text-orange-400' : 'text-orange-600'}>CoinGecko API:</strong>{' '}
                Primary source for market data including prices, market caps, 24h volume, 1h/24h/7d/30d
                price changes, all-time high/low, circulating supply, and 7-day hourly sparkline data
                for the top 1,000 tokens by market capitalization. Used for RSI calculation and
                fallback Bollinger Band and SMA calculations for tokens ranked 251–1,000.
              </p>
              <p className="mb-3">
                <strong className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>Bybit API:</strong>{' '}
                Secondary source for the top 250 tokens. Provides 200 hourly candlestick bars (OHLCV)
                and perpetual futures funding rates. Used for SMA50, SMA20, Bollinger Bands, volume
                ratio, RSI divergence, and engulfing pattern calculations.
              </p>
              <p>
                <strong className={darkMode ? 'text-blue-400' : 'text-blue-600'}>OKX API:</strong>{' '}
                Tertiary source used as fallback when Bybit data is unavailable. Provides the same
                hourly candlestick and funding rate data for tokens listed on OKX perpetual futures.
              </p>
            </div>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Enhancement Tiers
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <strong>Top 250 tokens</strong> are "enhanced" with exchange data from Bybit/OKX,
              providing all 10 signal categories. <strong>Tokens 251–1,000</strong> use CoinGecko
              sparkline data for SMA/BB calculations as a fallback, with funding rate, divergence,
              engulfing, and volume spike signals marked as unavailable. This tiering balances data
              quality with API rate limits.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Update Frequency
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Data is refreshed automatically every 60 seconds. Server-side responses are cached for
              60 seconds with a 5-minute stale-while-revalidate window to balance freshness with
              performance.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              RSI Period
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              We use the standard 14-period RSI with Wilder smoothing as recommended by J. Welles
              Wilder, the original creator of the indicator. For the main table, RSI is computed from
              CoinGecko's 7-day hourly sparkline (up to 168 data points). For the detail page, RSI is
              recalculated from exchange 1-hour klines when available.
            </p>
          </div>

          <Callout darkMode={darkMode} type="warning" icon="⚠️" title="Important Disclaimer">
            <p className="mb-2">
              Signal scores are tools for research, not financial advice. They should not be used in
              isolation for trading decisions. Always combine technical signals with fundamental
              analysis and proper risk management.
            </p>
            <p>
              Past performance does not guarantee future results. Cryptocurrency markets are highly
              volatile, and even strong signals can fail. Never invest more than you can afford to
              lose.
            </p>
          </Callout>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* MARKET SENTIMENT WIDGET */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">🌡️ Market Sentiment Widget</h2>
        <p className={`mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          The dashboard header displays a real-time market sentiment gauge that combines two data sources
          to give an at-a-glance view of overall crypto market conditions.
        </p>

        <div className="space-y-5">
          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">Internal RSI Sentiment Score</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Calculated from the average RSI of all tracked tokens, mapped directly to a 0–100 scale.
              The gauge needle and color reflect the current market-wide momentum: red (Extremely Weak)
              when average RSI is very low, through neutral gray, to green (Extremely Strong) when average
              RSI is high. The RSI distribution is shown as clickable breakdown cards (Extreme, Oversold,
              Neutral, Overbought) that also act as quick filters for the main table.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">External Fear & Greed Index</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Fetched from the Alternative.me Crypto Fear & Greed Index API. This widely-followed index
              aggregates volatility, market momentum/volume, social media sentiment, Bitcoin dominance,
              and Google Trends data into a single 0–100 score. It is displayed alongside the internal
              RSI score for comparison — when both indicators agree, conviction is higher.
            </p>
          </div>
        </div>

        <Callout darkMode={darkMode} type="info" icon="ℹ️" title="Two Perspectives">
          The internal RSI score reflects current technical conditions across all tracked tokens,
          while the Fear & Greed Index captures broader market psychology. Divergence between the two
          (e.g., RSI showing weak conditions while Fear & Greed shows greed) can itself be an
          informative signal worth investigating.
        </Callout>
      </Section>

      {/* ============================================================ */}
      {/* ADDITIONAL FEATURES */}
      {/* ============================================================ */}
      <Section darkMode={darkMode}>
        <h2 className="text-xl sm:text-3xl font-bold mb-6">✨ Additional Features</h2>
        <div className="space-y-4">
          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">⭐ Personal Watchlist</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in with Google to save tokens to a personal watchlist that persists across
              sessions. Watchlist data is stored in the browser's local storage tied to your Google
              account ID. You can export your watchlist to CSV for further analysis.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">🔍 Search</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Full-text search across token names, symbols, and CoinGecko IDs. Results update
              instantly as you type.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">📊 CSV Export</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Export the currently filtered and sorted table data to CSV format, including all
              displayed columns (rank, symbol, name, price, market cap, volume, 24h/7d change, RSI,
              signal score, and signal label).
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">🌓 Dark / Light Mode</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Toggle between dark and light themes. Your preference is saved in local storage and
              persists across visits.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">🔧 Low-Volume Filter</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              An optional toggle to hide tokens with volume below $1M, helping you focus on
              liquid assets where technical signals are more meaningful.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">⌨️ Keyboard Shortcuts</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Power-user shortcuts for faster navigation: <strong>/</strong> to focus search,{' '}
              <strong>W</strong> to toggle the watchlist view, <strong>S</strong> to save the current
              token to your watchlist, <strong>?</strong> to open the shortcuts reference modal, and
              more. Press <strong>?</strong> at any time to see all available shortcuts.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">🔗 Shareable Filter URLs</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active filters are automatically serialized into the URL hash (e.g.,{' '}
              <code className={`text-xs px-1 py-0.5 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                #/?rsi=extreme&signals=bullish_divergence
              </code>). This means your current filter setup survives page refreshes and can be
              bookmarked or shared with others.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-5`}>
            <h3 className="font-bold mb-2">⬆️ Back to Top</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A floating button appears after scrolling down in the token table, providing quick
              one-click navigation back to the dashboard filters and sentiment widget.
            </p>
          </div>
        </div>
      </Section>

      <Footer darkMode={darkMode} />
    </div>
  </div>
);
