// ==================================================
// FILE: src/App.jsx — Thin orchestrator
// ==================================================

import { useState, useEffect, useCallback } from 'react';
import { useDataFetcher } from './hooks/useDataFetcher';

// Hooks
import { useRouter } from './hooks/useRouter';
import { useAuth } from './hooks/useAuth';
import { useTokenFilters } from './hooks/useTokenFilters';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Layout / shared components
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

// Dashboard components
import { DashboardHeader } from './components/DashboardHeader';
import { MarketSentimentWidget } from './components/MarketSentimentWidget';
import { DashboardFilters } from './components/DashboardFilters';
import { TokenTable } from './components/TokenTable';

// Sub-pages
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { TokenDetailPage } from './pages/TokenDetailPage';

export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('oversold_darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  useEffect(() => {
    localStorage.setItem('oversold_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Back-to-top
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handle = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Mobile filter panel
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Routing
  const { currentPage, pageTokenId, goBack, openTokenPage, navigateTo } = useRouter();

  // Auth + watchlist
  const {
    user,
    watchlist,
    showLoginModal,
    setShowLoginModal,
    handleLogin,
    handleLogout,
    toggleWatch,
    setWatchlist,
  } = useAuth();

  // API data — smart fetching with ETag/304, visibility pause, error backoff
  const {
    tokens,
    loading,
    error,
    lastUpdate,
    apiStats,
    cacheHit,
    fetchData,
  } = useDataFetcher({ useEnhancedAPI: true });
  const [showWL, setShowWL] = useState(false);

  // Filters, sorting, pagination
  const filters = useTokenFilters({ tokens, watchlist, showWL });

  const resetFilters = useCallback(() => {
    filters.resetFilters();
    setShowWL(false);
  }, [filters]);

  // Keyboard shortcuts
  const {
    selectedRowIndex,
    showShortcutsModal,
    setShowShortcutsModal,
    searchInputRef,
  } = useKeyboardShortcuts({
    currentPage,
    paginatedTokens: filters.paginatedTokens,
    tablePage: filters.tablePage,
    totalPages: filters.totalPages,
    user,
    showLoginModal,
    setShowLoginModal,
    setShowWL,
    setDarkMode,
    setTablePage: filters.setTablePage,
    setWatchlist,
    fetchData,
    navigateTo,
    openTokenPage,
  });

  // Sub-page routing
  if (currentPage === 'terms')
    return <TermsPage onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (currentPage === 'privacy')
    return <PrivacyPage onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (currentPage === 'methodology')
    return <MethodologyPage onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (currentPage === 'watchlist') {
    if (!user) { window.location.hash = ''; setShowLoginModal(true); return null; }
    return (
      <WatchlistPage tokens={tokens} watchlist={watchlist} onRemove={toggleWatch}
        onBack={goBack} user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
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
    const pageToken = tokens.find((t) => t.id === pageTokenId);
    if (!pageToken) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-xl mb-2">Token not found</p>
            <button onClick={goBack} className="px-6 py-2 bg-orange-500 rounded-lg">Back</button>
          </div>
        </div>
      );
    }
    return <TokenDetailPage token={pageToken} onBack={goBack} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  // Main dashboard
  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'} selection:bg-orange-500/30`}>
      {darkMode && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
        </div>
      )}

      <div className="relative z-10 max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">

        <DashboardHeader
          darkMode={darkMode} setDarkMode={setDarkMode}
          user={user} handleLogout={handleLogout} setShowLoginModal={setShowLoginModal}
          watchlistCount={watchlist.size} stats={filters.stats}
          lastUpdate={lastUpdate} apiStats={apiStats} cacheHit={cacheHit} onLogoClick={resetFilters}
        />

        <MarketSentimentWidget
          stats={filters.stats}
          darkMode={darkMode}
          rsiFilter={filters.rsiFilter}
          setRsiFilter={filters.setRsiFilter}
          setPreset={filters.setPreset}
        />

        <DashboardFilters
          search={filters.search} setSearch={filters.setSearch} searchInputRef={searchInputRef}
          showWL={showWL} setShowWL={setShowWL} user={user} setShowLoginModal={setShowLoginModal}
          watchlistCount={watchlist.size} exportCSV={filters.exportCSV}
          cat={filters.cat} setCat={filters.setCat}
          sortBy={filters.sortBy} setSortBy={filters.setSortBy}
          showLowVolume={filters.showLowVolume} setShowLowVolume={filters.setShowLowVolume}
          signalFilters={filters.signalFilters} toggleSignalFilter={filters.toggleSignalFilter}
          clearSignalFilters={filters.clearSignalFilters}
          preset={filters.preset} setPreset={filters.setPreset}
          rsiFilter={filters.rsiFilter} setRsiFilter={filters.setRsiFilter}
          rsiSortDir={filters.rsiSortDir} setRsiSortDir={filters.setRsiSortDir}
          useEnhancedAPI={useEnhancedAPI}
          showMobileFilters={showMobileFilters} setShowMobileFilters={setShowMobileFilters}
          darkMode={darkMode}
        />

        <TokenTable
          loading={loading} error={error}
          filtered={filters.filtered} paginatedTokens={filters.paginatedTokens}
          watchlist={watchlist} darkMode={darkMode}
          sortBy={filters.sortBy} setSortBy={filters.setSortBy}
          setPreset={filters.setPreset} setRsiFilter={filters.setRsiFilter}
          tablePage={filters.tablePage} setTablePage={filters.setTablePage}
          rowsPerPage={filters.rowsPerPage} setRowsPerPage={filters.setRowsPerPage}
          totalPages={filters.totalPages} selectedRowIndex={selectedRowIndex}
          showWL={showWL} showLowVolume={filters.showLowVolume}
          fetchData={fetchData} toggleWatch={toggleWatch} openTokenPage={openTokenPage}
        />

        <Footer darkMode={darkMode} />
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} darkMode={darkMode} />
      )}
      <KeyboardShortcutsModal show={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} darkMode={darkMode} />

      <button
        onClick={() => setShowShortcutsModal(true)}
        className={`fixed bottom-6 left-6 z-40 p-3 rounded-full shadow-lg transition-all duration-300 hidden sm:flex items-center justify-center ${
          darkMode ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md'
        }`}
        aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </button>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          darkMode ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md'
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
