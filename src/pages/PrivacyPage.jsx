// ==================================================
// FILE: src/pages/PrivacyPage.jsx
// ==================================================

import { ThemeToggle } from '../components/ThemeToggle';

export const PrivacyPage = ({ onBack, darkMode, setDarkMode }) => (
  <div
    className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
    }`}
  >
    {darkMode && (
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-green-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />
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
      <h1 className="text-4xl font-black mb-2">
        <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          Privacy Policy
        </span>
      </h1>
      <p className={`text-sm mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div
        className={`${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        } border rounded-2xl p-8 mb-8 space-y-6`}
      >
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            We collect the following types of information:
          </p>
          <div className="space-y-3">
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Account Information
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                When you sign in with Google, we collect your name, email address, and profile
                picture provided by Google OAuth.
              </p>
            </div>
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Usage Data
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                We collect information about how you interact with our service, including watchlist
                data, filters used, and preferences.
              </p>
            </div>
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Technical Data
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                We may collect browser type, device information, IP address, and other technical
                information for service improvement.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
          <ul
            className={`list-disc list-inside space-y-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <li>To provide and maintain our service</li>
            <li>To manage your watchlists and preferences</li>
            <li>To improve and personalize your experience</li>
            <li>To communicate with you about service updates</li>
            <li>To ensure security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Data Storage</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            Your watchlist and preferences are stored locally in your browser's localStorage. We do
            not store your trading decisions or financial information on our servers. Your Google
            account information is only used for authentication purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Third-Party Services</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            We use the following third-party services:
          </p>
          <ul
            className={`list-disc list-inside space-y-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <li>
              <strong>Google OAuth:</strong> For secure authentication
            </li>
            <li>
              <strong>CoinGecko API:</strong> For cryptocurrency market data
            </li>
          </ul>
          <p className={`mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            These services have their own privacy policies governing the use of your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">5. Cookies and Local Storage</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            We use browser localStorage to save your preferences, theme settings, and watchlist
            data. This data remains on your device and is not transmitted to our servers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">6. Data Security</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            We implement reasonable security measures to protect your information. However, no
            method of transmission over the Internet is 100% secure, and we cannot guarantee
            absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">7. Your Rights</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            You have the right to:
          </p>
          <ul
            className={`list-disc list-inside space-y-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt-out of certain data collection practices</li>
            <li>Export your watchlist data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">8. Children's Privacy</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            Our service is not intended for users under the age of 18. We do not knowingly collect
            information from children under 18. If you believe we have collected such information,
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">9. Changes to Privacy Policy</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">10. Contact Us</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            If you have any questions about this Privacy Policy or how we handle your data, please
            contact us through our support channels.
          </p>
        </section>
      </div>

      <footer
        className={`text-center py-8 border-t ${
          darkMode ? 'border-white/10' : 'border-gray-200'
        }`}
      >
        <p className="text-gray-500 text-sm">© 2025 Oversold.crypto. Your privacy matters to us.</p>
      </footer>
    </div>
  </div>
);
