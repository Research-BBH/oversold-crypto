// ==================================================
// FILE: src/pages/TermsPage.jsx
// ==================================================

import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';

export const TermsPage = ({ onBack, darkMode, setDarkMode }) => (
  <div
    className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
    }`}
  >
    {darkMode && (
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>
    )}
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
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
      <h1 className="text-2xl sm:text-4xl font-black mb-2">
        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Terms of Service
        </span>
      </h1>
      <p className={`text-sm mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div
        className={`${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        } border rounded-2xl p-4 sm:p-8 mb-8 space-y-6`}
      >
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            By accessing and using Oversold.crypto, you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to these terms, please do not use
            this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. Description of Service</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            Oversold.crypto provides cryptocurrency market analysis tools, including RSI (Relative
            Strength Index) calculations, price tracking, and portfolio watchlist features. All data
            is provided for informational and educational purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Not Financial Advice</h2>
          <div
            className={`${
              darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
            } border rounded-xl p-4 mb-4`}
          >
            <p className={`font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
              ⚠️ Important Disclaimer
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
              Nothing on this platform constitutes financial, investment, legal, or tax advice. All
              content is for educational and informational purposes only. Always conduct your own
              research and consult with qualified financial advisors before making investment
              decisions.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Data Accuracy</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            While we strive to provide accurate and up-to-date information, we make no warranties
            about the completeness, reliability, or accuracy of the data. Cryptocurrency markets are
            highly volatile and data may be delayed or incorrect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">5. User Accounts</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            When you create an account using Google Sign-In, you are responsible for maintaining the
            security of your account. You agree to accept responsibility for all activities that
            occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">6. Prohibited Uses</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            You may not use our service to:
          </p>
          <ul
            className={`list-disc list-inside space-y-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <li>Engage in any illegal activities</li>
            <li>Manipulate or attempt to manipulate market data</li>
            <li>Scrape or harvest data without permission</li>
            <li>Interfere with the proper working of the service</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">7. Intellectual Property</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            All content, features, and functionality of Oversold.crypto are owned by us and are
            protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">8. Limitation of Liability</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            Oversold.crypto and its operators shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use of or inability to
            use the service, including but not limited to investment losses.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">9. Changes to Terms</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            We reserve the right to modify these terms at any time. Continued use of the service
            after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">10. Contact</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            If you have any questions about these Terms of Service, please contact us through our
            support channels.
          </p>
        </section>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  </div>
);
