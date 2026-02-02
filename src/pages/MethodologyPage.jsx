// ==================================================
// FILE: src/pages/MethodologyPage.jsx
// ==================================================

import { ThemeToggle } from '../components/ThemeToggle';

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

      <div className="mb-12">
        <h1 className="text-5xl font-black mb-3">
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Methodology
          </span>
        </h1>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          How we calculate RSI and analyze cryptocurrency markets
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div
          className={`${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3">RSI Analysis</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            We calculate the 14-period RSI for the top 1000 cryptocurrencies to identify oversold
            and overbought conditions.
          </p>
        </div>

        <div
          className={`${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Real-Time Data</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Data is refreshed every minute from CoinGecko's API, providing you with up-to-date price
            movements and market cap information for accurate analysis.
          </p>
        </div>

        <div
          className={`${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Personal Watchlist</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in with Google to save tickers to your personal watchlist. Track your favorite
            cryptocurrencies and export to CSV format for further analysis.
          </p>
        </div>
      </div>

      <div
        className={`${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        } border rounded-2xl p-8 mb-8`}
      >
        <h2 className="text-3xl font-bold mb-6">Understanding RSI Calculation</h2>

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
          <div
            className={`${
              darkMode ? 'bg-black/40' : 'bg-gray-100'
            } rounded-xl p-5 font-mono text-sm mb-3`}
          >
            <div className={darkMode ? 'text-gray-300' : 'text-gray-800'}>
              RSI = 100 - (100 / (1 + RS))
            </div>
            <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Where RS = Average Gain / Average Loss over 14 periods
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The calculation involves comparing the average gains to average losses over a 14-day
            period. This smoothed ratio is then normalized to create a value between 0 and 100.
          </p>
        </div>

        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            Step-by-Step Calculation
          </h3>
          <ol className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li className="flex gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                } flex items-center justify-center text-sm font-bold`}
              >
                1
              </span>
              <span>Calculate price changes for each period (Close - Previous Close)</span>
            </li>
            <li className="flex gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                } flex items-center justify-center text-sm font-bold`}
              >
                2
              </span>
              <span>Separate gains (positive changes) and losses (negative changes)</span>
            </li>
            <li className="flex gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                } flex items-center justify-center text-sm font-bold`}
              >
                3
              </span>
              <span>Calculate the first Average Gain: Sum of Gains over 14 periods / 14</span>
            </li>
            <li className="flex gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                } flex items-center justify-center text-sm font-bold`}
              >
                4
              </span>
              <span>Calculate the first Average Loss: Sum of Losses over 14 periods / 14</span>
            </li>
            <li className="flex gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                } flex items-center justify-center text-sm font-bold`}
              >
                5
              </span>
              <span>For subsequent periods, use smoothed averages:</span>
            </li>
          </ol>
          <div
            className={`${
              darkMode ? 'bg-black/40' : 'bg-gray-100'
            } rounded-xl p-4 font-mono text-xs mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            <div>Avg Gain = [(Prev Avg Gain) × 13 + Current Gain] / 14</div>
            <div className="mt-1">Avg Loss = [(Prev Avg Loss) × 13 + Current Loss] / 14</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">Interpreting RSI Values</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div
            className={`${
              darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
            } border rounded-2xl p-6`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <h3 className="font-bold text-lg text-red-500">Oversold (RSI &lt; 30)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Indicates the asset may be undervalued. Selling pressure has been dominant, potentially
              creating buying opportunities. Consider researching for potential entry points.
            </p>
          </div>

          <div
            className={`${
              darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
            } border rounded-2xl p-6`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <h3 className="font-bold text-lg text-orange-500">Extreme (RSI &lt; 20)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Extremely oversold conditions. The asset has experienced significant selling pressure.
              These conditions often precede sharp rebounds, but always do additional research.
            </p>
          </div>

          <div
            className={`${
              darkMode ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-50 border-gray-200'
            } border rounded-2xl p-6`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <h3 className="font-bold text-lg text-gray-500">Neutral (RSI 30-70)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              The asset is in neutral territory with balanced buying and selling pressure. No extreme
              conditions detected. Watch for trends developing toward either extreme.
            </p>
          </div>

          <div
            className={`${
              darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
            } border rounded-2xl p-6`}
          >
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
      </div>

      <div
        className={`${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        } border rounded-2xl p-8 mb-8`}
      >
        <h2 className="text-2xl font-bold mb-6">Data Sources & Limitations</h2>

        <div className="space-y-5">
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Data Provider:
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              All market data is sourced from CoinGecko's comprehensive cryptocurrency API, providing
              coverage for the top 1000 tokens by market capitalization.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Update Frequency:
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Data is refreshed automatically every 60 seconds to ensure you have access to near
              real-time market conditions.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              RSI Period:
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              We use the standard 14-period RSI as recommended by J. Welles Wilder, the original
              creator of the indicator.
            </p>
          </div>

          <div
            className={`${
              darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
            } border rounded-xl p-5 mt-6`}
          >
            <div className="flex gap-3">
              <svg
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  darkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p
                  className={`font-semibold text-sm mb-1 ${
                    darkMode ? 'text-yellow-400' : 'text-yellow-700'
                  }`}
                >
                  Important:
                </p>
                <p
                  className={`text-sm leading-relaxed ${
                    darkMode ? 'text-yellow-300' : 'text-yellow-800'
                  }`}
                >
                  RSI is just one indicator among many. It should not be used in isolation for trading
                  decisions. Always combine RSI with other technical indicators, fundamental analysis,
                  and proper risk management. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer
        className={`text-center py-8 border-t ${
          darkMode ? 'border-white/10' : 'border-gray-200'
        }`}
      >
        <p className="text-gray-500 text-sm">
          Nothing on this site is financial advice. For educational purposes only.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm mt-4">
          <a
            href="#/terms"
            className={`${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            } transition-colors`}
          >
            Terms of Service
          </a>
          <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>|</span>
          <a
            href="#/privacy"
            className={`${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            } transition-colors`}
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  </div>
);
