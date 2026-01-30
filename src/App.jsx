import { useState, useEffect, useMemo, useCallback } from 'react';

const ThemeToggle = ({ darkMode, setDarkMode }) => (
  <button
    onClick={() => setDarkMode(!darkMode)}
    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-gray-700' : 'bg-orange-400'}`}
    title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center ${darkMode ? 'left-1 bg-gray-900' : 'left-8 bg-white'}`}>
      {darkMode ? (
        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
      ) : (
        <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>
      )}
    </div>
  </button>
);

const CAT_MAP = {
  bitcoin:'layer-1',ethereum:'layer-1',solana:'layer-1',cardano:'layer-1','avalanche-2':'layer-1',
  polkadot:'layer-1',tron:'layer-1',litecoin:'layer-1',monero:'layer-1',stellar:'layer-1',
  cosmos:'layer-1','near-protocol':'layer-1',algorand:'layer-1',fantom:'layer-1',sui:'layer-1',
  aptos:'layer-1',kaspa:'layer-1',hedera:'layer-1',arbitrum:'layer-1',optimism:'layer-1',
  sei:'layer-1',celestia:'layer-1',injective:'layer-1',mantle:'layer-1',stacks:'layer-1',
  dogecoin:'meme','shiba-inu':'meme',pepe:'meme',floki:'meme',bonk:'meme','dogwifhat':'meme',
  'book-of-meme':'meme',brett:'meme',popcat:'meme',turbo:'meme','mog-coin':'meme',
  chainlink:'defi',uniswap:'defi',aave:'defi',maker:'defi','lido-dao':'defi','curve-dao-token':'defi',
  jupiter:'defi',raydium:'defi',pendle:'defi',thorchain:'defi','the-graph':'defi',
  'render-token':'ai','fetch-ai':'ai',bittensor:'ai',worldcoin:'ai',akash:'ai',
  'ocean-protocol':'ai',singularitynet:'ai',arkham:'ai',
  'the-sandbox':'gaming',decentraland:'gaming','axie-infinity':'gaming',gala:'gaming',
  'immutable-x':'gaming',enjincoin:'gaming',beam:'gaming','super-token':'gaming',
  'bnb':'exchange',cronos:'exchange',okb:'exchange','kucoin-token':'exchange','gate-token':'exchange',
  tether:'stable','usd-coin':'stable',dai:'stable','first-digital-usd':'stable',
};
const getCat = id => CAT_MAP[id] || 'other';

const CATS = [
  {id:'all',name:'All',icon:'🌍'},
  {id:'layer-1',name:'L1/L2',icon:'⛓️'},
  {id:'defi',name:'DeFi',icon:'🦄'},
  {id:'meme',name:'Meme',icon:'🐸'},
  {id:'gaming',name:'Gaming',icon:'🎮'},
  {id:'ai',name:'AI',icon:'🤖'},
];

const PRESETS = [
  {id:'oversold',name:'🔴 Oversold <30',filter:t=>t.rsi!==null&&t.rsi<30,sort:'rsi_asc'},
  {id:'extreme',name:'🚨 Extreme <20',filter:t=>t.rsi!==null&&t.rsi<20,sort:'rsi_asc'},
  {id:'overbought',name:'🟢 Overbought >70',filter:t=>t.rsi!==null&&t.rsi>70,sort:'rsi_desc'},
  {id:'losers24h',name:'📉 24h Losers',filter:()=>true,sort:'change24h_asc'},
  {id:'losers7d',name:'📉 7d Losers',filter:()=>true,sort:'change7d_asc'},
  {id:'gainers',name:'📈 24h Gainers',filter:()=>true,sort:'change24h_desc'},
  {id:'volume',name:'🔥 High Volume',filter:()=>true,sort:'volMcap_desc'},
];

const GOOGLE_CLIENT_ID = '889475479271-64c68ua41no083lq5g82v8pp2cvf9r9k.apps.googleusercontent.com';

const LoginModal = ({ onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const googleButtonRef = useCallback(node => {
    if (node && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(node, { theme: 'filled_black', size: 'large', width: 320, text: 'continue_with', shape: 'rectangular' });
    }
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse, auto_select: false });
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, { theme: 'filled_black', size: 'large', width: 320, text: 'continue_with', shape: 'rectangular' });
        }
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleCredentialResponse = (response) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const user = { id: payload.sub, name: payload.name, email: payload.email, picture: payload.picture };
      localStorage.setItem('oversold_user', JSON.stringify(user));
      onLogin(user);
      onClose();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const isConfigured = GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Sign in to Oversold</h2>
          <p className="text-gray-400">Create a watchlist to track your favorite assets</p>
        </div>
        {!isConfigured ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Setup Required</p>
            <p className="text-gray-400 text-xs">To enable Google Sign-In, configure your GOOGLE_CLIENT_ID.</p>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center py-4"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <div id="google-signin-btn" ref={googleButtonRef} className="flex justify-center"/>
            )}
            {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          </>
        )}
        <p className="text-center text-gray-500 text-sm mt-6">By signing in, you agree to our <a href="#/terms" className="text-orange-400 hover:underline">Terms of Service</a></p>
        <button onClick={onClose} className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
      </div>
    </div>
  );
};

const UserMenu = ({ user, onLogout, watchlistCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all">
        <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full"/>
        <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline">{user.name?.split(' ')[0]}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}/>
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full"/>
                <div className="min-w-0"><p className="font-medium truncate">{user.name}</p><p className="text-xs text-gray-400 truncate">{user.email}</p></div>
              </div>
            </div>
            <a href="#/watchlist" onClick={() => setIsOpen(false)} className="w-full px-4 py-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              My Watchlist {watchlistCount > 0 && <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">{watchlistCount}</span>}
            </a>
            <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full px-4 py-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const TermsPage = ({ onBack, darkMode, setDarkMode }) => (
  <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
    {darkMode && <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]"/>
      <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px]"/>
    </div>}
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className={`flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
      <h1 className="text-4xl font-black mb-2"><span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Terms of Service</span></h1>
      <p className={`text-sm mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-8 mb-8 space-y-6`}>
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>By accessing and using Oversold.crypto, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. Description of Service</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Oversold.crypto provides cryptocurrency market analysis tools, including RSI (Relative Strength Index) calculations, price tracking, and portfolio watchlist features. All data is provided for informational and educational purposes only.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Not Financial Advice</h2>
          <div className={`${darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4 mb-4`}>
            <p className={`font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>⚠️ Important Disclaimer</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Nothing on this platform constitutes financial, investment, legal, or tax advice. All content is for educational and informational purposes only. Always conduct your own research and consult with qualified financial advisors before making investment decisions.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Data Accuracy</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>While we strive to provide accurate and up-to-date information, we make no warranties about the completeness, reliability, or accuracy of the data. Cryptocurrency markets are highly volatile and data may be delayed or incorrect.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">5. User Accounts</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>When you create an account using Google Sign-In, you are responsible for maintaining the security of your account. You agree to accept responsibility for all activities that occur under your account.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">6. Prohibited Uses</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>You may not use our service to:</p>
          <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>Engage in any illegal activities</li>
            <li>Manipulate or attempt to manipulate market data</li>
            <li>Scrape or harvest data without permission</li>
            <li>Interfere with the proper working of the service</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">7. Intellectual Property</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>All content, features, and functionality of Oversold.crypto are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">8. Limitation of Liability</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Oversold.crypto and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, including but not limited to investment losses.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">9. Changes to Terms</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">10. Contact</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>If you have any questions about these Terms of Service, please contact us through our support channels.</p>
        </section>
      </div>

      <footer className={`text-center py-8 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <p className="text-gray-500 text-sm">© 2025 Oversold.crypto. All rights reserved.</p>
      </footer>
    </div>
  </div>
);

const PrivacyPage = ({ onBack, darkMode, setDarkMode }) => (
  <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
    {darkMode && <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-green-600/5 rounded-full blur-[120px]"/>
      <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]"/>
    </div>}
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className={`flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
      <h1 className="text-4xl font-black mb-2"><span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">Privacy Policy</span></h1>
      <p className={`text-sm mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-8 mb-8 space-y-6`}>
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>We collect the following types of information:</p>
          <div className="space-y-3">
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Account Information</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>When you sign in with Google, we collect your name, email address, and profile picture provided by Google OAuth.</p>
            </div>
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Usage Data</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>We collect information about how you interact with our service, including watchlist data, filters used, and preferences.</p>
            </div>
            <div>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Technical Data</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>We may collect browser type, device information, IP address, and other technical information for service improvement.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
          <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>To provide and maintain our service</li>
            <li>To manage your watchlists and preferences</li>
            <li>To improve and personalize your experience</li>
            <li>To communicate with you about service updates</li>
            <li>To ensure security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Data Storage</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Your watchlist and preferences are stored locally in your browser's localStorage. We do not store your trading decisions or financial information on our servers. Your Google account information is only used for authentication purposes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Third-Party Services</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>We use the following third-party services:</p>
          <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li><strong>Google OAuth:</strong> For secure authentication</li>
            <li><strong>CoinGecko API:</strong> For cryptocurrency market data</li>
          </ul>
          <p className={`mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>These services have their own privacy policies governing the use of your information.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">5. Cookies and Local Storage</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>We use browser localStorage to save your preferences, theme settings, and watchlist data. This data remains on your device and is not transmitted to our servers.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">6. Data Security</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">7. Your Rights</h2>
          <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>You have the right to:</p>
          <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt-out of certain data collection practices</li>
            <li>Export your watchlist data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">8. Children's Privacy</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Our service is not intended for users under the age of 18. We do not knowingly collect information from children under 18. If you believe we have collected such information, please contact us immediately.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">9. Changes to Privacy Policy</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">10. Contact Us</h2>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>If you have any questions about this Privacy Policy or how we handle your data, please contact us through our support channels.</p>
        </section>
      </div>

      <footer className={`text-center py-8 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <p className="text-gray-500 text-sm">© 2025 Oversold.crypto. Your privacy matters to us.</p>
      </footer>
    </div>
  </div>
);

const MethodologyPage = ({ onBack, darkMode, setDarkMode }) => (
  <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
    {darkMode && <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]"/>
      <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]"/>
    </div>}
    <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className={`flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
      
      <div className="mb-12">
        <h1 className="text-5xl font-black mb-3">
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Methodology</span>
        </h1>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>How we calculate RSI and analyze cryptocurrency markets</p>
      </div>

      {/* Three Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}>
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">RSI Analysis</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>We calculate the 14-period RSI for the top 1000 cryptocurrencies to identify oversold and overbought conditions.</p>
        </div>

        <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}>
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Real-Time Data</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Data is refreshed every minute from CoinGecko's API, providing you with up-to-date price movements and market cap information for accurate analysis.</p>
        </div>

        <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-6 hover:scale-[1.02] transition-transform`}>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <h3 className="text-xl font-bold mb-3">Personal Watchlist</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sign in with Google to save tickers to your personal watchlist. Track your favorite cryptocurrencies and export to CSV format for further analysis.</p>
        </div>
      </div>

      {/* Understanding RSI Calculation */}
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-8 mb-8`}>
        <h2 className="text-3xl font-bold mb-6">Understanding RSI Calculation</h2>
        
        <div className="mb-8">
          <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>What is RSI?</h3>
          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            The Relative Strength Index (RSI) is a momentum oscillator developed by J. Welles Wilder in 1978. It measures the speed and magnitude of price movements on a scale from 0 to 100, helping traders identify potential overbought or oversold conditions in the market.
          </p>
        </div>

        <div className="mb-8">
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>The Formula</h3>
          <div className={`${darkMode ? 'bg-black/40' : 'bg-gray-100'} rounded-xl p-5 font-mono text-sm mb-3`}>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-800'}>RSI = 100 - (100 / (1 + RS))</div>
            <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>Where RS = Average Gain / Average Loss over 14 periods</div>
          </div>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The calculation involves comparing the average gains to average losses over a 14-day period. This smoothed ratio is then normalized to create a value between 0 and 100.
          </p>
        </div>

        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Step-by-Step Calculation</h3>
          <ol className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} flex items-center justify-center text-sm font-bold`}>1</span>
              <span>Calculate price changes for each period (Close - Previous Close)</span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} flex items-center justify-center text-sm font-bold`}>2</span>
              <span>Separate gains (positive changes) and losses (negative changes)</span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} flex items-center justify-center text-sm font-bold`}>3</span>
              <span>Calculate the first Average Gain: Sum of Gains over 14 periods / 14</span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} flex items-center justify-center text-sm font-bold`}>4</span>
              <span>Calculate the first Average Loss: Sum of Losses over 14 periods / 14</span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-7 h-7 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} flex items-center justify-center text-sm font-bold`}>5</span>
              <span>For subsequent periods, use smoothed averages:</span>
            </li>
          </ol>
          <div className={`${darkMode ? 'bg-black/40' : 'bg-gray-100'} rounded-xl p-4 font-mono text-xs mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div>Avg Gain = [(Prev Avg Gain) × 13 + Current Gain] / 14</div>
            <div className="mt-1">Avg Loss = [(Prev Avg Loss) × 13 + Current Loss] / 14</div>
          </div>
        </div>
      </div>

      {/* Interpreting RSI Values */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">Interpreting RSI Values</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`${darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500"/>
              <h3 className="font-bold text-lg text-red-500">Oversold (RSI &lt; 30)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Indicates the asset may be undervalued. Selling pressure has been dominant, potentially creating buying opportunities. Consider researching for potential entry points.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"/>
              <h3 className="font-bold text-lg text-orange-500">Extreme (RSI &lt; 20)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Extremely oversold conditions. The asset has experienced significant selling pressure. These conditions often precede sharp rebounds, but always do additional research.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-500"/>
              <h3 className="font-bold text-lg text-gray-500">Neutral (RSI 30-70)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              The asset is in neutral territory with balanced buying and selling pressure. No extreme conditions detected. Watch for trends developing toward either extreme.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500"/>
              <h3 className="font-bold text-lg text-green-500">Overbought (RSI &gt; 70)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Indicates the asset may be overvalued. Buying pressure has been dominant. Consider taking profits or waiting for a pullback before entering new positions.
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources & Limitations */}
      <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-8 mb-8`}>
        <h2 className="text-2xl font-bold mb-6">Data Sources & Limitations</h2>
        
        <div className="space-y-5">
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Data Provider:</h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              All market data is sourced from CoinGecko's comprehensive cryptocurrency API, providing coverage for the top 1000 tokens by market capitalization.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Frequency:</h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Data is refreshed automatically every 60 seconds to ensure you have access to near real-time market conditions.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>RSI Period:</h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              We use the standard 14-period RSI as recommended by J. Welles Wilder, the original creator of the indicator.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-5 mt-6`}>
            <div className="flex gap-3">
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <p className={`font-semibold text-sm mb-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Important:</p>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                  RSI is just one indicator among many. It should not be used in isolation for trading decisions. Always combine RSI with other technical indicators, fundamental analysis, and proper risk management. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={`text-center py-8 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <p className="text-gray-500 text-sm">Nothing on this site is financial advice. For educational purposes only.</p>
        <div className="flex items-center justify-center gap-6 text-sm mt-4">
          <a href="#/terms" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>Terms of Service</a>
          <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>|</span>
          <a href="#/privacy" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>Privacy Policy</a>
        </div>
      </div>
    </div>
  </div>
);

const WatchlistPage = ({ tokens, watchlist, onRemove, onBack, user, darkMode, setDarkMode }) => {
  const [sortBy, setSortBy] = useState('rank_asc');
  
  const watchedTokens = useMemo(() => {
    let filtered = tokens.filter(t => watchlist.has(t.id));
    const [field, dir] = sortBy.split('_');
    filtered.sort((a, b) => {
      let va = a[field], vb = b[field];
      if (va === null || va === undefined) va = dir === 'asc' ? Infinity : -Infinity;
      if (vb === null || vb === undefined) vb = dir === 'asc' ? Infinity : -Infinity;
      return dir === 'asc' ? va - vb : vb - va;
    });
    return filtered;
  }, [tokens, watchlist, sortBy]);

  const toggleSort = (field) => {
    setSortBy(prev => {
      const [currentField, currentDir] = prev.split('_');
      if (currentField === field) return `${field}_${currentDir === 'asc' ? 'desc' : 'asc'}`;
      const defaults = { rank: 'asc', price: 'desc', change24h: 'desc', rsi: 'asc' };
      return `${field}_${defaults[field] || 'asc'}`;
    });
  };

  const rsiStyle = (rsi) => {
    if (rsi === null) return { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-500' };
    if (rsi < 20) return { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (rsi < 30) return { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' };
    if (rsi > 70) return { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' };
    return { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-400' };
  };

  const fmtP = (p) => {
    if (p == null) return '--';
    if (p >= 1000) return '$' + p.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    return '$' + p.toFixed(6);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
      {darkMode && <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-yellow-600/5 rounded-full blur-[120px]"/>
        <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]"/>
      </div>}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className={`flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </button>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black">My Watchlist</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{user?.name && <span>Welcome, {user.name.split(' ')[0]}! </span>}{watchedTokens.length} {watchedTokens.length === 1 ? 'token' : 'tokens'} saved</p>
          </div>
        </div>

        {watchedTokens.length === 0 ? (
          <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl p-12 text-center`}>
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-bold mb-2">Your watchlist is empty</h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start adding tokens to track your favorite cryptocurrencies</p>
            <button onClick={onBack} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">Browse Tokens</button>
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-2xl overflow-hidden`}>
            <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'} text-xs text-gray-500 font-semibold uppercase tracking-wider`}>
              <div className={`col-span-4 flex items-center gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => toggleSort('rank')}>
                <span>Token</span>
                <span className={`transition-opacity ${sortBy.startsWith('rank') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'rank_asc' ? '↑' : '↓'}</span>
              </div>
              <div className={`col-span-2 text-right flex items-center justify-end gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => toggleSort('price')}>
                <span>Price</span>
                <span className={`transition-opacity ${sortBy.startsWith('price') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'price_asc' ? '↑' : '↓'}</span>
              </div>
              <div className={`col-span-2 text-right flex items-center justify-end gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => toggleSort('change24h')}>
                <span>24H / 7D</span>
                <span className={`transition-opacity ${sortBy.startsWith('change24h') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'change24h_asc' ? '↑' : '↓'}</span>
              </div>
              <div className={`col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => toggleSort('rsi')}>
                <span>RSI</span>
                <span className={`transition-opacity ${sortBy.startsWith('rsi') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'rsi_asc' ? '↑' : '↓'}</span>
              </div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            <div className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
              {watchedTokens.map(t => {
                const rs = rsiStyle(t.rsi);
                return (
                  <div key={t.id} className={`grid grid-cols-12 gap-4 px-6 py-4 ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'} transition-colors items-center`}>
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                      <span className={`text-xs w-6 text-right ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>#{t.rank}</span>
                      <img src={t.image} alt={t.symbol} className="w-10 h-10 rounded-full bg-gray-800"/>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.symbol}</span>
                          {t.rsi !== null && t.rsi < 25 && <span className="text-xs">🔴</span>}
                          {t.rsi !== null && t.rsi > 75 && <span className="text-xs">🟢</span>}
                        </div>
                        <p className="text-sm text-gray-500">{t.name}</p>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2 text-right font-mono">{fmtP(t.price)}</div>
                    <div className="col-span-4 md:col-span-2 text-right text-sm">
                      <span className={t.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>{t.change24h >= 0 ? '+' : ''}{t.change24h?.toFixed(1)}%</span>
                      <span className={darkMode ? 'text-gray-600' : 'text-gray-400'} > / </span>
                      <span className={t.change7d >= 0 ? 'text-green-500' : 'text-red-500'}>{t.change7d >= 0 ? '+' : ''}{t.change7d?.toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${rs.bg} ${rs.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`}/>
                        <span className="font-bold text-sm">{t.rsi !== null ? t.rsi.toFixed(0) : '--'}</span>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-center gap-2">
                      <a href={`#/token/${t.id}`} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'} transition-colors`} title="View details">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                      <button onClick={(e) => onRemove(t.id, e)} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Remove">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {watchedTokens.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">Avg RSI</p>
              <p className="text-xl font-bold">{(watchedTokens.filter(t => t.rsi !== null).reduce((sum, t) => sum + t.rsi, 0) / watchedTokens.filter(t => t.rsi !== null).length || 0).toFixed(1)}</p>
            </div>
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">Oversold</p>
              <p className="text-xl font-bold text-orange-500">{watchedTokens.filter(t => t.rsi !== null && t.rsi < 30).length}</p>
            </div>
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">Overbought</p>
              <p className="text-xl font-bold text-green-500">{watchedTokens.filter(t => t.rsi !== null && t.rsi > 70).length}</p>
            </div>
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">Avg 24h Change</p>
              <p className={`text-xl font-bold ${(watchedTokens.reduce((sum, t) => sum + (t.change24h || 0), 0) / watchedTokens.length) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {((watchedTokens.reduce((sum, t) => sum + (t.change24h || 0), 0) / watchedTokens.length) || 0).toFixed(2)}%
              </p>
            </div>
          </div>
        )}
        <footer className={`text-center py-8 mt-8 border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}><p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Your watchlist is saved to your account and syncs across devices</p></footer>
      </div>
    </div>
  );
};

const Spark = ({ data, color, h = 24 }) => {
  if (!data?.length || data.length < 2) return <div className="w-20 h-6 bg-gray-800/30 rounded animate-pulse"/>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*80},${h-((v-min)/range)*h}`).join(' ');
  return <svg width={80} height={h}><polyline fill="none" stroke={color} strokeWidth="1.5" points={pts}/></svg>;
};

const DetailChart = ({ data, basePrice, change7d }) => {
  if (!data?.length || data.length < 2) return <div className="w-full h-48 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">No chart data</div>;
  const W = 360, H = 180, PAD = { top: 20, right: 58, bottom: 35, left: 10 };
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom;
  const endPrice = basePrice, startPrice = endPrice / (1 + (change7d || 0) / 100);
  const min = Math.min(...data), max = Math.max(...data);
  const priceMin = startPrice * (min / 100), priceMax = startPrice * (max / 100);
  const priceRange = priceMax - priceMin || priceMin * 0.01;
  const paddedMin = priceMin - priceRange * 0.1, paddedMax = priceMax + priceRange * 0.1, paddedRange = paddedMax - paddedMin;
  const priceLevels = [0, 0.33, 0.66, 1].map(t => paddedMax - paddedRange * t);
  const timeLabels = ['7d ago', '5d', '3d', '1d', 'Now'];
  const pts = data.map((v, i) => { const x = PAD.left + (i / (data.length - 1)) * chartW; const actualPrice = startPrice * (v / 100); const y = PAD.top + chartH - ((actualPrice - paddedMin) / paddedRange) * chartH; return `${x},${y}`; });
  const areaPath = `M${PAD.left},${PAD.top + chartH} ` + pts.map(p => `L${p}`).join(' ') + ` L${PAD.left + chartW},${PAD.top + chartH} Z`;
  const isUp = data[data.length - 1] >= data[0], color = isUp ? '#22c55e' : '#ef4444';
  const fmtAxis = (p) => { if (p >= 1000) return '$' + (p/1000).toFixed(1) + 'k'; if (p >= 1) return '$' + p.toFixed(2); if (p >= 0.01) return '$' + p.toFixed(4); return '$' + p.toFixed(6); };
  const currentY = PAD.top + chartH - ((endPrice - paddedMin) / paddedRange) * chartH;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '200px' }}>
        <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {priceLevels.map((price, i) => { const y = PAD.top + (i / 3) * chartH; return (<g key={i}><line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3,3"/><text x={W - 5} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="9">{fmtAxis(price)}</text></g>); })}
        {timeLabels.map((label, i) => { const x = PAD.left + (i / (timeLabels.length - 1)) * chartW; return (<g key={i}><line x1={x} y1={PAD.top} x2={x} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.04)"/><text x={x} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">{label}</text></g>); })}
        <path d={areaPath} fill="url(#chartGrad)"/><polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts.join(' ')}/>
        <line x1={PAD.left} y1={currentY} x2={PAD.left + chartW} y2={currentY} stroke={color} strokeWidth="1" strokeDasharray="4,2" opacity="0.5"/>
      </svg>
      <div className="flex justify-between items-center mt-3 px-1">
        <div className="flex gap-4 text-xs"><span className="text-gray-400"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>High: <span className="text-white font-medium">{fmtAxis(startPrice * (max / 100))}</span></span><span className="text-gray-400"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>Low: <span className="text-white font-medium">{fmtAxis(startPrice * (min / 100))}</span></span></div>
        <span className="text-xs text-gray-400">Spread: <span className={`font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>{((max - min) / min * 100).toFixed(1)}%</span></span>
      </div>
    </div>
  );
};

const fmt = n => { if (n == null) return '--'; if (n >= 1e12) return (n/1e12).toFixed(2)+'T'; if (n >= 1e9) return (n/1e9).toFixed(2)+'B'; if (n >= 1e6) return (n/1e6).toFixed(2)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return Number(n).toFixed(2); };
const fmtP = p => { if (p == null) return '--'; if (p >= 1000) return '$'+Number(p).toLocaleString('en-US',{maximumFractionDigits:0}); if (p >= 1) return '$'+Number(p).toFixed(2); if (p >= 0.0001) return '$'+Number(p).toFixed(6); return '$'+Number(p).toFixed(10); };
const rsiStyle = r => { if (r === null) return {bg:'bg-gray-700/30 border-gray-600/30',text:'text-gray-500',label:'...',dot:'bg-gray-500'}; if (r < 20) return {bg:'bg-red-500/20 border-red-500/40',text:'text-red-400',label:'EXTREME',dot:'bg-red-500'}; if (r < 30) return {bg:'bg-orange-500/20 border-orange-500/40',text:'text-orange-400',label:'OVERSOLD',dot:'bg-orange-500'}; if (r < 40) return {bg:'bg-yellow-500/20 border-yellow-500/40',text:'text-yellow-400',label:'WEAK',dot:'bg-yellow-500'}; if (r < 60) return {bg:'bg-gray-500/20 border-gray-500/30',text:'text-gray-300',label:'NEUTRAL',dot:'bg-gray-400'}; if (r < 70) return {bg:'bg-emerald-500/20 border-emerald-500/40',text:'text-emerald-400',label:'STRONG',dot:'bg-emerald-500'}; return {bg:'bg-green-500/20 border-green-500/40',text:'text-green-400',label:'OVERBOUGHT',dot:'bg-green-500'}; };

const RSIMeter = ({value}) => {
  if (value === null) return <div className="h-3 bg-gray-800 rounded-full"/>;
  return (
    <div className="w-full">
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 flex"><div className="w-[20%] bg-red-500/40"/><div className="w-[10%] bg-orange-500/40"/><div className="w-[30%] bg-gray-600/40"/><div className="w-[10%] bg-emerald-500/40"/><div className="w-[30%] bg-green-500/40"/></div>
        <div className="absolute top-0 h-full w-1.5 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-500" style={{left:`calc(${Math.min(98,Math.max(1,value))}% - 3px)`}}/>
      </div>
      <div className="flex justify-between text-[9px] mt-1 text-gray-600"><span>0</span><span className="text-red-400/70">20</span><span className="text-orange-400/70">30</span><span>50</span><span className="text-emerald-400/70">70</span><span>100</span></div>
    </div>
  );
};

const FullPageChart = ({ data, basePrice, change7d }) => {
  if (!data?.length || data.length < 2) return <div className="w-full h-80 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">No chart data</div>;
  const W = 800, H = 400, PAD = { top: 30, right: 80, bottom: 50, left: 20 };
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom;
  const endPrice = basePrice, startPrice = endPrice / (1 + (change7d || 0) / 100);
  const min = Math.min(...data), max = Math.max(...data);
  const priceMin = startPrice * (min / 100), priceMax = startPrice * (max / 100), priceRange = priceMax - priceMin || priceMin * 0.01;
  const paddedMin = priceMin - priceRange * 0.1, paddedMax = priceMax + priceRange * 0.1, paddedRange = paddedMax - paddedMin;
  const priceLevels = [0, 0.2, 0.4, 0.6, 0.8, 1].map(t => paddedMax - paddedRange * t);
  const timeLabels = ['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
  const pts = data.map((v, i) => { const x = PAD.left + (i / (data.length - 1)) * chartW; const actualPrice = startPrice * (v / 100); const y = PAD.top + chartH - ((actualPrice - paddedMin) / paddedRange) * chartH; return `${x},${y}`; });
  const areaPath = `M${PAD.left},${PAD.top + chartH} ` + pts.map(p => `L${p}`).join(' ') + ` L${PAD.left + chartW},${PAD.top + chartH} Z`;
  const isUp = data[data.length - 1] >= data[0], color = isUp ? '#22c55e' : '#ef4444';
  const fmtAxis = (p) => { if (p >= 1000) return '$' + (p/1000).toFixed(1) + 'k'; if (p >= 1) return '$' + p.toFixed(2); if (p >= 0.01) return '$' + p.toFixed(4); return '$' + p.toFixed(6); };
  const currentY = PAD.top + chartH - ((endPrice - paddedMin) / paddedRange) * chartH;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs><linearGradient id="fullChartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {priceLevels.map((price, i) => { const y = PAD.top + (i / 5) * chartH; return (<g key={i}><line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4,4"/><text x={W - 10} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="12">{fmtAxis(price)}</text></g>); })}
        {timeLabels.map((label, i) => { const x = PAD.left + (i / (timeLabels.length - 1)) * chartW; return (<g key={i}><line x1={x} y1={PAD.top} x2={x} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.05)"/><text x={x} y={H - 15} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">{label}</text></g>); })}
        <path d={areaPath} fill="url(#fullChartGrad)"/><polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts.join(' ')}/>
        <line x1={PAD.left} y1={currentY} x2={PAD.left + chartW} y2={currentY} stroke={color} strokeWidth="1" strokeDasharray="6,3" opacity="0.6"/>
      </svg>
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex gap-6 text-sm"><span className="text-gray-400"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>High: <span className="text-white font-semibold">{fmtAxis(startPrice * (max / 100))}</span></span><span className="text-gray-400"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>Low: <span className="text-white font-semibold">{fmtAxis(startPrice * (min / 100))}</span></span></div>
        <span className="text-sm text-gray-400">Spread: <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>{((max - min) / min * 100).toFixed(2)}%</span></span>
      </div>
    </div>
  );
};

const TokenDetailPage = ({ token, onBack, darkMode, setDarkMode }) => {
  if (!token) return null;
  const rs = rsiStyle(token.rsi);
  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`p-2 rounded-lg ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200'} transition-colors`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <img src={token.image} alt={token.symbol} className="w-16 h-16 rounded-2xl bg-gray-800"/>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{token.name}</h1>
                <span className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{token.symbol}</span>
                <span className={`px-2 py-1 rounded text-sm ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>Rank #{token.rank}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-bold">{fmtP(token.price)}</span>
                <span className={`text-lg font-semibold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h?.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
          </div>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">7-Day Price Chart</h2>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${token.change7d >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {token.change7d >= 0 ? '+' : ''}{token.change7d?.toFixed(2)}%
              </span>
            </div>
            <FullPageChart data={token.sparkline} basePrice={token.price} change7d={token.change7d}/>
          </div>
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">RSI (14)</h2>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${rs.dot}`}/>
                  <span className={`text-2xl font-bold ${rs.text}`}>{token.rsi !== null ? token.rsi.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
              <RSIMeter value={token.rsi}/>
              <div className={`mt-4 p-3 rounded-xl ${rs.bg} border ${rs.text}`}>
                <span className="font-semibold">{rs.label}</span>
                <p className="text-sm opacity-80 mt-1">
                  {token.rsi < 30 ? 'This token may be oversold.' : token.rsi > 70 ? 'This token may be overbought.' : 'Neutral territory.'}
                </p>
              </div>
            </div>
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
              <h2 className="text-lg font-semibold mb-4">Price Changes</h2>
              <div className="grid grid-cols-2 gap-3">
                {[{l:'1 Hour', v:token.change1h},{l:'24 Hours', v:token.change24h},{l:'7 Days', v:token.change7d},{l:'30 Days', v:token.change30d}].map(x => (
                  <div key={x.l} className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
                    <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{x.l}</p>
                    <p className={`text-lg font-bold ${(x.v||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {x.v != null ? `${x.v >= 0 ? '+' : ''}${x.v.toFixed(2)}%` : '--'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={`mt-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-2xl p-6 border`}>
          <h2 className="text-lg font-semibold mb-4">Market Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{icon:'💰', label:'Price', value:fmtP(token.price)},{icon:'📊', label:'Market Cap', value:'$'+fmt(token.mcap)},{icon:'📈', label:'24h Volume', value:'$'+fmt(token.volume)},{icon:'🔄', label:'Vol/MCap', value:token.volMcap?.toFixed(2)+'%'},{icon:'💎', label:'Supply', value:fmt(token.supply)+' '+token.symbol},{icon:'🏆', label:'Dominance', value:(token.dominance||0).toFixed(3)+'%'}].map(x => (
              <div key={x.label} className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4`}>
                <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{x.icon} {x.label}</p>
                <p className="text-lg font-bold truncate">{x.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <a href={`https://coingecko.com/en/coins/${token.id}`} target="_blank" rel="noreferrer" className="block w-full py-4 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-center text-green-400 font-medium transition-colors text-lg">
            View on CoinGecko ↗
          </a>
        </div>
      </div>
    </div>
  );
};

const API_URL = '/api/crypto';

export default function App() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [sortBy, setSortBy] = useState('rsi_asc');
  const [sel, setSel] = useState(null);
  const [watchlist, setWatchlist] = useState(new Set());
  const [showWL, setShowWL] = useState(false);
  const [preset, setPreset] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const [rsiFilter, setRsiFilter] = useState(null);
  const [rsiSortDir, setRsiSortDir] = useState('desc');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [pageTokenId, setPageTokenId] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('oversold_darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('oversold_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('oversold_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        const savedWatchlist = localStorage.getItem(`oversold_watchlist_${parsedUser.id}`);
        if (savedWatchlist) setWatchlist(new Set(JSON.parse(savedWatchlist)));
      } catch (e) { console.error('Failed to load user:', e); }
    }
  }, []);

  useEffect(() => { if (user) localStorage.setItem(`oversold_watchlist_${user.id}`, JSON.stringify([...watchlist])); }, [watchlist, user]);

  const handleLogin = (loggedInUser) => { setUser(loggedInUser); const saved = localStorage.getItem(`oversold_watchlist_${loggedInUser.id}`); if (saved) setWatchlist(new Set(JSON.parse(saved))); else setWatchlist(new Set()); };
  const handleLogout = () => { localStorage.removeItem('oversold_user'); setUser(null); setWatchlist(new Set()); setShowWL(false); if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect(); };

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/token/')) { setPageTokenId(hash.replace('#/token/', '')); setCurrentPage('token'); }
      else if (hash === '#/methodology') { setPageTokenId(null); setCurrentPage('methodology'); }
      else if (hash === '#/watchlist') { setPageTokenId(null); setCurrentPage('watchlist'); }
      else if (hash === '#/terms') { setPageTokenId(null); setCurrentPage('terms'); }
      else if (hash === '#/privacy') { setPageTokenId(null); setCurrentPage('privacy'); }
      else { setPageTokenId(null); setCurrentPage('home'); }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const openTokenPage = (tokenId, e) => { e.stopPropagation(); window.open(`${window.location.pathname}#/token/${tokenId}`, '_blank'); };
  const goBack = () => { window.location.hash = ''; };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const processed = data.tokens.map(t => ({ ...t, category: getCat(t.id), volMcap: t.mcap ? (t.volume / t.mcap) * 100 : 0 }));
      setTokens(processed);
      setLastUpdate(new Date(data.timestamp));
      setApiStats(data.stats);
      setLoading(false);
    } catch (e) {setError(e.message); setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const resetFilters = () => { setSearch(''); setCat('all'); setPreset(null); setShowWL(false); setRsiFilter(null); setRsiSortDir('desc'); setSortBy('rsi_asc'); };
  const toggleWatch = useCallback((id, e) => { e?.stopPropagation(); if (!user) { setShowLoginModal(true); return; } setWatchlist(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, [user]);

  const filtered = useMemo(() => {
    let r = [...tokens];
    if (search) { const s = search.toLowerCase(); r = r.filter(t => t.name?.toLowerCase().includes(s) || t.symbol?.toLowerCase().includes(s)); }
    if (cat !== 'all') r = r.filter(t => t.category === cat);
    if (showWL) r = r.filter(t => watchlist.has(t.id));
    if (preset) { const p = PRESETS.find(x => x.id === preset); if (p) r = r.filter(p.filter); }
    if (rsiFilter === 'extreme') r = r.filter(t => t.rsi !== null && t.rsi < 20);
    else if (rsiFilter === 'oversold') r = r.filter(t => t.rsi !== null && t.rsi >= 20 && t.rsi < 30);
    else if (rsiFilter === 'neutral') r = r.filter(t => t.rsi !== null && t.rsi >= 30 && t.rsi < 70);
    else if (rsiFilter === 'overbought') r = r.filter(t => t.rsi !== null && t.rsi >= 70);
    let activeSort = preset ? PRESETS.find(x => x.id === preset)?.sort || sortBy : sortBy;
    if (rsiFilter) activeSort = `rsi_${rsiSortDir}`;
    const [field, dir] = activeSort.split('_');
    r.sort((a, b) => { let va = a[field], vb = b[field]; if (va === null || va === undefined) va = dir === 'asc' ? Infinity : -Infinity; if (vb === null || vb === undefined) vb = dir === 'asc' ? Infinity : -Infinity; return dir === 'asc' ? va - vb : vb - va; });
    return r;
  }, [tokens, search, cat, sortBy, showWL, watchlist, preset, rsiFilter, rsiSortDir]);

  const stats = useMemo(() => {
    const withRSI = tokens.filter(t => t.rsi !== null);
    return { extreme: withRSI.filter(t => t.rsi < 20).length, oversold: withRSI.filter(t => t.rsi >= 20 && t.rsi < 30).length, neutral: withRSI.filter(t => t.rsi >= 30 && t.rsi < 70).length, overbought: withRSI.filter(t => t.rsi >= 70).length, totalMcap: tokens.reduce((s, t) => s + (t.mcap || 0), 0), avgRsi: withRSI.length ? withRSI.reduce((s, t) => s + t.rsi, 0) / withRSI.length : 50, withRSI: withRSI.length };
  }, [tokens]);

  const exportCSV = useCallback(() => {
    const h = ['Rank','Symbol','Name','Price','1h%','24h%','7d%','30d%','RSI','MCap','Volume','Category'];
    const rows = filtered.map(t => [t.rank,t.symbol,t.name,t.price,t.change1h?.toFixed(2),t.change24h?.toFixed(2),t.change7d?.toFixed(2),t.change30d?.toFixed(2),t.rsi?.toFixed(1),t.mcap,t.volume,t.category]);
    const blob = new Blob([[h,...rows].map(r=>r.join(',')).join('\n')],{type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oversold_${Date.now()}.csv`; a.click();
  }, [filtered]);

  const pageToken = pageTokenId ? tokens.find(t => t.id === pageTokenId) : null;

  if (pageTokenId) {
    if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-400">Loading...</p></div></div>;
    if (!pageToken) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center"><div className="text-center"><p className="text-4xl mb-4">😕</p><p className="text-xl mb-2">Token not found</p><button onClick={goBack} className="px-6 py-2 bg-orange-500 rounded-lg">Back</button></div></div>;
    return <TokenDetailPage token={pageToken} onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }
  if (currentPage === 'methodology') return <MethodologyPage onBack={() => window.location.hash = ''} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (currentPage === 'terms') return <TermsPage onBack={() => window.location.hash = ''} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (currentPage === 'privacy') return <PrivacyPage onBack={() => window.location.hash = ''} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (currentPage === 'watchlist') { if (!user) { window.location.hash = ''; setShowLoginModal(true); return null; } return <WatchlistPage tokens={tokens} watchlist={watchlist} onRemove={toggleWatch} onBack={() => window.location.hash = ''} user={user} darkMode={darkMode} setDarkMode={setDarkMode} />; }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'} selection:bg-orange-500/30`}>
      {darkMode && <div className="fixed inset-0 pointer-events-none"><div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]"/><div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]"/></div>}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 onClick={resetFilters} className="text-4xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity"><span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">OVERSOLD</span><span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>.crypto</span></h1>
            <div className="flex items-center gap-3 mt-2"><div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/><span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Live</span></div><span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span><span className="text-sm text-gray-500">{lastUpdate?.toLocaleTimeString() || 'Loading...'}</span>{apiStats && <><span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span><span className="text-sm text-gray-500">{apiStats.withRSI}/{apiStats.total} RSI</span></>}</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            <div className={`${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border px-4 py-2.5 rounded-xl text-sm flex items-center gap-3`}><div><span className="text-gray-500">MCap</span> <span className="font-mono font-semibold">${fmt(stats.totalMcap)}</span></div><div className={`w-px h-4 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}/><div><span className="text-gray-500">Avg RSI</span><span className={`font-mono font-semibold ml-1 ${stats.avgRsi<30?'text-red-500':stats.avgRsi>70?'text-green-500':darkMode?'text-gray-300':'text-gray-700'}`}>{stats.avgRsi.toFixed(0)}</span></div></div>
            {user ? <UserMenu user={user} onLogout={handleLogout} watchlistCount={watchlist.size} /> : <button onClick={() => setShowLoginModal(true)} className={`${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white hover:bg-gray-50 border-gray-200'} border px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2`}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>Sign In</button>}
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[{k:'extreme',color:'red',label:'EXTREME',sub:'RSI < 20'},{k:'oversold',color:'orange',label:'OVERSOLD',sub:'RSI < 30'},{k:'neutral',color:'gray',label:'NEUTRAL',sub:'RSI 30-70'},{k:'overbought',color:'green',label:'OVERBOUGHT',sub:'RSI > 70'}].map(s => (
            <div key={s.k} onClick={() => { setRsiFilter(rsiFilter === s.k ? null : s.k); setPreset(null); }} className={`bg-${s.color}-500/10 border-2 rounded-xl p-4 text-center transition-all cursor-pointer hover:scale-[1.02] ${rsiFilter === s.k ? `border-${s.color}-500 shadow-lg shadow-${s.color}-500/20` : `border-${s.color}-500/20 hover:border-${s.color}-500/50`}`}>
              <p className={`text-3xl font-bold text-${s.color}-500`}>{stats[s.k]}</p><p className={`text-xs mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</p><p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {rsiFilter && <div className={`flex items-center gap-3 mb-4 px-4 py-2 ${darkMode ? 'bg-white/5' : 'bg-white border border-gray-200'} rounded-xl w-fit`}><span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Showing: <span className={`font-medium capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{rsiFilter}</span></span><div className={`flex items-center gap-1 border-l ${darkMode ? 'border-white/10' : 'border-gray-200'} pl-3`}><span className="text-xs text-gray-500">Sort:</span><button onClick={() => setRsiSortDir(d => d === 'desc' ? 'asc' : 'desc')} className={`px-2 py-1 rounded-lg text-xs font-medium ${rsiSortDir === 'desc' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'}`}>{rsiSortDir === 'desc' ? '↓ High→Low' : '↑ Low→High'}</button></div><button onClick={() => setRsiFilter(null)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} ml-1 text-lg`}>✕</button></div>}

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {PRESETS.map(p => <button key={p.id} onClick={() => { setPreset(preset === p.id ? null : p.id); setRsiFilter(null); }} className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all font-medium ${preset === p.id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20' : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{p.name}</button>)}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1"><input type="text" placeholder="Search tokens..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-orange-500/50 transition-all`}/><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span></div>
          <div className="flex gap-2 overflow-x-auto">{CATS.map(c => <button key={c.id} onClick={() => setCat(c.id)} className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all font-medium ${cat === c.id ? (darkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white') : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{c.icon} {c.name}</button>)}</div>
          <div className="flex gap-2">
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPreset(null); setRsiFilter(null); }} className={`${darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer appearance-none min-w-[180px]`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px' }}>
              <option value="rank_asc">Rank ↑</option><option value="rank_desc">Rank ↓</option><option value="price_desc">Price ↓</option><option value="price_asc">Price ↑</option><option value="rsi_asc">RSI ↑ (Oversold)</option><option value="rsi_desc">RSI ↓ (Overbought)</option><option value="change24h_asc">24h % ↑</option><option value="change24h_desc">24h % ↓</option><option value="change7d_asc">7d % ↑</option><option value="change7d_desc">7d % ↓</option><option value="mcap_desc">MCap ↓</option><option value="volume_desc">Volume ↓</option>
            </select>
            <button onClick={() => user ? setShowWL(w => !w) : setShowLoginModal(true)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showWL ? 'bg-yellow-500 text-black' : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>⭐ {user ? watchlist.size : ''}</button>
            <button onClick={exportCSV} className={`px-4 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>📥</button>
            <button onClick={fetchData} className={`px-4 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>🔄</button>
          </div>
        </div>

        {loading ? <div className="text-center py-24"><div className="w-14 h-14 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"/><p className={`mt-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading market data...</p></div>
        : error ? <div className="text-center py-20 bg-red-500/10 border border-red-500/20 rounded-2xl"><p className="text-red-500 text-xl mb-2">⚠️ {error}</p><button onClick={fetchData} className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl font-medium">Retry</button></div>
        : (
          <div className={`${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-2xl border overflow-hidden`}>
            <div className={`hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'} text-xs text-gray-500 font-semibold uppercase tracking-wider`}>
              <div className={`col-span-3 flex items-center gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => { setSortBy(sortBy === 'rank_asc' ? 'rank_desc' : 'rank_asc'); setPreset(null); setRsiFilter(null); }}><span>Token</span><span className={`transition-opacity ${sortBy.startsWith('rank') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'rank_asc' ? '↑' : '↓'}</span></div>
              <div className={`col-span-2 text-right flex items-center justify-end gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => { setSortBy(sortBy === 'price_desc' ? 'price_asc' : 'price_desc'); setPreset(null); setRsiFilter(null); }}><span>Price</span><span className={`transition-opacity ${sortBy.startsWith('price') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'price_asc' ? '↑' : '↓'}</span></div>
              <div className={`col-span-1 text-right flex items-center justify-end gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => { setSortBy(sortBy === 'change24h_desc' ? 'change24h_asc' : 'change24h_desc'); setPreset(null); setRsiFilter(null); }}><span>24H</span><span className={`transition-opacity ${sortBy.startsWith('change24h') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'change24h_asc' ? '↑' : '↓'}</span></div>
              <div className={`col-span-1 text-right flex items-center justify-end gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => { setSortBy(sortBy === 'change7d_desc' ? 'change7d_asc' : 'change7d_desc'); setPreset(null); setRsiFilter(null); }}><span>7D</span><span className={`transition-opacity ${sortBy.startsWith('change7d') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'change7d_asc' ? '↑' : '↓'}</span></div>
              <div className={`col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors group`} onClick={() => { setSortBy(sortBy === 'rsi_desc' ? 'rsi_asc' : 'rsi_desc'); setPreset(null); setRsiFilter(null); }}><span>RSI (14)</span><span className={`transition-opacity ${sortBy.startsWith('rsi') ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>{sortBy === 'rsi_asc' ? '↑' : '↓'}</span></div>
              <div className="col-span-2 text-right">Chart</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
            <div className="max-h-[58vh] overflow-y-auto">
              {filtered.length === 0 ? <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No tokens match your filters</p></div>
              : filtered.map(t => {
                const rs = rsiStyle(t.rsi), watched = watchlist.has(t.id), sparkColor = t.sparkline?.length > 1 ? (t.sparkline[t.sparkline.length-1] >= t.sparkline[0] ? '#22c55e' : '#ef4444') : '#6b7280';
                return (
                  <div key={t.id} onClick={() => setSel(t)} className={`grid grid-cols-8 lg:grid-cols-12 gap-3 px-5 py-3.5 border-b ${darkMode ? 'border-white/5 hover:bg-white/[0.04]' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer transition-colors ${watched ? (darkMode ? 'bg-yellow-500/[0.04]' : 'bg-yellow-50') : ''}`}>
                    <div className="col-span-3 flex items-center gap-3"><span className={`text-xs w-5 text-right ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t.rank}</span><img src={t.image} alt={t.symbol} className="w-9 h-9 rounded-full shrink-0 bg-gray-800"/><div className="min-w-0"><div className="flex items-center gap-1.5"><span className="font-semibold">{t.symbol}</span>{t.rsi !== null && t.rsi < 25 && <span className="text-xs">🔴</span>}{t.rsi !== null && t.rsi > 75 && <span className="text-xs">🟢</span>}</div><p className="text-xs text-gray-500 truncate">{t.name}</p></div></div>
                    <div className="col-span-2 text-right self-center font-mono text-sm">{fmtP(t.price)}</div>
                    <div className="col-span-1 text-right self-center text-sm hidden lg:block"><span className={t.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>{t.change24h >= 0 ? '+' : ''}{t.change24h?.toFixed(1)}%</span></div>
                    <div className="col-span-1 text-right self-center text-sm"><span className={t.change7d >= 0 ? 'text-green-500' : 'text-red-500'}>{t.change7d >= 0 ? '+' : ''}{t.change7d?.toFixed(1)}%</span></div>
                    <div className="col-span-2 self-center flex justify-center"><div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${rs.bg} ${rs.text}`}><span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`}/><span className="font-bold text-sm">{t.rsi !== null ? t.rsi.toFixed(0) : '--'}</span><span className="text-[10px] opacity-70 hidden sm:inline">{rs.label}</span></div></div>
                    <div className="col-span-2 self-center hidden lg:flex justify-end"><Spark data={t.sparkline} color={sparkColor} h={24}/></div>
                    <div className="col-span-1 self-center flex justify-center gap-2"><button onClick={e => openTokenPage(t.id, e)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'} transition-colors`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></button><button onClick={e => toggleWatch(t.id, e)} className={`text-lg hover:scale-110 transition-transform ${watched ? 'text-yellow-400' : darkMode ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`}>{watched ? '★' : '☆'}</button></div>
                  </div>
                );
              })}
            </div>
            <div className={`px-5 py-3 border-t ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'} flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-500`}><span>{filtered.length} tokens • {stats.withRSI} with RSI</span><span>Data: CoinGecko • RSI (14) • Auto-refresh 1min</span></div>
          </div>
        )}

        {sel && (
          <div className={`fixed inset-0 ${darkMode ? 'bg-black/90' : 'bg-black/50'} backdrop-blur-sm z-50 flex items-center justify-center p-4`} onClick={() => setSel(null)}>
            <div className={`${darkMode ? 'bg-[#12121a] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-5"><img src={sel.image} alt={sel.symbol} className="w-16 h-16 rounded-2xl bg-gray-800"/><div className="flex-1"><div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{sel.name}</h2><button onClick={e => toggleWatch(sel.id, e)} className={`text-xl ${watchlist.has(sel.id) ? 'text-yellow-400' : 'text-gray-400'}`}>{watchlist.has(sel.id) ? '★' : '☆'}</button></div><p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{sel.symbol} • Rank #{sel.rank}</p></div></div>
              <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4 mb-5`}><div className="flex justify-between items-center mb-3"><span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>RSI (14)</span><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${rsiStyle(sel.rsi).dot}`}/><span className={`text-2xl font-bold ${rsiStyle(sel.rsi).text}`}>{sel.rsi !== null ? sel.rsi.toFixed(1) : 'N/A'}</span><span className={`text-sm ${rsiStyle(sel.rsi).text} opacity-70`}>{rsiStyle(sel.rsi).label}</span></div></div><RSIMeter value={sel.rsi}/></div>
              <div className="grid grid-cols-2 gap-3 mb-5">{[{icon:'💰', label:'Price', value:fmtP(sel.price)},{icon:'📊', label:'Market Cap', value:'$'+fmt(sel.mcap)},{icon:'📈', label:'24h Volume', value:'$'+fmt(sel.volume)},{icon:'🔄', label:'Vol/MCap', value:sel.volMcap?.toFixed(2)+'%'},{icon:'💎', label:'Circulating', value:fmt(sel.supply)},{icon:'🏆', label:'Dominance', value:(sel.dominance||0).toFixed(2)+'%'}].map(x => <div key={x.label} className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3`}><p className="text-xs text-gray-500 mb-1">{x.icon} {x.label}</p><p className="text-lg font-bold">{x.value}</p></div>)}</div>
              <div className="grid grid-cols-4 gap-2 mb-5">{[{l:'1H', v:sel.change1h},{l:'24H', v:sel.change24h},{l:'7D', v:sel.change7d},{l:'30D', v:sel.change30d}].map(x => <div key={x.l} className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-3 text-center`}><p className="text-[10px] text-gray-500 mb-1">{x.l}</p><p className={`font-bold ${(x.v||0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{x.v != null ? `${x.v >= 0 ? '+' : ''}${x.v.toFixed(1)}%` : '--'}</p></div>)}</div>
              {sel.sparkline && sel.sparkline.length > 1 && <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4 mb-5`}><div className="flex justify-between items-center mb-3"><p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>7-Day Chart</p><span className={`text-xs px-2 py-0.5 rounded ${sel.change7d >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{sel.change7d >= 0 ? '+' : ''}{sel.change7d?.toFixed(2)}%</span></div><DetailChart data={sel.sparkline} basePrice={sel.price} change7d={sel.change7d}/></div>}
              <a href={`https://www.coingecko.com/en/coins/${sel.id}`} target="_blank" rel="noreferrer" className="block w-full py-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-center text-green-500 font-medium transition-colors">View on CoinGecko ↗</a>
              <button onClick={(e) => { openTokenPage(sel.id, e); setSel(null); }} className="w-full mt-3 py-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl text-orange-500 font-medium transition-colors">View Detailed Analysis</button>
              <button onClick={() => setSel(null)} className={`w-full mt-2 py-3 ${darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl font-medium transition-colors`}>Close</button>
            </div>
          </div>
        )}

<div className="flex items-center justify-center gap-6 text-sm"><a href="#/terms" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>Terms of Service</a><span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>|</span><a href="#/privacy" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>Privacy Policy</a><span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>|</span><a href="#/methodology" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>Methodology</a></div>
      </div>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />}
    </div>
  );
}


