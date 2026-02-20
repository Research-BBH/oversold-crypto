import { CATEGORIES } from '../utils';
import { ScrollableRow } from './ScrollableRow';

// ─── Data definitions ─────────────────────────────────────────────────────────

const RSI_FILTERS = [
  { id: 'rsi_extreme',         label: '🔴 Extreme',    desc: 'RSI below 20' },
  { id: 'rsi_oversold',        label: '🟠 Oversold',   desc: 'RSI below 25' },
  { id: 'rsi_neutral',         label: '⚪ Neutral',    desc: 'RSI 25-75' },
  { id: 'rsi_overbought',      label: '🟢 Overbought', desc: 'RSI above 75' },
  { id: 'rsi_overbought_extreme', label: '🔵 Extreme OB', desc: 'RSI above 80' },
];

const MOVER_FILTERS = [
  { id: 'losers24h',  label: '📉 24h Losers', desc: 'Biggest 24h drops' },
  { id: 'losers7d',   label: '📉 7d Losers',  desc: 'Biggest 7d drops' },
  { id: 'gainers',    label: '📈 24h Gainers', desc: 'Biggest 24h gains' },
  { id: 'gainers7d',  label: '📈 7d Gainers', desc: 'Biggest 7d gains' },
];

const BUY_FILTERS = [
  { id: 'above_sma50',       label: '▲ Uptrend',      desc: 'Price above SMA50', enhanced: true },
  { id: 'below_bb',          label: '▲ Below BB',     desc: 'Below lower Bollinger Band', enhanced: true },
  { id: 'negative_funding',  label: '▲ Neg Funding',  desc: 'Shorts paying longs', enhanced: true },
  { id: 'bullish_divergence',label: '▲ Bull Divergence', desc: 'Price ↓ but RSI ↑', enhanced: true },
  { id: 'bullish_engulfing', label: '▲ Bull Engulf',  desc: 'Bullish engulfing candle', enhanced: true },
  { id: 'near_atl',          label: '▲ Near ATL',     desc: 'Within 50% of all-time low' },
  { id: 'volume_spike',      label: '▲ Vol Spike',    desc: 'Volume > 1.5x average', enhanced: true },
  { id: 'macd_bullish_cross', label: '▲ MACD Cross',   desc: 'MACD crossed above signal line', enhanced: true },
  { id: 'stoch_oversold',     label: '▲ StochRSI OS',  desc: 'Stoch RSI below 20 (oversold)', enhanced: true },
  { id: 'stoch_bullish_cross',label: '▲ StochRSI ↑',   desc: 'Stoch RSI K crossed above D', enhanced: true },
];

const SELL_FILTERS = [
  { id: 'below_sma50',       label: '▼ Downtrend',   desc: 'Price below SMA50', enhanced: true },
  { id: 'above_bb',          label: '▼ Above BB',    desc: 'Above upper Bollinger Band', enhanced: true },
  { id: 'positive_funding',  label: '▼ Pos Funding', desc: 'Longs paying shorts', enhanced: true },
  { id: 'bearish_divergence',label: '▼ Bear Divergence', desc: 'Price ↑ but RSI ↓', enhanced: true },
  { id: 'bearish_engulfing', label: '▼ Bear Engulf', desc: 'Bearish engulfing candle', enhanced: true },
  { id: 'near_ath',          label: '▼ Near ATH',    desc: 'Within 10% of all-time high', enhanced: true },
  { id: 'high_vol_mcap',     label: '▼ High V/MC',   desc: 'Volume > 10% market cap' },
  { id: 'macd_bearish_cross', label: '▼ MACD Cross',   desc: 'MACD crossed below signal line', enhanced: true },
  { id: 'stoch_overbought',   label: '▼ StochRSI OB',  desc: 'Stoch RSI above 80 (overbought)', enhanced: true },
  { id: 'stoch_bearish_cross',label: '▼ StochRSI ↓',   desc: 'Stoch RSI K crossed below D', enhanced: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({ label, isActive, isDisabled, activeClass, onClick, desc }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`flex-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive ? activeClass : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
      }`}
    >
      {label}
      {desc && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 bg-gray-800 text-white">
          {desc}
        </span>
      )}
    </button>
  );
}

function FilterPillLight({ label, isActive, isDisabled, activeClass, darkMode, onClick, desc }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`flex-1 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium group relative disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive
          ? activeClass
          : darkMode
          ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {label}
      {desc && (
        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>
          {desc}
        </span>
      )}
    </button>
  );
}

// ─── RSI indicator bar ────────────────────────────────────────────────────────

function RsiIndicator({ rsiFilter, rsiSortDir, setRsiSortDir, setRsiFilter, darkMode }) {
  if (!rsiFilter) return null;
  return (
    <div className={`flex items-center gap-2 mb-4 px-3 py-2 ${darkMode ? 'bg-white/5' : 'bg-white border border-gray-200'} rounded-xl w-fit max-w-full`}>
      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Showing: <span className={`font-medium capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{rsiFilter}</span>
      </span>
      <div className={`flex items-center gap-1 border-l ${darkMode ? 'border-white/10' : 'border-gray-200'} pl-3`}>
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
        className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} ml-1 text-lg`}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Desktop signal filters ───────────────────────────────────────────────────

function DesktopSignalFilters({ signalFilters, toggleSignalFilter, preset, setPreset, setRsiFilter, useEnhancedAPI, darkMode }) {
  const hasActive = signalFilters.size > 0 || preset;

  const clearAll = () => {
    toggleSignalFilter.__clearAll?.();
  };

  return (
    <div className="hidden sm:block">
      <div className="flex items-center gap-3 mb-2 sm:mb-3">
        <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>🎯 Filters</span>
        {hasActive && (
          <button
            onClick={() => { signalFilters.forEach((f) => toggleSignalFilter(f)); setPreset(null); }}
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

      {/* RSI row */}
      <div className="flex gap-2 mb-2">
        <RowLabel label="RSI" colorDark="bg-purple-500/10 text-purple-400" colorLight="bg-purple-50 text-purple-600" darkMode={darkMode} />
        <ScrollableRow darkMode={darkMode}>
          {RSI_FILTERS.map((f) => (
            <FilterPillLight key={f.id} label={f.label} desc={f.desc} isActive={signalFilters.has(f.id)} isDisabled={false} darkMode={darkMode}
              activeClass="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20"
              onClick={() => toggleSignalFilter(f.id)} />
          ))}
        </ScrollableRow>
      </div>

      {/* MOVERS row */}
      <div className="flex gap-2 mb-2">
        <RowLabel label="MOVERS" colorDark="bg-blue-500/10 text-blue-400" colorLight="bg-blue-50 text-blue-600" darkMode={darkMode} />
        <ScrollableRow darkMode={darkMode}>
          {MOVER_FILTERS.map((f) => (
            <FilterPillLight key={f.id} label={f.label} desc={f.desc} isActive={preset === f.id} isDisabled={false} darkMode={darkMode}
              activeClass="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
              onClick={() => { setPreset(preset === f.id ? null : f.id); setRsiFilter(null); }} />
          ))}
        </ScrollableRow>
      </div>

      {/* BUY row */}
      <div className="flex gap-2 mb-2">
        <RowLabel label="BUY" colorDark="bg-green-500/10 text-green-400" colorLight="bg-green-50 text-green-600" darkMode={darkMode} />
        <ScrollableRow darkMode={darkMode}>
          {BUY_FILTERS.map((f) => (
            <FilterPillLight key={f.id} label={f.label} desc={f.desc} isActive={signalFilters.has(f.id)} isDisabled={f.enhanced && !useEnhancedAPI} darkMode={darkMode}
              activeClass="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20"
              onClick={() => toggleSignalFilter(f.id)} />
          ))}
        </ScrollableRow>
      </div>

      {/* SELL row */}
      <div className="flex gap-2">
        <RowLabel label="SELL" colorDark="bg-red-500/10 text-red-400" colorLight="bg-red-50 text-red-600" darkMode={darkMode} />
        <ScrollableRow darkMode={darkMode}>
          {SELL_FILTERS.map((f) => (
            <FilterPillLight key={f.id} label={f.label} desc={f.desc} isActive={signalFilters.has(f.id)} isDisabled={f.enhanced && !useEnhancedAPI} darkMode={darkMode}
              activeClass="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/20"
              onClick={() => toggleSignalFilter(f.id)} />
          ))}
        </ScrollableRow>
      </div>
    </div>
  );
}

function RowLabel({ label, colorDark, colorLight, darkMode }) {
  return (
    <span className={`w-16 flex-shrink-0 text-[10px] font-semibold px-2 py-2 rounded-lg text-center ${darkMode ? colorDark : colorLight}`}>
      {label}
    </span>
  );
}

// ─── Mobile signal filters ────────────────────────────────────────────────────

const MOBILE_GROUPS = [
  {
    label: 'RSI', type: 'signal',
    colorDark: 'bg-purple-500/10 text-purple-400', colorLight: 'bg-purple-50 text-purple-600',
    activeGradient: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/20',
    filters: RSI_FILTERS.map((f) => ({ id: f.id, label: f.label })),
  },
  {
    label: 'MOVERS', type: 'preset',
    colorDark: 'bg-blue-500/10 text-blue-400', colorLight: 'bg-blue-50 text-blue-600',
    activeGradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20',
    filters: MOVER_FILTERS.map((f) => ({ id: f.id, label: f.label })),
  },
  {
    label: 'BUY', type: 'signal',
    colorDark: 'bg-green-500/10 text-green-400', colorLight: 'bg-green-50 text-green-600',
    activeGradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20',
    filters: BUY_FILTERS.map((f) => ({ id: f.id, label: f.label, enhanced: f.enhanced })),
  },
  {
    label: 'SELL', type: 'signal',
    colorDark: 'bg-red-500/10 text-red-400', colorLight: 'bg-red-50 text-red-600',
    activeGradient: 'from-red-500 to-pink-500', shadow: 'shadow-red-500/20',
    filters: SELL_FILTERS.map((f) => ({ id: f.id, label: f.label, enhanced: f.enhanced })),
  },
];

function MobileSignalFilters({ signalFilters, toggleSignalFilter, preset, setPreset, setRsiFilter, useEnhancedAPI, darkMode, showMobileFilters, setShowMobileFilters, clearSignalFilters }) {
  const activeCount = signalFilters.size + (preset ? 1 : 0);

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowMobileFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            showMobileFilters
              ? darkMode ? 'bg-white/10 text-white border border-white/20' : 'bg-gray-200 text-gray-900 border border-gray-300'
              : darkMode ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <span>🎯 Filters</span>
          {activeCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {activeCount}
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {activeCount > 0 && (
          <button
            onClick={clearSignalFilters}
            className={`text-xs px-3 py-2 rounded-xl font-medium transition-colors ${
              darkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            Clear
          </button>
        )}
      </div>

      {showMobileFilters && (
        <div className={`rounded-2xl border p-3 space-y-3 mb-2 ${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'}`}>
          {MOBILE_GROUPS.map((group) => (
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
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardFilters({
  // Search
  search, setSearch, searchInputRef,
  // Watchlist
  showWL, setShowWL, user, setShowLoginModal, watchlistCount,
  // Export
  exportCSV,
  // Category
  cat, setCat,
  // Sort
  sortBy, setSortBy,
  // Low volume
  showLowVolume, setShowLowVolume,
  // Signal filters
  signalFilters, toggleSignalFilter, clearSignalFilters,
  preset, setPreset,
  rsiFilter, setRsiFilter,
  rsiSortDir, setRsiSortDir,
  useEnhancedAPI,
  // Mobile filter panel
  showMobileFilters, setShowMobileFilters,
  darkMode,
}) {
  return (
    <>
      {/* RSI active filter indicator */}
      <RsiIndicator
        rsiFilter={rsiFilter}
        rsiSortDir={rsiSortDir}
        setRsiSortDir={setRsiSortDir}
        setRsiFilter={setRsiFilter}
        darkMode={darkMode}
      />

      {/* Signal filter rows */}
      <div className="mb-4 sm:mb-5">
        <MobileSignalFilters
          signalFilters={signalFilters}
          toggleSignalFilter={toggleSignalFilter}
          preset={preset}
          setPreset={setPreset}
          setRsiFilter={setRsiFilter}
          useEnhancedAPI={useEnhancedAPI}
          darkMode={darkMode}
          showMobileFilters={showMobileFilters}
          setShowMobileFilters={setShowMobileFilters}
          clearSignalFilters={clearSignalFilters}
        />
        <DesktopSignalFilters
          signalFilters={signalFilters}
          toggleSignalFilter={toggleSignalFilter}
          preset={preset}
          setPreset={setPreset}
          setRsiFilter={setRsiFilter}
          useEnhancedAPI={useEnhancedAPI}
          darkMode={darkMode}
        />
      </div>

      {/* Search bar + utility buttons */}
      <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tokens... (press /)"
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
            ⭐{user && watchlistCount > 0 ? <span className="ml-1">{watchlistCount}</span> : null}
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

        {/* Categories + sort + low volume toggle */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Mobile: native select */}
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

          {/* Desktop: scrollable category pills */}
          <ScrollableRow darkMode={darkMode} className="hidden sm:flex gap-1.5">
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
          </ScrollableRow>

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
    </>
  );
}
