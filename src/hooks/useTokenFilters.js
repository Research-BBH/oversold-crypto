import { useState, useEffect, useMemo, useCallback } from 'react';
import { PRESETS } from '../utils';

function parseFiltersFromUrl() {
  const hash = window.location.hash;
  if (
    hash.startsWith('#/token/') ||
    hash === '#/methodology' ||
    hash === '#/watchlist' ||
    hash === '#/terms' ||
    hash === '#/privacy'
  ) {
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
}

export function useTokenFilters({ tokens, watchlist, showWL }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [sortBy, setSortBy] = useState('rsi_asc');
  const [preset, setPreset] = useState(null);
  const [rsiFilter, setRsiFilter] = useState(null);
  const [rsiSortDir, setRsiSortDir] = useState('desc');
  const [signalFilters, setSignalFilters] = useState(new Set());
  const [showLowVolume, setShowLowVolume] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Initialize from URL on mount
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

  // Sync filters back to URL (home page only)
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (rsiFilter) params.set('rsi', rsiFilter);
    if (cat && cat !== 'all') params.set('cat', cat);
    if (preset) params.set('preset', preset);
    if (sortBy && sortBy !== 'rsi_asc') params.set('sort', sortBy);
    if (signalFilters.size > 0) params.set('signals', Array.from(signalFilters).join(','));
    if (tablePage > 1) params.set('page', tablePage.toString());

    const queryString = params.toString();
    const newHash = queryString ? `#/?${queryString}` : '#/';
    if (window.location.hash !== newHash || queryString) {
      window.history.replaceState(null, '', newHash || window.location.pathname);
    }
  }, [rsiFilter, cat, preset, sortBy, signalFilters, tablePage]);

  useEffect(() => {
    if (urlInitialized) updateUrlWithFilters();
  }, [rsiFilter, cat, preset, sortBy, signalFilters, tablePage, urlInitialized, updateUrlWithFilters]);

  // Reset to page 1 when filters change (but not on first init)
  useEffect(() => {
    if (filtersInitialized) {
      setTablePage(1);
    } else {
      setFiltersInitialized(true);
    }
  }, [search, cat, sortBy, showWL, preset, rsiFilter, signalFilters, showLowVolume]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setCat('all');
    setPreset(null);
    setRsiFilter(null);
    setRsiSortDir('desc');
    setSortBy('rsi_asc');
    setSignalFilters(new Set());
    setShowLowVolume(false);
  }, []);

  const toggleSignalFilter = useCallback((signalType) => {
    setSignalFilters((prev) => {
      const next = new Set(prev);
      next.has(signalType) ? next.delete(signalType) : next.add(signalType);
      return next;
    });
    setRsiFilter(null);
  }, []);

  const clearSignalFilters = useCallback(() => {
    setSignalFilters(new Set());
    setPreset(null);
  }, []);

  // Derived: filtered + sorted token list
  const filtered = useMemo(() => {
    let r = [...tokens];

    if (search) {
      const s = search.toLowerCase();
      r = r.filter((t) => t.name?.toLowerCase().includes(s) || t.symbol?.toLowerCase().includes(s));
    }
    if (cat !== 'all') r = r.filter((t) => t.category === cat);
    if (showWL) r = r.filter((t) => watchlist.has(t.id));
    if (!showWL && !showLowVolume) r = r.filter((t) => t.volume >= 200000);

    if (preset) {
      const p = PRESETS.find((x) => x.id === preset);
      if (p) r = r.filter(p.filter);
    }

    if (rsiFilter === 'extreme') r = r.filter((t) => t.rsi !== null && t.rsi < 20);
    else if (rsiFilter === 'oversold') r = r.filter((t) => t.rsi !== null && t.rsi >= 20 && t.rsi < 30);
    else if (rsiFilter === 'neutral') r = r.filter((t) => t.rsi !== null && t.rsi >= 30 && t.rsi < 70);
    else if (rsiFilter === 'overbought') r = r.filter((t) => t.rsi !== null && t.rsi >= 70);

    if (signalFilters.size > 0) {
      r = r.filter((token) => {
        for (const signalType of signalFilters) {
          switch (signalType) {
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
              if (!token.signals || token.signals.nearATL !== true) return false;
              break;
            case 'below_sma50':
              if (!token.signals || token.signals.belowSMA50 !== true) return false;
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
            case 'losers24h':
              if (token.change24h === null || token.change24h >= 0) return false;
              break;
            case 'losers7d':
              if (token.change7d === null || token.change7d >= 0) return false;
              break;
            case 'gainers':
              if (token.change24h === null || token.change24h <= 0) return false;
              break;
            case 'gainers7d':
              if (token.change7d === null || token.change7d <= 0) return false;
              break;
            case 'near_ath':
              if (!token.signals || token.signals.nearATH !== true) return false;
              break;
            case 'high_vol_mcap':
              if (!token.signals || token.signals.highVolMcap !== true) return false;
              break;
            default:
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
      let va = a[field];
      let vb = b[field];
      if (va === null || va === undefined) va = dir === 'asc' ? Infinity : -Infinity;
      if (vb === null || vb === undefined) vb = dir === 'asc' ? Infinity : -Infinity;
      return dir === 'asc' ? va - vb : vb - va;
    });

    return r;
  }, [tokens, search, cat, sortBy, showWL, watchlist, preset, rsiFilter, rsiSortDir, signalFilters, showLowVolume]);

  const paginatedTokens = useMemo(() => {
    const startIndex = (tablePage - 1) * rowsPerPage;
    return filtered.slice(startIndex, startIndex + rowsPerPage);
  }, [filtered, tablePage, rowsPerPage]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  // Market summary stats derived from all tokens (not just filtered)
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
    const headers = ['Rank', 'Symbol', 'Name', 'Price', '1h%', '24h%', '7d%', '30d%', 'RSI', 'MCap', 'Volume', 'Category'];
    const rows = filtered.map((t) => [
      t.rank, t.symbol, t.name, t.price,
      t.change1h?.toFixed(2), t.change24h?.toFixed(2),
      t.change7d?.toFixed(2), t.change30d?.toFixed(2),
      t.rsi?.toFixed(1), t.mcap, t.volume, t.category,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oversold_${Date.now()}.csv`;
    a.click();
  }, [filtered]);

  return {
    // State
    search, setSearch,
    cat, setCat,
    sortBy, setSortBy,
    preset, setPreset,
    rsiFilter, setRsiFilter,
    rsiSortDir, setRsiSortDir,
    signalFilters, setSignalFilters,
    showLowVolume, setShowLowVolume,
    tablePage, setTablePage,
    rowsPerPage, setRowsPerPage,
    // Derived
    filtered,
    paginatedTokens,
    totalPages,
    stats,
    // Actions
    resetFilters,
    toggleSignalFilter,
    clearSignalFilters,
    exportCSV,
  };
}
