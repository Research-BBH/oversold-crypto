// ==================================================
// FILE: src/components/Footer.jsx - Shared Footer Component
// ==================================================

export const Footer = ({ darkMode }) => (
  <footer
    className={`text-center py-8 mt-10 border-t ${
      darkMode ? 'border-white/10' : 'border-gray-200'
    }`}
  >
    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
      Nothing on this site is financial advice. For educational purposes only.
    </p>
    <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
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
      <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>|</span>
      <a
        href="#/methodology"
        className={`${
          darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
        } transition-colors`}
      >
        Methodology
      </a>
    </div>
    <p className={`text-xs mt-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
      Market data from CoinGecko • Funding rates from Bybit & OKX • RSI (14)
    </p>
    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>
      © {new Date().getFullYear()} Oversold.crypto
    </p>
  </footer>
);
