// ==================================================
// FILE: src/App.jsx - Fully Refactored
// ==================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  formatNumber,
  formatPrice,
  getRsiStyle,
  CATEGORIES,
  PRESETS,
  REFRESH_INTERVAL,
  API_URL,
  API_URL_ENHANCED,
} from './utils';
import { ThemeToggle } from './components/ThemeToggle';
import { LoginModal } from './components/LoginModal';
import { UserMenu } from './components/UserMenu';
import { Footer } from './components/Footer';
import { Spark } from './components/Charts';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { TokenDetailPage } from './pages/TokenDetailPage';

export default function App() {
  // State management
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [sortBy, setSortBy] = useState('rsi_asc');
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
  const [signalFilters, setSignalFilters] = useState(new Set());
  const [useEnhancedAPI, setUseEnhancedAPI] = useState(true);
  const [showLowVolume, setShowLowVolume] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('oversold_darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Dark mode persistence
  useEffect(() => {
    localStorage.setItem('oversold_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('oversold_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        const savedWatchlist = localStorage.getItem(`oversold_watchlist_${parsedUser.id}`);
        if (savedWatchlist) setWatchlist(new Set(JSON.parse(savedWatchlist)));
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`oversold_watchlist_${user.id}`, JSON.stringify([...watchlist]));
    }
  }, [watchlist, user]);

  // Auth handlers
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    const saved = localStorage.getItem(`oversold_watchlist_${loggedInUser.id}`);
    if (saved) setWatchlist(new Set(JSON.parse(saved)));
    else setWatchlist(new Set());
  };

  const handleLogout = () => {
    localStorage.removeItem('oversold_user');
    setUser(null);
    setWatchlist(new Set());
    setShowWL(false);
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  };

  // Hash-based routing
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/token/')) {
        setPageTokenId(hash.replace('#/token/', ''));
        setCurrentPage('token');
      } else if (hash === '#/methodology') {
        setPageTokenId(null);
        setCurrentPage('methodology');
      } else if (hash === '#/watchlist') {
        setPageTokenId(null);
        setCurrentPage('watchlist');
      } else if (hash === '#/terms') {
        setPageTokenId(null);
        setCurrentPage('terms');
      } else if (hash === '#/privacy') {
        setPageTokenId(null);
        setCurrentPage('privacy');
      } else {
        setPageTokenId(null);
        setCurrentPage('home');
      }
      // Scroll to top when navigating
      window.scrollTo(0, 0);
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const openTokenPage = (tokenId, e) => {
    e.stopPropagation();
    window.open(`${window.location.pathname}#/token/${tokenId}`, '_blank');
  };

  const goBack = () => {
    window.location.hash = '';
  };

  // Fetch crypto data
  const fetchData = useCallback(async () => {
  try {
    setError(null);
    // Use enhanced API if enabled
    const apiUrl = useEnhancedAPI ? API_URL_ENHANCED : API_URL;
    const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const processed = data.tokens.map((t) => ({
        ...t,
        volMcap: t.mcap ? (t.volume / t.mcap) * 100 : 0,
      }));
      setTokens(processed);
      setLastUpdate(new Date(data.timestamp));
      setApiStats(data.stats);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, [useEnhancedAPI]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(i);
  }, [fetchData]);

  // Filter and sort logic
  const resetFilters = () => {
    setSearch('');
    setCat('all');
    setPreset(null);
    setShowWL(false);
    setRsiFilter(null);
    setRsiSortDir('desc');
    setSortBy('rsi_asc');
    setSignalFilters(new Set());
    setShowLowVolume(false);
  };

  const toggleSignalFilter = useCallback((signalType) => {
  setSignalFilters((prev) => {
    const newFilters = new Set(prev);
    if (newFilters.has(signalType)) {
      newFilters.delete(signalType);
    } else {
      newFilters.add(signalType);
    }
    return newFilters;
  });
  setRsiFilter(null);
}, []);

  const toggleWatch = useCallback(
    (id, e) => {
      e?.stopPropagation();
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      setWatchlist((p) => {
        const n = new Set(p);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    },
    [user]
  );

  const filtered = useMemo(() => {
    let r = [...tokens];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((t) => t.name?.toLowerCase().includes(s) || t.symbol?.toLowerCase().includes(s));
    }
    if (cat !== 'all') r = r.filter((t) => t.category === cat);
    if (showWL) r = r.filter((t) => watchlist.has(t.id));
    // Volume filter: only apply when NOT showing watchlist
    if (!showWL && !showLowVolume) {
      r = r.filter((t) => t.volume >= 200000);
    }
    if (preset) {
      const p = PRESETS.find((x) => x.id === preset);
      if (p) r = r.filter(p.filter);
    }
    if (rsiFilter === 'extreme') r = r.filter((t) => t.rsi !== null && t.rsi < 20);
    else if (rsiFilter === 'oversold')
      r = r.filter((t) => t.rsi !== null && t.rsi >= 20 && t.rsi < 30);
    else if (rsiFilter === 'neutral')
      r = r.filter((t) => t.rsi !== null && t.rsi >= 30 && t.rsi < 70);
    else if (rsiFilter === 'overbought') r = r.filter((t) => t.rsi !== null && t.rsi >= 70);
if (signalFilters.size > 0) {
    r = r.filter((token) => {
      // Must match ALL selected filters (AND logic)
      for (const signalType of signalFilters) {
        switch (signalType) {
          // RSI filters - use actual RSI values directly
          case 'rsi_oversold':
            if (token.rsi === null || token.rsi >= 30) return false;
            break;
          case 'rsi_extreme':
            if (token.rsi === null || token.rsi >= 20) return false;
            break;
          case 'rsi_overbought':
            if (token.rsi === null || token.rsi < 70) return false;
            break;
          // Signal-based filters - require signals data
          case 'above_sma50':
            if (!token.signals || token.signals.aboveSMA50 !== true) return false;
            break;
          case 'below_bb':
            if (!token.signals || token.signals.belowBB !== true) return false;
            break;
          case 'volume_spike':
            if (!token.signals || token.signals.volumeSpike !== true) return false;
            break;
          case 'has_funding':
            if (!token.signals || token.signals.hasFunding !== true) return false;
            break;
          case 'negative_funding':
            if (!token.signals || token.signals.negativeFunding !== true) return false;
            break;
        }
      }
      return true;
    });
  }
    let activeSort = preset ? PRESETS.find((x) => x.id === preset)?.sort || sortBy : sortBy;
    if (rsiFilter) activeSort = `rsi_${rsiSortDir}`;
    const [field, dir] = activeSort.split('_');
    r.sort((a, b) => {
      let va = a[field],
        vb = b[field];
      if (va === null || va === undefined) va = dir === 'asc' ? Infinity : -Infinity;
      if (vb === null || vb === undefined) vb = dir === 'asc' ? Infinity : -Infinity;
      return dir === 'asc' ? va - vb : vb - va;
    });
    return r;
  }, [tokens, search, cat, sortBy, showWL, watchlist, preset, rsiFilter, rsiSortDir, signalFilters, showLowVolume]);

  const stats = useMemo(() => {
    const withRSI = tokens.filter((t) => t.rsi !== null);
    return {
      extreme: withRSI.filter((t) => t.rsi < 20).length,
      oversold: withRSI.filter((t) => t.rsi >= 20 && t.rsi < 30).length,
      neutral: withRSI.filter((t) => t.rsi >= 30 && t.rsi < 70).length,
      overbought: withRSI.filter((t) => t.rsi >= 70).length,
      totalMcap: tokens.reduce((s, t) => s + (t.mcap || 0), 0),
      avgRsi: withRSI.length ? withRSI.reduce((s, t) => s + t.rsi, 0) / withRSI.length : 50,
      withRSI: withRSI.length,
    };
  }, [tokens]);

  const exportCSV = useCallback(() => {
    const h = ['Rank', 'Symbol', 'Name', 'Price', '1h%', '24h%', '7d%', '30d%', 'RSI', 'MCap', 'Volume', 'Category'];
    const rows = filtered.map((t) => [
      t.rank,
      t.symbol,
      t.name,
      t.price,
      t.change1h?.toFixed(2),
      t.change24h?.toFixed(2),
      t.change7d?.toFixed(2),
      t.change30d?.toFixed(2),
      t.rsi?.toFixed(1),
      t.mcap,
      t.volume,
      t.category,
    ]);
    const blob = new Blob(
      [[h, ...rows].map((r) => r.join(',')).join('\n')],
      { type: 'text/csv' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oversold_${Date.now()}.csv`;
    a.click();
  }, [filtered]);

  // Route to different pages
  const pageToken = pageTokenId ? tokens.find((t) => t.id === pageTokenId) : null;

  if (currentPage === 'terms') {
    return <TermsPage onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (currentPage === 'privacy') {
    return <PrivacyPage onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (currentPage === 'methodology') {
    return <MethodologyPage onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (currentPage === 'watchlist') {
    if (!user) {
      window.location.hash = '';
      setShowLoginModal(true);
      return null;
    }
    return (
      <WatchlistPage
        tokens={tokens}
        watchlist={watchlist}
        onRemove={toggleWatch}
        onBack={goBack}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  if (currentPage === 'token') {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }
    if (!pageToken) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-xl mb-2">Token not found</p>
            <button onClick={goBack} className="px-6 py-2 bg-orange-500 rounded-lg">
              Back
            </button>
          </div>
        </div>
      );
    }
    return <TokenDetailPage token={pageToken} onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  // Main dashboard render
  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
      } selection:bg-orange-500/30`}
    >
      {/* Background effects */}
      {darkMode && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              onClick={resetFilters}
              className="text-4xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                OVERSOLD
              </span>
              <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>.crypto</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Live
                </span>
              </div>
              <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
              <span className="text-sm text-gray-500">
                {lastUpdate?.toLocaleTimeString() || 'Loading...'}
              </span>
              {apiStats && (
                <>
                  <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
                  <span className="text-sm text-gray-500">
                    {apiStats.withRSI}/{apiStats.total} RSI
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border px-4 py-2.5 rounded-xl text-sm flex items-center gap-3`}
            >
              <div>
                <span className="text-gray-500">MCap</span>{' '}
                <span className="font-mono font-semibold">${formatNumber(stats.totalMcap)}</span>
              </div>
              <div className={`w-px h-4 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div>
                <span className="text-gray-500">Avg RSI</span>
                <span
                  className={`font-mono font-semibold ml-1 ${
                    stats.avgRsi < 30
                      ? 'text-red-500'
                      : stats.avgRsi > 70
                      ? 'text-green-500'
                      : darkMode
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  {stats.avgRsi.toFixed(0)}
                </span>
              </div>
            </div>
            {user ? (
              <UserMenu user={user} onLogout={handleLogout} watchlistCount={watchlist.size} />
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className={`${
                  darkMode
                    ? 'bg-white/5 hover:bg-white/10 border-white/10'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                } border px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { k: 'extreme', color: 'red', label: 'EXTREME', sub: 'RSI < 20' },
            { k: 'oversold', color: 'orange', label: 'OVERSOLD', sub: 'RSI < 30' },
            { k: 'neutral', color: 'gray', label: 'NEUTRAL', sub: 'RSI 30-70' },
            { k: 'overbought', color: 'green', label: 'OVERBOUGHT', sub: 'RSI > 70' },
          ].map((s) => (
            <div
              key={s.k}
              onClick={() => {
                setRsiFilter(rsiFilter === s.k ? null : s.k);
                setPreset(null);
              }}
              className={`bg-${s.color}-500/10 border-2 rounded-xl p-4 text-center transition-all cursor-pointer hover:scale-[1.02] ${
                rsiFilter === s.k
                  ? `border-${s.color}-500 shadow-lg shadow-${s.color}-500/20`
                  : `border-${s.color}-500/20 hover:border-${s.color}-500/50`
              }`}
            >
              <p className={`text-3xl font-bold text-${s.color}-500`}>{stats[s.k]}</p>
              <p
                className={`text-xs mt-1 font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {s.label}
              </p>
              <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* RSI Filter indicator */}
        {rsiFilter && (
          <div
            className={`flex items-center gap-3 mb-4 px-4 py-2 ${
              darkMode ? 'bg-white/5' : 'bg-white border border-gray-200'
            } rounded-xl w-fit`}
          >
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing:{' '}
              <span
                className={`font-medium capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {rsiFilter}
              </span>
            </span>
            <div
              className={`flex items-center gap-1 border-l ${
                darkMode ? 'border-white/10' : 'border-gray-200'
              } pl-3`}
            >
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => setRsiSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  rsiSortDir === 'desc'
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                }`}
              >
                {rsiSortDir === 'desc' ? '↓ High→Low' : '↑ Low→High'}
              </button>
            </div>
            <button
              onClick={() => setRsiFilter(null)}
              className={`${
                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
              } ml-1 text-lg`}
            >
              ✕
            </button>
          </div>
        )}

        {/* Unified Filters */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🎯 Filters
            </span>
            {(signalFilters.size > 0 || preset) && (
              <button
                onClick={() => {
                  setSignalFilters(new Set());
                  setPreset(null);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {[
              // RSI Filters
              { 
                id: 'rsi_oversold', 
                label: '🔴 Oversold <30', 
                desc: 'RSI below 30',
                type: 'signal'
              },
              { 
                id: 'rsi_extreme', 
                label: '🚨 Extreme <20', 
                desc: 'RSI below 20',
                type: 'signal'
              },
              { 
                id: 'rsi_overbought', 
                label: '🟢 Overbought >70', 
                desc: 'RSI above 70',
                type: 'signal'
              },
              // Sort-based Filters
              { 
                id: 'losers24h', 
                label: '📉 24h Losers', 
                desc: 'Biggest 24h drops',
                type: 'preset'
              },
              { 
                id: 'losers7d', 
                label: '📉 7d Losers', 
                desc: 'Biggest 7d drops',
                type: 'preset'
              },
              { 
                id: 'gainers', 
                label: '📈 24h Gainers', 
                desc: 'Biggest 24h gains',
                type: 'preset'
              },
              { 
                id: 'volume', 
                label: '🔥 High Volume', 
                desc: 'High volume/mcap ratio',
                type: 'preset'
              },
              // Technical Signal Filters
              { 
                id: 'above_sma50', 
                label: '📈 Above SMA50', 
                desc: 'Price > 50-day SMA',
                type: 'signal',
                enhanced: true
              },
              { 
                id: 'below_bb', 
                label: '⚠️ Below BB', 
                desc: 'Below Bollinger Band',
                type: 'signal',
                enhanced: true
              },
              { 
                id: 'volume_spike', 
                label: '🔥 Volume Spike', 
                desc: 'Volume > 1.5x average',
                type: 'signal',
                enhanced: true
              },
              { 
                id: 'has_funding', 
                label: '💰 Has Futures', 
                desc: 'Funding rate available',
                type: 'signal',
                enhanced: true
              },
              { 
                id: 'negative_funding', 
                label: '💵 Negative Funding', 
                desc: 'Shorts paying longs',
                type: 'signal',
                enhanced: true
              },
            ].map((filter) => {
              const isActive = filter.type === 'preset' 
                ? preset === filter.id 
                : signalFilters.has(filter.id);
              const isDisabled = filter.enhanced && !useEnhancedAPI;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    if (filter.type === 'preset') {
                      setPreset(preset === filter.id ? null : filter.id);
                      setRsiFilter(null);
                    } else {
                      toggleSignalFilter(filter.id);
                    }
                  }}
                  disabled={isDisabled}
                  className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                      : darkMode
                      ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {filter.label}
                  {/* Tooltip */}
                  <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 ${
                    darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                  }`}>
                    {filter.desc}
                    {filter.enhanced && <div className="text-[10px] opacity-75 mt-1">Top 250 tokens</div>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full ${
                darkMode
                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-orange-500/50 transition-all`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all font-medium ${
                  cat === c.id
                    ? darkMode
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-900 text-white'
                    : darkMode
                    ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPreset(null);
                setRsiFilter(null);
              }}
              className={`${
                darkMode
                  ? 'bg-gray-900 border-white/10 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              } border rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer appearance-none min-w-[180px]`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '40px',
              }}
            >
              <option value="rank_asc">Rank ↑</option>
              <option value="rank_desc">Rank ↓</option>
              <option value="price_desc">Price ↓</option>
              <option value="price_asc">Price ↑</option>
              <option value="rsi_asc">RSI ↑ (Oversold)</option>
              <option value="rsi_desc">RSI ↓ (Overbought)</option>
              <option value="change24h_asc">24h % ↑</option>
              <option value="change24h_desc">24h % ↓</option>
              <option value="change7d_asc">7d % ↑</option>
              <option value="change7d_desc">7d % ↓</option>
              <option value="mcap_desc">MCap ↓</option>
              <option value="volume_desc">Volume ↓</option>
            </select>
            <button
              onClick={() => (user ? setShowWL((w) => !w) : setShowLoginModal(true))}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showWL
                  ? 'bg-yellow-500 text-black'
                  : darkMode
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              ⭐ {user ? watchlist.size : ''}
            </button>
            {!showWL && (
              <button
                onClick={() => setShowLowVolume((v) => !v)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  showLowVolume
                    ? darkMode
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-orange-100 text-orange-600 border border-orange-300'
                    : darkMode
                    ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                title={showLowVolume ? 'Showing all tokens' : 'Showing only tokens with >$200K volume'}
              >
                {showLowVolume ? '💧 All Volume' : '💧 >$200K'}
              </button>
            )}
            <button
              onClick={exportCSV}
              className={`px-4 py-2.5 rounded-xl text-sm ${
                darkMode
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              title="Export to CSV"
            >
              📥
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className={`mt-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading market data...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-500 text-xl mb-2">⚠️ {error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Token Table */
          <div
            className={`${
              darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'
            } backdrop-blur-sm rounded-2xl border overflow-hidden`}
          >
            {/* Table Header */}
            <div
              className={`hidden lg:grid grid-cols-12 gap-2 px-5 py-3 border-b ${
                darkMode ? 'border-white/10' : 'border-gray-100'
              } text-xs text-gray-500 font-semibold uppercase tracking-wider`}
            >
              <div
                className={`col-span-2 flex items-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'rank_asc' ? 'rank_desc' : 'rank_asc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>Token</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('rank')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'rank_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'price_desc' ? 'price_asc' : 'price_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>Price</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('price')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'price_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'volume_desc' ? 'volume_asc' : 'volume_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>Volume</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('volume')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'volume_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'mcap_desc' ? 'mcap_asc' : 'mcap_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>MCap</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('mcap')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'mcap_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 text-right flex items-center justify-end gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'change24h_desc' ? 'change24h_asc' : 'change24h_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>24H</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('change24h')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'change24h_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 text-right flex items-center justify-end gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'change7d_desc' ? 'change7d_asc' : 'change7d_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>7D</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('change7d')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'change7d_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'rsi_desc' ? 'rsi_asc' : 'rsi_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
              >
                <span>RSI</span>
                <span
                  className={`transition-opacity ${
                    sortBy.startsWith('rsi')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'rsi_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div className="col-span-2 text-right">Chart</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

            {/* Table Body */}
            <div className="max-h-[58vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No tokens match your filters
                  </p>
                </div>
              ) : (
                filtered.map((t) => {
                  const rs = getRsiStyle(t.rsi);
                  const watched = watchlist.has(t.id);
                  const sparkColor =
                    t.sparkline?.length > 1
                      ? t.sparkline[t.sparkline.length - 1] >= t.sparkline[0]
                        ? '#22c55e'
                        : '#ef4444'
                      : '#6b7280';
                  return (
                    <div
                      key={t.id}
                      onClick={() => window.location.hash = `#/token/${t.id}`}
                      className={`grid grid-cols-8 lg:grid-cols-12 gap-2 px-5 py-3.5 border-b ${
                        darkMode
                          ? 'border-white/5 hover:bg-white/[0.04]'
                          : 'border-gray-100 hover:bg-gray-50'
                      } cursor-pointer transition-colors ${
                        watched ? (darkMode ? 'bg-yellow-500/[0.04]' : 'bg-yellow-50') : ''
                      }`}
                    >
                      <div className="col-span-2 flex items-center gap-3">
                        <span
                          className={`text-xs w-5 text-right ${
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                          }`}
                        >
                          {t.rank}
                        </span>
                        <img
                          src={t.image}
                          alt={t.symbol}
                          className="w-9 h-9 rounded-full shrink-0 bg-gray-800"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{t.symbol}</span>
                            {t.rsi !== null && t.rsi < 25 && <span className="text-xs">🔴</span>}
                            {t.rsi !== null && t.rsi > 75 && <span className="text-xs">🟢</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{t.name}</p>
                        </div>
                      </div>
                      <div className="col-span-1 text-center self-center font-mono text-sm">
                        {formatPrice(t.price)}
                      </div>
                      <div className="col-span-1 text-center self-center text-sm hidden lg:block">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                          {formatNumber(t.volume)}
                        </span>
                      </div>
                      <div className="col-span-1 text-center self-center text-sm hidden lg:block">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                          {formatNumber(t.mcap)}
                        </span>
                      </div>
                      <div className="col-span-1 text-right self-center text-sm hidden lg:block">
                        <span className={t.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {t.change24h >= 0 ? '+' : ''}
                          {t.change24h?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="col-span-1 text-right self-center text-sm">
                        <span className={t.change7d >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {t.change7d >= 0 ? '+' : ''}
                          {t.change7d?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="col-span-1 self-center flex justify-center">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${rs.bg} ${rs.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />
                          <span className="font-bold text-xs">
                            {t.rsi !== null ? t.rsi.toFixed(0) : '--'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 self-center hidden lg:flex justify-end">
                        <Spark data={t.sparkline} color={sparkColor} h={24} />
                      </div>
                      <div className="col-span-2 self-center flex justify-center gap-2">
                        <button
                          onClick={(e) => openTokenPage(t.id, e)}
                          className={`p-1.5 rounded-lg ${
                            darkMode
                              ? 'hover:bg-white/10 text-gray-500 hover:text-white'
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          } transition-colors`}
                          title="View details"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => toggleWatch(t.id, e)}
                          className={`text-lg hover:scale-110 transition-transform ${
                            watched
                              ? 'text-yellow-400'
                              : darkMode
                              ? 'text-gray-600 hover:text-yellow-400'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                        >
                          {watched ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Table Footer */}
            <div
              className={`px-5 py-3 border-t ${
                darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
              } flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-500`}
            >
              <span>
                {filtered.length} tokens • {stats.withRSI} with RSI
                {!showWL && !showLowVolume && (
                  <span className="ml-1 text-orange-500">• Filtered by volume &gt;$200K</span>
                )}
              </span>
              <span>Data: CoinGecko • RSI (14) • Auto-refresh 1min</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer darkMode={darkMode} />
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      )}
    </div>
  );
}
