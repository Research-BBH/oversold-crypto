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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('oversold_darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Track if we've initialized from URL (to prevent overwriting URL on first render)
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Parse filter params from URL hash
  const parseFiltersFromUrl = useCallback(() => {
    const hash = window.location.hash;
    // Only parse filters for home page (hash is empty, "#", or "#/?...")
    if (hash.startsWith('#/token/') || hash === '#/methodology' || hash === '#/watchlist' || hash === '#/terms' || hash === '#/privacy') {
      return null;
    }
    
    const queryStart = hash.indexOf('?');
    if (queryStart === -1) return {};
    
    const params = new URLSearchParams(hash.slice(queryStart + 1));
    const filters = {};
    
    if (params.has('rsi')) filters.rsi = params.get('rsi');
    if (params.has('cat')) filters.cat = params.get('cat');
    if (params.has('preset')) filters.preset = params.get('preset');
    if (params.has('sort')) filters.sort = params.get('sort');
    if (params.has('signals')) {
      filters.signals = params.get('signals').split(',').filter(Boolean);
    }
    if (params.has('page')) {
      const pageNum = parseInt(params.get('page'), 10);
      if (!isNaN(pageNum) && pageNum > 0) filters.page = pageNum;
    }
    
    return filters;
  }, []);

  // Update URL with current filters
  const updateUrlWithFilters = useCallback(() => {
    // Don't update URL if we're on a subpage
    if (currentPage !== 'home') return;
    
    const params = new URLSearchParams();
    
    if (rsiFilter) params.set('rsi', rsiFilter);
    if (cat && cat !== 'all') params.set('cat', cat);
    if (preset) params.set('preset', preset);
    if (sortBy && sortBy !== 'rsi_asc') params.set('sort', sortBy);
    if (signalFilters.size > 0) params.set('signals', Array.from(signalFilters).join(','));
    if (tablePage > 1) params.set('page', tablePage.toString());
    
    const queryString = params.toString();
    const newHash = queryString ? `#/?${queryString}` : '#/';
    
    // Only update if different to avoid unnecessary history entries
    if (window.location.hash !== newHash && window.location.hash !== '' || queryString) {
      window.history.replaceState(null, '', newHash || window.location.pathname);
    }
  }, [rsiFilter, cat, preset, sortBy, signalFilters, tablePage, currentPage]);

  // Initialize filters from URL on mount
  useEffect(() => {
    const filters = parseFiltersFromUrl();
    if (filters && Object.keys(filters).length > 0) {
      if (filters.rsi) setRsiFilter(filters.rsi);
      if (filters.cat) setCat(filters.cat);
      if (filters.preset) setPreset(filters.preset);
      if (filters.sort) setSortBy(filters.sort);
      if (filters.signals) setSignalFilters(new Set(filters.signals));
      if (filters.page) setTablePage(filters.page);
    }
    setUrlInitialized(true);
  }, []);

  // Update URL when filters change (after initial load)
  useEffect(() => {
    if (urlInitialized) {
      updateUrlWithFilters();
    }
  }, [rsiFilter, cat, preset, sortBy, signalFilters, tablePage, urlInitialized, updateUrlWithFilters]);

  // Dark mode persistence
  useEffect(() => {
    localStorage.setItem('oversold_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      const hashPath = hash.split('?')[0]; // Get path without query params
      
      if (hashPath.startsWith('#/token/')) {
        setPageTokenId(hashPath.replace('#/token/', ''));
        setCurrentPage('token');
      } else if (hashPath === '#/methodology') {
        setPageTokenId(null);
        setCurrentPage('methodology');
      } else if (hashPath === '#/watchlist') {
        setPageTokenId(null);
        setCurrentPage('watchlist');
      } else if (hashPath === '#/terms') {
        setPageTokenId(null);
        setCurrentPage('terms');
      } else if (hashPath === '#/privacy') {
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
    // Return to home with current filters preserved
    window.location.hash = '#/';
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
          // RSI filters - updated thresholds to match symmetrical system
          case 'rsi_oversold':
            if (token.rsi === null || token.rsi >= 25) return false;
            break;
          case 'rsi_extreme':
            if (token.rsi === null || token.rsi >= 20) return false;
            break;
          case 'rsi_neutral':
            if (token.rsi === null || token.rsi < 25 || token.rsi > 75) return false;
            break;
          case 'rsi_overbought':
            if (token.rsi === null || token.rsi <= 75) return false;
            break;
          case 'rsi_overbought_extreme':
            if (token.rsi === null || token.rsi <= 80) return false;
            break;
          // Buy signal filters (bullish)
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
          case 'bullish_divergence':
            if (!token.signals || token.signals.bullishDivergence !== true) return false;
            break;
          case 'bullish_engulfing':
            if (!token.signals || token.signals.bullishEngulfing !== true) return false;
            break;
          case 'near_atl':
            // Near ATL: within 20% of all-time low
            if (token.atlChange === null || token.atlChange === undefined || token.atlChange > 20) return false;
            break;
          // Sell signal filters (bearish)
          case 'below_sma50':
            if (!token.signals || token.signals.belowSMA50 !== true) return false;
            break;
          case 'below_sma20':
            if (!token.signals || token.signals.belowSMA20 !== true) return false;
            break;
          case 'above_bb':
            if (!token.signals || token.signals.aboveBB !== true) return false;
            break;
          case 'positive_funding':
            if (!token.signals || token.signals.positiveFunding !== true) return false;
            break;
          case 'bearish_divergence':
            if (!token.signals || token.signals.bearishDivergence !== true) return false;
            break;
          case 'bearish_engulfing':
            if (!token.signals || token.signals.bearishEngulfing !== true) return false;
            break;
          case 'near_ath':
            if (!token.signals || token.signals.nearATH !== true) return false;
            break;
          case 'high_vol_mcap':
            if (!token.signals || token.signals.highVolMcap !== true) return false;
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

  // Reset to page 1 when filters change (but not on initial URL load)
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  useEffect(() => {
    if (filtersInitialized) {
      setTablePage(1);
    } else {
      setFiltersInitialized(true);
    }
  }, [search, cat, sortBy, showWL, preset, rsiFilter, signalFilters, showLowVolume]);

  // Paginated tokens for display
  const paginatedTokens = useMemo(() => {
    const startIndex = (tablePage - 1) * rowsPerPage;
    return filtered.slice(startIndex, startIndex + rowsPerPage);
  }, [filtered, tablePage, rowsPerPage]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

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

      <div className="relative z-10 max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <header className="mb-4 sm:mb-6">
          {/* Top row: logo + actions */}
          <div className="flex items-center justify-between gap-2">
            <h1
              onClick={resetFilters}
              className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                OVERSOLD
              </span>
              <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>.crypto</span>
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
              {user ? (
                <UserMenu user={user} onLogout={handleLogout} watchlistCount={watchlist.size} />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`${
                    darkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  } border px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: live status + market stats */}
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Live
                </span>
              </div>
              <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
              <span className="text-xs sm:text-sm text-gray-500">
                {lastUpdate?.toLocaleTimeString() || 'Loading...'}
              </span>
              {apiStats && (
                <>
                  <span className={`hidden sm:inline ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                  <span className="hidden sm:inline text-xs sm:text-sm text-gray-500">
                    {apiStats.withRSI}/{apiStats.total} RSI
                  </span>
                </>
              )}
            </div>
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 sm:gap-3`}
            >
              <div>
                <span className="text-gray-500">MCap</span>{' '}
                <span className="font-mono font-semibold">${formatNumber(stats.totalMcap)}</span>
              </div>
              <div className={`w-px h-4 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div>
                <span className="text-gray-500">RSI</span>
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
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {[
            { k: 'extreme', color: 'red', label: 'EXTREME', sub: 'RSI < 20' },
            { k: 'oversold', color: 'orange', label: 'OVERSOLD', sub: 'RSI < 30' },
            { k: 'neutral', color: 'gray', label: 'NEUTRAL', sub: 'RSI 30-70' },
            { k: 'overbought', color: 'green', label: 'OVERBOUGHT', sub: 'RSI > 70' },
          ].map((s) => {
            // Color mapping to avoid Tailwind dynamic class purging issues
            const colorClasses = {
              red: {
                bg: 'bg-red-500/10',
                text: 'text-red-500',
                borderActive: 'border-red-500 shadow-lg shadow-red-500/20',
                borderInactive: 'border-red-500/20 hover:border-red-500/50',
              },
              orange: {
                bg: 'bg-orange-500/10',
                text: 'text-orange-500',
                borderActive: 'border-orange-500 shadow-lg shadow-orange-500/20',
                borderInactive: 'border-orange-500/20 hover:border-orange-500/50',
              },
              gray: {
                bg: 'bg-gray-500/10',
                text: 'text-gray-500',
                borderActive: 'border-gray-500 shadow-lg shadow-gray-500/20',
                borderInactive: 'border-gray-500/20 hover:border-gray-500/50',
              },
              green: {
                bg: 'bg-green-500/10',
                text: 'text-green-500',
                borderActive: 'border-green-500 shadow-lg shadow-green-500/20',
                borderInactive: 'border-green-500/20 hover:border-green-500/50',
              },
            };
            const colors = colorClasses[s.color];
            
            return (
            <div
              key={s.k}
              onClick={() => {
                setRsiFilter(rsiFilter === s.k ? null : s.k);
                setPreset(null);
              }}
              className={`${colors.bg} border-2 rounded-xl p-4 text-center transition-all cursor-pointer hover:scale-[1.02] ${
                rsiFilter === s.k
                  ? colors.borderActive
                  : colors.borderInactive
              }`}
            >
              <p className={`text-3xl font-bold ${colors.text}`}>{stats[s.k]}</p>
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
          )})}
        </div>

        {/* RSI Filter indicator */}
        {rsiFilter && (
          <div
            className={`flex items-center gap-2 mb-4 px-3 py-2 ${
              darkMode ? 'bg-white/5' : 'bg-white border border-gray-200'
            } rounded-xl w-fit max-w-full`}
          >
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
        {/* ── Unified Filters ── */}
        <div className="mb-4 sm:mb-5">

          {/* ── MOBILE: collapsible panel ── */}
          <div className="lg:hidden">
            {/* Toggle button row */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setShowMobileFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  showMobileFilters
                    ? darkMode ? 'bg-white/10 text-white border border-white/20' : 'bg-gray-200 text-gray-900 border border-gray-300'
                    : darkMode ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                <span>🎯 Filters</span>
                {(signalFilters.size > 0 || preset) && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {signalFilters.size + (preset ? 1 : 0)}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {(signalFilters.size > 0 || preset) && (
                <button
                  onClick={() => { setSignalFilters(new Set()); setPreset(null); }}
                  className={`text-xs px-3 py-2 rounded-xl font-medium transition-colors ${
                    darkMode
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Expandable filter panel */}
            {showMobileFilters && (
              <div className={`rounded-2xl border p-3 space-y-3 mb-2 ${
                darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'
              }`}>
                {[
                  {
                    label: 'RSI', colorDark: 'bg-purple-500/10 text-purple-400', colorLight: 'bg-purple-50 text-purple-600',
                    filters: [
                      { id: 'rsi_extreme', label: '🔴 Extreme' },
                      { id: 'rsi_oversold', label: '🟠 Oversold' },
                      { id: 'rsi_neutral', label: '⚪ Neutral' },
                      { id: 'rsi_overbought', label: '🟢 Overbought' },
                      { id: 'rsi_overbought_extreme', label: '🔵 Extreme OB' },
                    ],
                    type: 'signal',
                    activeGradient: 'from-purple-500 to-indigo-500',
                    shadow: 'shadow-purple-500/20',
                  },
                  {
                    label: 'MOVERS', colorDark: 'bg-blue-500/10 text-blue-400', colorLight: 'bg-blue-50 text-blue-600',
                    filters: [
                      { id: 'losers24h', label: '📉 24h Losers' },
                      { id: 'losers7d', label: '📉 7d Losers' },
                      { id: 'gainers', label: '📈 24h Gainers' },
                      { id: 'gainers7d', label: '📈 7d Gainers' },
                    ],
                    type: 'preset',
                    activeGradient: 'from-blue-500 to-cyan-500',
                    shadow: 'shadow-blue-500/20',
                  },
                  {
                    label: 'BUY', colorDark: 'bg-green-500/10 text-green-400', colorLight: 'bg-green-50 text-green-600',
                    filters: [
                      { id: 'above_sma50', label: '▲ Uptrend', enhanced: true },
                      { id: 'below_bb', label: '▲ Below BB', enhanced: true },
                      { id: 'negative_funding', label: '▲ Neg Funding', enhanced: true },
                      { id: 'bullish_divergence', label: '▲ Bull Div', enhanced: true },
                      { id: 'bullish_engulfing', label: '▲ Bull Engulf', enhanced: true },
                      { id: 'near_atl', label: '▲ Near ATL' },
                      { id: 'volume_spike', label: '▲ Vol Spike', enhanced: true },
                    ],
                    type: 'signal',
                    activeGradient: 'from-green-500 to-emerald-500',
                    shadow: 'shadow-green-500/20',
                  },
                  {
                    label: 'SELL', colorDark: 'bg-red-500/10 text-red-400', colorLight: 'bg-red-50 text-red-600',
                    filters: [
                      { id: 'below_sma50', label: '▼ Downtrend', enhanced: true },
                      { id: 'above_bb', label: '▼ Above BB', enhanced: true },
                      { id: 'positive_funding', label: '▼ Pos Funding', enhanced: true },
                      { id: 'bearish_divergence', label: '▼ Bear Div', enhanced: true },
                      { id: 'bearish_engulfing', label: '▼ Bear Engulf', enhanced: true },
                      { id: 'near_ath', label: '▼ Near ATH', enhanced: true },
                      { id: 'high_vol_mcap', label: '▼ High V/MC' },
                    ],
                    type: 'signal',
                    activeGradient: 'from-red-500 to-pink-500',
                    shadow: 'shadow-red-500/20',
                  },
                ].map((group) => (
                  <div key={group.label}>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-1.5 ${darkMode ? group.colorDark : group.colorLight}`}>
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.filters.map((filter) => {
                        const isActive = group.type === 'preset' ? preset === filter.id : signalFilters.has(filter.id);
                        const isDisabled = filter.enhanced && !useEnhancedAPI;
                        return (
                          <button
                            key={filter.id}
                            disabled={isDisabled}
                            onClick={() => {
                              if (group.type === 'preset') {
                                setPreset(preset === filter.id ? null : filter.id);
                                setRsiFilter(null);
                              } else {
                                toggleSignalFilter(filter.id);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              isActive
                                ? `bg-gradient-to-r ${group.activeGradient} text-white shadow-md ${group.shadow}`
                                : darkMode
                                ? 'bg-white/5 text-gray-400 border border-white/10'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── DESKTOP: original 4-row horizontal layout ── */}
          <div className="hidden sm:block">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                🎯 Filters
              </span>
              {(signalFilters.size > 0 || preset) && (
                <button
                  onClick={() => { setSignalFilters(new Set()); setPreset(null); }}
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

            {/* Row 1: RSI */}
            <div className="flex gap-2 mb-2">
              <span className={`w-16 flex-shrink-0 text-[10px] font-semibold px-2 py-2 rounded-lg text-center ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>RSI</span>
              <div className="flex gap-2 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'rsi_extreme', label: '🔴 Extreme', desc: 'RSI below 20' },
                  { id: 'rsi_oversold', label: '🟠 Oversold', desc: 'RSI below 25' },
                  { id: 'rsi_neutral', label: '⚪ Neutral', desc: 'RSI 25-75' },
                  { id: 'rsi_overbought', label: '🟢 Overbought', desc: 'RSI above 75' },
                  { id: 'rsi_overbought_extreme', label: '🔵 Extreme OB', desc: 'RSI above 80' },
                ].map((filter) => {
                  const isActive = signalFilters.has(filter.id);
                  return (
                    <button key={filter.id} onClick={() => toggleSignalFilter(filter.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative ${
                        isActive ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20'
                          : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}>
                      {filter.label}
                      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>{filter.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: MOVERS */}
            <div className="flex gap-2 mb-2">
              <span className={`w-16 flex-shrink-0 text-[10px] font-semibold px-2 py-2 rounded-lg text-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>MOVERS</span>
              <div className="flex gap-2 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'losers24h', label: '📉 24h Losers', desc: 'Biggest 24h drops' },
                  { id: 'losers7d', label: '📉 7d Losers', desc: 'Biggest 7d drops' },
                  { id: 'gainers', label: '📈 24h Gainers', desc: 'Biggest 24h gains' },
                  { id: 'gainers7d', label: '📈 7d Gainers', desc: 'Biggest 7d gains' },
                ].map((filter) => {
                  const isActive = preset === filter.id;
                  return (
                    <button key={filter.id} onClick={() => { setPreset(preset === filter.id ? null : filter.id); setRsiFilter(null); }}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative ${
                        isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                          : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}>
                      {filter.label}
                      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>{filter.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: BUY */}
            <div className="flex gap-2 mb-2">
              <span className={`w-16 flex-shrink-0 text-[10px] font-semibold px-2 py-2 rounded-lg text-center ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>BUY</span>
              <div className="flex gap-2 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'above_sma50', label: '▲ Uptrend', desc: 'Price above SMA50', enhanced: true },
                  { id: 'below_bb', label: '▲ Below BB', desc: 'Below lower Bollinger Band', enhanced: true },
                  { id: 'negative_funding', label: '▲ Neg Funding', desc: 'Shorts paying longs', enhanced: true },
                  { id: 'bullish_divergence', label: '▲ Bull Divergence', desc: 'Price ↓ but RSI ↑', enhanced: true },
                  { id: 'bullish_engulfing', label: '▲ Bull Engulf', desc: 'Bullish engulfing candle', enhanced: true },
                  { id: 'near_atl', label: '▲ Near ATL', desc: 'Within 20% of all-time low', enhanced: false },
                  { id: 'volume_spike', label: '▲ Vol Spike', desc: 'Volume > 1.5x average', enhanced: true },
                ].map((filter) => {
                  const isActive = signalFilters.has(filter.id);
                  const isDisabled = filter.enhanced && !useEnhancedAPI;
                  return (
                    <button key={filter.id} onClick={() => toggleSignalFilter(filter.id)} disabled={isDisabled}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20'
                          : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}>
                      {filter.label}
                      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>{filter.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: SELL */}
            <div className="flex gap-2">
              <span className={`w-16 flex-shrink-0 text-[10px] font-semibold px-2 py-2 rounded-lg text-center ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>SELL</span>
              <div className="flex gap-2 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'below_sma50', label: '▼ Downtrend', desc: 'Price below SMA50', enhanced: true },
                  { id: 'above_bb', label: '▼ Above BB', desc: 'Above upper Bollinger Band', enhanced: true },
                  { id: 'positive_funding', label: '▼ Pos Funding', desc: 'Longs paying shorts', enhanced: true },
                  { id: 'bearish_divergence', label: '▼ Bear Divergence', desc: 'Price ↑ but RSI ↓', enhanced: true },
                  { id: 'bearish_engulfing', label: '▼ Bear Engulf', desc: 'Bearish engulfing candle', enhanced: true },
                  { id: 'near_ath', label: '▼ Near ATH', desc: 'Within 10% of all-time high', enhanced: true },
                  { id: 'high_vol_mcap', label: '▼ High V/MC', desc: 'Volume > 10% market cap', enhanced: false },
                ].map((filter) => {
                  const isActive = signalFilters.has(filter.id);
                  const isDisabled = filter.enhanced && !useEnhancedAPI;
                  return (
                    <button key={filter.id} onClick={() => toggleSignalFilter(filter.id)} disabled={isDisabled}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/20'
                          : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}>
                      {filter.label}
                      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>{filter.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-5">
          {/* Row 1: Search + utility buttons */}
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } border rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:border-orange-500/50 transition-all text-sm`}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            </div>
            <button
              onClick={() => (user ? setShowWL((w) => !w) : setShowLoginModal(true))}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
                showWL
                  ? 'bg-yellow-500 text-black'
                  : darkMode
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              title="Watchlist"
            >
              ⭐{user && watchlist.size > 0 ? <span className="ml-1">{watchlist.size}</span> : null}
            </button>
            <button
              onClick={exportCSV}
              className={`px-3 py-2.5 rounded-xl text-sm shrink-0 ${
                darkMode
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              title="Export to CSV"
            >
              📥
            </button>
          </div>

          {/* Row 2: Categories + sort + volume */}
          <div className="flex flex-col sm:flex-row gap-2">

            {/* ── MOBILE: native select dropdown ── */}
            <div className="lg:hidden">
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Category
                </span>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className={`w-full rounded-xl pl-20 pr-9 py-2 text-sm font-medium cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                    darkMode
                      ? 'bg-white/5 border border-white/10 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  } ${cat !== 'all' ? 'border-orange-500/50 text-orange-400' : ''}`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── DESKTOP: original scrollable pill row ── */}
            <div className="hidden sm:flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium ${
                    cat === c.id
                      ? darkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                      : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!showWL && (
                <button
                  onClick={() => setShowLowVolume((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    !showLowVolume
                      ? darkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-blue-100 text-blue-600 border border-blue-300'
                      : darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  title={!showLowVolume ? 'Volume filter active: Only showing >$200K' : 'Volume filter off: Showing all tokens'}
                >
                  💧 {!showLowVolume ? '>$200K' : 'All'}
                </button>
              )}
              <div className="relative ml-auto">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPreset(null);
                    setRsiFilter(null);
                  }}
                  className={`${
                    darkMode ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } border rounded-xl pl-12 py-2 text-xs focus:outline-none cursor-pointer appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '14px',
                    paddingRight: '30px',
                  }}
                >
                  <option value="rank_asc">Rank ↑</option>
                  <option value="rank_desc">Rank ↓</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="volume_asc">Volume ↑</option>
                  <option value="volume_desc">Volume ↓</option>
                  <option value="mcap_asc">MCap ↑</option>
                  <option value="mcap_desc">MCap ↓</option>
                  <option value="rsi_asc">RSI ↑</option>
                  <option value="rsi_desc">RSI ↓</option>
                  <option value="signalScore_desc">Signal ↓</option>
                  <option value="signalScore_asc">Signal ↑</option>
                  <option value="change24h_asc">24h ↑</option>
                  <option value="change24h_desc">24h ↓</option>
                  <option value="change7d_asc">7d ↑</option>
                  <option value="change7d_desc">7d ↓</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          /* Skeleton Loading State */
          <div
            className={`${
              darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'
            } backdrop-blur-sm rounded-2xl border overflow-hidden`}
          >
            {/* Skeleton Table Header */}
            <div
              className={`hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b ${
                darkMode ? 'border-white/10' : 'border-gray-100'
              }`}
            >
              <div className="col-span-2"><div className={`h-3 w-16 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-1 flex justify-end"><div className={`h-3 w-12 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-1 flex justify-end"><div className={`h-3 w-14 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-1 flex justify-end"><div className={`h-3 w-12 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-1 flex justify-end"><div className={`h-3 w-8 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-1 flex justify-end"><div className={`h-3 w-8 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-2 flex justify-end pr-4"><div className={`h-3 w-14 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-2 flex justify-center"><div className={`h-3 w-16 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
              <div className="col-span-1 flex justify-center"><div className={`h-3 w-14 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} /></div>
            </div>
            
            {/* Skeleton Rows */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-50'}`}
              >
                {/* Desktop Skeleton Row */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-4 items-center">
                  {/* Token */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                    <div className="space-y-2">
                      <div className={`h-4 w-20 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                      <div className={`h-3 w-12 rounded animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ animationDelay: `${i * 50 + 25}ms` }} />
                    </div>
                  </div>
                  {/* Price */}
                  <div className="col-span-1 flex justify-end">
                    <div className={`h-4 w-16 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* Volume */}
                  <div className="col-span-1 flex justify-end">
                    <div className={`h-4 w-14 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* MCap */}
                  <div className="col-span-1 flex justify-end">
                    <div className={`h-4 w-16 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* 24H */}
                  <div className="col-span-1 flex justify-end">
                    <div className={`h-4 w-12 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* 7D */}
                  <div className="col-span-1 flex justify-end">
                    <div className={`h-4 w-12 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* Signal */}
                  <div className="col-span-2 flex justify-end pr-4">
                    <div className={`h-6 w-24 rounded-lg animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* Chart */}
                  <div className="col-span-2 flex justify-center">
                    <div className={`h-10 w-full max-w-[120px] rounded animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ animationDelay: `${i * 50}ms` }} />
                  </div>
                  {/* Actions */}
                  <div className="col-span-1 flex justify-center gap-1">
                    <div className={`w-8 h-8 rounded-lg animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ animationDelay: `${i * 50}ms` }} />
                    <div className={`w-8 h-8 rounded-lg animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ animationDelay: `${i * 50 + 25}ms` }} />
                  </div>
                </div>
                
                {/* Mobile Skeleton Row */}
                <div className="lg:hidden px-3 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                      <div className="space-y-1.5">
                        <div className={`h-4 w-16 rounded animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                        <div className={`h-3 w-10 rounded animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ animationDelay: `${i * 50 + 25}ms` }} />
                      </div>
                    </div>
                    <div className="text-right space-y-1.5">
                      <div className={`h-4 w-14 rounded animate-pulse ml-auto ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 50}ms` }} />
                      <div className={`h-3 w-10 rounded animate-pulse ml-auto ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ animationDelay: `${i * 50 + 25}ms` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator at bottom */}
            <div className={`px-5 py-4 flex items-center justify-center gap-3 ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
              <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading market data...</span>
            </div>
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
              className={`hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b ${
                darkMode ? 'border-white/10' : 'border-gray-100'
              } text-[11px] text-gray-500 font-semibold uppercase tracking-wider`}
            >
              <div
                className={`col-span-2 relative flex items-center cursor-pointer ${
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
                  className={`ml-1 transition-opacity ${
                    sortBy.startsWith('rank')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'rank_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 relative flex items-center justify-end cursor-pointer ${
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
                  className={`absolute -right-2.5 transition-opacity ${
                    sortBy.startsWith('price')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'price_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 relative flex items-center justify-end cursor-pointer ${
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
                  className={`absolute -right-2.5 transition-opacity ${
                    sortBy.startsWith('volume')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'volume_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 relative flex items-center justify-end cursor-pointer ${
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
                  className={`absolute -right-2.5 transition-opacity ${
                    sortBy.startsWith('mcap')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'mcap_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 relative flex items-center justify-end cursor-pointer ${
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
                  className={`absolute -right-2.5 transition-opacity ${
                    sortBy.startsWith('change24h')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'change24h_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-1 relative flex items-center justify-end cursor-pointer ${
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
                  className={`absolute -right-2.5 transition-opacity ${
                    sortBy.startsWith('change7d')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'change7d_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div
                className={`col-span-2 relative hidden lg:flex items-center justify-end pr-4 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => {
                  setSortBy(sortBy === 'signalScore_desc' ? 'signalScore_asc' : 'signalScore_desc');
                  setPreset(null);
                  setRsiFilter(null);
                }}
                title="Momentum Signal Score (-100 to +100)"
              >
                <span>SIGNAL</span>
                <span
                  className={`ml-1 transition-opacity ${
                    sortBy.startsWith('signalScore')
                      ? 'opacity-100 text-orange-500'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                >
                  {sortBy === 'signalScore_asc' ? '↑' : '↓'}
                </span>
              </div>
              <div className="col-span-2 hidden lg:flex items-center justify-center">7D Chart</div>
              <div className="col-span-1 flex items-center justify-center">Actions</div>
            </div>

            {/* Table Body */}
            <div>
              {/* Mobile column header — 2-col (< 1024px) */}
              <div className={`lg:hidden grid px-2 py-1.5 border-b gap-x-2 ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`} style={{gridTemplateColumns: '1fr auto'}}>
                <div className={`text-[10px] font-semibold uppercase tracking-wide cursor-pointer ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`} onClick={() => { setSortBy(sortBy === 'rank_asc' ? 'rank_desc' : 'rank_asc'); setPreset(null); setRsiFilter(null); }}>
                  Coin {sortBy === 'rank_asc' ? '↑' : sortBy === 'rank_desc' ? '↓' : ''}
                </div>
                <div className={`text-[10px] font-semibold uppercase tracking-wide text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Price · 24H · MCap</div>
              </div>


              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No tokens match your filters
                  </p>
                </div>
              ) : (
                paginatedTokens.map((t) => {
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
                      className={`cursor-pointer transition-colors ${
                        darkMode
                          ? 'border-white/5 hover:bg-white/[0.03]'
                          : 'border-gray-100 hover:bg-gray-50'
                      } border-b ${
                        watched ? (darkMode ? 'bg-yellow-500/[0.04]' : 'bg-yellow-50') : ''
                      }`}
                    >
                      {/* Desktop: grid row */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3">
                        {/* Token - col-span-2 */}
                        <div className="col-span-2 flex items-center gap-3">
                          <span
                            className={`text-xs w-6 text-right tabular-nums ${
                              darkMode ? 'text-gray-600' : 'text-gray-400'
                            }`}
                          >
                            {t.rank}
                          </span>
                          <img
                            src={t.image}
                            alt={t.symbol}
                            className="w-8 h-8 rounded-full shrink-0 bg-gray-800"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">{t.symbol}</span>
                              {t.rsi !== null && t.rsi < 25 && <span className="text-xs">🔴</span>}
                              {t.rsi !== null && t.rsi > 75 && <span className="text-xs">🟢</span>}
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{t.name}</p>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="col-span-1 flex items-center justify-end font-mono text-sm tabular-nums">
                          {formatPrice(t.price)}
                        </div>
                        {/* Volume */}
                        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {formatNumber(t.volume)}
                          </span>
                        </div>
                        {/* MCap */}
                        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {formatNumber(t.mcap)}
                          </span>
                        </div>
                        {/* 24H */}
                        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
                          <span className={t.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {t.change24h >= 0 ? '+' : ''}
                            {t.change24h?.toFixed(1)}%
                          </span>
                        </div>
                        {/* 7D */}
                        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
                          <span className={t.change7d >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {t.change7d >= 0 ? '+' : ''}
                            {t.change7d?.toFixed(1)}%
                          </span>
                        </div>
                        {/* Signal */}
                        <div className="col-span-2 flex items-center justify-end pr-4">
                          {t.signalScore !== undefined && t.signalScore !== null ? (
                            <div
                              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums min-w-[70px] ${
                                t.signalScore >= 50
                                  ? 'bg-green-500/20 text-green-400'
                                  : t.signalScore >= 25
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : t.signalScore > -25
                                  ? 'bg-gray-500/15 text-gray-400'
                                  : t.signalScore > -50
                                  ? 'bg-orange-500/15 text-orange-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                              title={`Signal: ${t.signalLabel || (t.signalScore >= 50 ? 'STRONG BUY' : t.signalScore >= 25 ? 'BUY' : t.signalScore > -25 ? 'NEUTRAL' : t.signalScore > -50 ? 'SELL' : 'STRONG SELL')} (${t.signalScoreDetails?.signalCount || 0} signals)`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                t.signalScore >= 50
                                  ? 'bg-green-500'
                                  : t.signalScore >= 25
                                  ? 'bg-emerald-400'
                                  : t.signalScore > -25
                                  ? 'bg-gray-400'
                                  : t.signalScore > -50
                                  ? 'bg-orange-400'
                                  : 'bg-red-500'
                              }`} />
                              <span>{t.signalScore >= 0 ? '+' : ''}{t.signalScore}</span>
                              {(t.signalScore >= 25 || t.signalScore <= -25) && (
                                <span className="text-[10px] opacity-70">
                                  {t.signalScore >= 25 ? 'BUY' : 'SELL'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-600 text-xs">--</span>
                          )}
                        </div>
                        {/* Chart */}
                        <div className="col-span-2 flex items-center justify-center">
                          <Spark data={t.sparkline} color={sparkColor} h={24} />
                        </div>
                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => openTokenPage(t.id, e)}
                            className={`p-1.5 rounded-md ${
                              darkMode
                                ? 'hover:bg-white/10 text-gray-500 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            } transition-colors`}
                            title="View details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => toggleWatch(t.id, e)}
                            className={`p-1 text-base hover:scale-110 transition-transform ${
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

                      {/* Mobile: 2-col layout — all mobile (< 1024px) */}
                      <div className="lg:hidden">
                        <div className="grid px-2 py-2.5 gap-x-2 items-center" style={{gridTemplateColumns: '1fr auto'}}>
                          {/* Left: rank + icon + symbol + sig */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] tabular-nums shrink-0 w-5 text-right ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t.rank}</span>
                            <img src={t.image} alt={t.symbol} className="w-7 h-7 rounded-full shrink-0 bg-gray-800" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="font-semibold text-xs leading-tight truncate">{t.symbol}</span>
                                {t.rsi !== null && t.rsi < 25 && <span className="text-[9px] shrink-0">🔴</span>}
                                {t.rsi !== null && t.rsi > 75 && <span className="text-[9px] shrink-0">🟢</span>}
                              </div>
                              {t.signalScore !== undefined && t.signalScore !== null ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums whitespace-nowrap mt-0.5 px-1.5 py-0.5 rounded ${
                                  t.signalScore >= 50 ? 'bg-green-500/20 text-green-400'
                                  : t.signalScore >= 25 ? 'bg-emerald-500/15 text-emerald-400'
                                  : t.signalScore > -25 ? 'bg-gray-500/15 text-gray-400'
                                  : t.signalScore > -50 ? 'bg-orange-500/15 text-orange-400'
                                  : 'bg-red-500/20 text-red-400'
                                }`}>
                                  <span className="opacity-50 font-normal">Sig</span>
                                  {t.signalScore >= 0 ? '+' : ''}{t.signalScore}
                                </span>
                              ) : (
                                <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>--</span>
                              )}
                            </div>
                          </div>
                          {/* Right: price + 24h + mcap + star stacked */}
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs tabular-nums font-semibold">{formatPrice(t.price)}</span>
                              <span className={`text-xs tabular-nums font-medium ${t.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {t.change24h >= 0 ? '+' : ''}{t.change24h?.toFixed(1)}%
                              </span>
                              <button onClick={(e) => toggleWatch(t.id, e)} className={`text-sm hover:scale-110 transition-transform shrink-0 ${watched ? 'text-yellow-400' : darkMode ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-300 hover:text-yellow-500'}`}>
                                {watched ? '★' : '☆'}
                              </button>
                            </div>
                            <span className={`text-[10px] tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              MCap ${formatNumber(t.mcap)}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {filtered.length > 0 && (
              <div
                className={`px-4 py-3 border-t ${
                  darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'
                } flex flex-col sm:flex-row items-center justify-between gap-3`}
              >
                {/* Left side - Info */}
                <div className="text-xs text-gray-500 text-center sm:text-left">
                  {((tablePage - 1) * rowsPerPage) + 1}–{Math.min(tablePage * rowsPerPage, filtered.length)} of {filtered.length} tokens
                  {!showWL && !showLowVolume && (
                    <span className="ml-1 text-orange-500">• Vol &gt;$200K</span>
                  )}
                </div>
                
                {/* Center - Page buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTablePage(1)}
                    disabled={tablePage === 1}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'hover:bg-white/10 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    ««
                  </button>
                  <button
                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'hover:bg-white/10 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    ‹
                  </button>
                  
                  {/* Page numbers - fewer on mobile */}
                  {(() => {
                    const pages = [];
                    const showPages = window.innerWidth < 640 ? 3 : 5;
                    let start = Math.max(1, tablePage - Math.floor(showPages / 2));
                    let end = Math.min(totalPages, start + showPages - 1);
                    if (end - start + 1 < showPages) {
                      start = Math.max(1, end - showPages + 1);
                    }
                    
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setTablePage(i)}
                          className={`w-8 py-1.5 rounded text-xs font-medium transition-colors ${
                            i === tablePage
                              ? 'bg-orange-500 text-white'
                              : darkMode
                              ? 'hover:bg-white/10 text-gray-400'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                    disabled={tablePage === totalPages}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'hover:bg-white/10 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setTablePage(totalPages)}
                    disabled={tablePage === totalPages}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'hover:bg-white/10 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    »»
                  </button>
                </div>
                
                {/* Right side - Rows per page */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setTablePage(1);
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:outline-none focus:ring-1 focus:ring-orange-500`}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <Footer darkMode={darkMode} />
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} darkMode={darkMode} />
      )}

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ${
          showBackToTop 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          darkMode 
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm' 
            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md'
        }`}
        aria-label="Back to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}
