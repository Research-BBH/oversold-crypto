import { formatNumber, formatPrice } from '../utils';
import { Spark } from './Charts';

// ─── Skeleton loading state ───────────────────────────────────────────────────

function SkeletonRow({ i, darkMode }) {
  const pulse = `animate-pulse ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`;
  const pulseFaint = `animate-pulse ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`;
  const delay = { animationDelay: `${i * 50}ms` };
  const delay2 = { animationDelay: `${i * 50 + 25}ms` };

  return (
    <div className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-50'}`}>
      {/* Desktop skeleton */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-4 items-center">
        <div className="col-span-2 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${pulse}`} />
          <div className="space-y-2">
            <div className={`h-4 w-20 rounded ${pulse}`} style={delay} />
            <div className={`h-3 w-12 rounded ${pulseFaint}`} style={delay2} />
          </div>
        </div>
        <div className="col-span-1 flex justify-end"><div className={`h-4 w-16 rounded ${pulse}`} style={delay} /></div>
        <div className="col-span-1 flex justify-end"><div className={`h-4 w-14 rounded ${pulse}`} style={delay} /></div>
        <div className="col-span-1 flex justify-end"><div className={`h-4 w-16 rounded ${pulse}`} style={delay} /></div>
        <div className="col-span-1 flex justify-end"><div className={`h-4 w-12 rounded ${pulse}`} style={delay} /></div>
        <div className="col-span-1 flex justify-end"><div className={`h-4 w-12 rounded ${pulse}`} style={delay} /></div>
        <div className="col-span-2 flex justify-end pr-4"><div className={`h-6 w-24 rounded-lg ${pulse}`} style={delay} /></div>
        <div className="col-span-2 flex justify-center"><div className={`h-10 w-full max-w-[120px] rounded ${pulseFaint}`} style={delay} /></div>
        <div className="col-span-1 flex justify-center gap-1">
          <div className={`w-8 h-8 rounded-lg ${pulseFaint}`} style={delay} />
          <div className={`w-8 h-8 rounded-lg ${pulseFaint}`} style={delay2} />
        </div>
      </div>
      {/* Mobile skeleton */}
      <div className="lg:hidden px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${pulse}`} />
            <div className="space-y-1.5">
              <div className={`h-4 w-16 rounded ${pulse}`} style={delay} />
              <div className={`h-3 w-10 rounded ${pulseFaint}`} style={delay2} />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className={`h-4 w-14 rounded ml-auto ${pulse}`} style={delay} />
            <div className={`h-3 w-10 rounded ml-auto ${pulseFaint}`} style={delay2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-2xl border overflow-hidden`}>
      {/* Header */}
      <div className={`hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
        {[2,1,1,1,1,1,2,2,1].map((span, i) => (
          <div key={i} className={`col-span-${span} flex ${i > 0 ? 'justify-end' : ''}`}>
            <div className={`h-3 w-${[16,12,14,12,8,8,14,16,14][i]} rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
          </div>
        ))}
      </div>
      {[...Array(10)].map((_, i) => <SkeletonRow key={i} i={i} darkMode={darkMode} />)}
      <div className={`px-5 py-4 flex items-center justify-center gap-3 ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
        <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading market data...</span>
      </div>
    </div>
  );
}

// ─── Signal score badge ───────────────────────────────────────────────────────

function SignalBadge({ score, darkMode, compact = false }) {
  if (score === undefined || score === null) {
    return compact
      ? <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>--</span>
      : <span className="text-gray-600 text-xs">--</span>;
  }

  const colorClass =
    score >= 50  ? 'bg-green-500/20 text-green-400' :
    score >= 25  ? 'bg-emerald-500/15 text-emerald-400' :
    score > -25  ? 'bg-gray-500/15 text-gray-400' :
    score > -50  ? 'bg-orange-500/15 text-orange-400' :
                   'bg-red-500/20 text-red-400';

  const dotClass =
    score >= 50  ? 'bg-green-500' :
    score >= 25  ? 'bg-emerald-400' :
    score > -25  ? 'bg-gray-400' :
    score > -50  ? 'bg-orange-400' :
                   'bg-red-500';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums whitespace-nowrap mt-0.5 px-1.5 py-0.5 rounded ${colorClass}`}>
        <span className="opacity-50 font-normal">Sig</span>
        {score >= 0 ? '+' : ''}{score}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums min-w-[70px] ${colorClass}`}
      title={`Signal: ${score >= 50 ? 'STRONG BUY' : score >= 25 ? 'BUY' : score > -25 ? 'NEUTRAL' : score > -50 ? 'SELL' : 'STRONG SELL'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span>{score >= 0 ? '+' : ''}{score}</span>
      {(score >= 25 || score <= -25) && (
        <span className="text-[10px] opacity-70">{score >= 25 ? 'BUY' : 'SELL'}</span>
      )}
    </div>
  );
}

// ─── Sortable column header ───────────────────────────────────────────────────

function SortHeader({ label, field, sortBy, setSortBy, setPreset, setRsiFilter, className = '', justify = 'end', title }) {
  const isActive = sortBy.startsWith(field);
  const isAsc = sortBy === `${field}_asc`;
  const toggleSort = () => {
    setSortBy(isAsc ? `${field}_desc` : `${field}_asc`);
    setPreset(null);
    setRsiFilter(null);
  };

  return (
    <div
      className={`relative flex items-center cursor-pointer hover:text-white transition-colors group ${justify === 'end' ? 'justify-end' : ''} ${className}`}
      onClick={toggleSort}
      title={title}
    >
      <span>{label}</span>
      <span className={`${justify === 'end' ? 'absolute -right-2.5' : 'ml-1'} transition-opacity ${isActive ? 'opacity-100 text-orange-500' : 'opacity-0 group-hover:opacity-50'}`}>
        {isAsc ? '↑' : '↓'}
      </span>
    </div>
  );
}

// ─── Desktop table header ─────────────────────────────────────────────────────

function TableHeader({ sortBy, setSortBy, setPreset, setRsiFilter, darkMode }) {
  const headerClass = `hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b ${
    darkMode ? 'border-white/10' : 'border-gray-100'
  } text-[11px] text-gray-500 font-semibold uppercase tracking-wider`;

  const sh = { sortBy, setSortBy, setPreset, setRsiFilter };

  return (
    <div className={headerClass}>
      <SortHeader label="Token"  field="rank"         {...sh} className="col-span-2" justify="start" />
      <SortHeader label="Price"  field="price"        {...sh} className="col-span-1" />
      <SortHeader label="Volume" field="volume"       {...sh} className="col-span-1" />
      <SortHeader label="MCap"   field="mcap"         {...sh} className="col-span-1" />
      <SortHeader label="24H"    field="change24h"    {...sh} className="col-span-1" />
      <SortHeader label="7D"     field="change7d"     {...sh} className="col-span-1" />
      <SortHeader label="SIGNAL" field="signalScore"  {...sh} className="col-span-2 hidden lg:flex pr-4" title="Momentum Signal Score (-100 to +100)" />
      <div className="col-span-2 hidden lg:flex items-center justify-center">7D Chart</div>
      <div className="col-span-1 flex items-center justify-center">Actions</div>
    </div>
  );
}

// ─── Token row ────────────────────────────────────────────────────────────────

function TokenRow({ token: t, index, isSelected, watched, darkMode, toggleWatch, openTokenPage }) {
  const sparkColor =
    t.sparkline?.length > 1
      ? t.sparkline[t.sparkline.length - 1] >= t.sparkline[0] ? '#22c55e' : '#ef4444'
      : '#6b7280';

  const rowClass = `cursor-pointer transition-colors ${
    darkMode ? 'border-white/5 hover:bg-white/[0.03]' : 'border-gray-100 hover:bg-gray-50'
  } border-b ${
    watched ? (darkMode ? 'bg-yellow-500/[0.04]' : 'bg-yellow-50') : ''
  } ${
    isSelected
      ? darkMode
        ? 'ring-2 ring-inset ring-orange-500/50 bg-orange-500/10'
        : 'ring-2 ring-inset ring-orange-500 bg-orange-50'
      : ''
  }`;

  const changeColor = (v) => (v >= 0 ? 'text-green-500' : 'text-red-500');
  const fmtChange = (v) => `${v >= 0 ? '+' : ''}${v?.toFixed(1)}%`;

  return (
    <div key={t.id} onClick={() => { window.location.hash = `#/token/${t.id}`; }} className={rowClass}>

      {/* ── Desktop row ── */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3">
        {/* Token */}
        <div className="col-span-2 flex items-center gap-3">
          <span className={`text-xs w-6 text-right tabular-nums ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t.rank}</span>
          <img src={t.image} alt={t.symbol} className="w-8 h-8 rounded-full shrink-0 bg-gray-800" />
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
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{formatNumber(t.volume)}</span>
        </div>
        {/* MCap */}
        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{formatNumber(t.mcap)}</span>
        </div>
        {/* 24H */}
        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
          <span className={changeColor(t.change24h)}>{fmtChange(t.change24h)}</span>
        </div>
        {/* 7D */}
        <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
          <span className={changeColor(t.change7d)}>{fmtChange(t.change7d)}</span>
        </div>
        {/* Signal */}
        <div className="col-span-2 flex items-center justify-end pr-4">
          <SignalBadge score={t.signalScore} darkMode={darkMode} />
        </div>
        {/* Chart */}
        <div className="col-span-2 flex items-center justify-center">
          <Spark data={t.sparkline} color={sparkColor} h={24} />
        </div>
        {/* Actions */}
        <div className="col-span-1 flex items-center justify-center gap-1">
          <button
            onClick={(e) => openTokenPage(t.id, e)}
            className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
            title="View details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <button
            onClick={(e) => toggleWatch(t.id, e)}
            className={`p-1 text-base hover:scale-110 transition-transform ${watched ? 'text-yellow-400' : darkMode ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`}
            title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {watched ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* ── Mobile row ── */}
      <div className="lg:hidden">
        {/* Mobile column header is rendered once outside */}
        <div className="grid px-2 py-2.5 gap-x-2 items-center" style={{ gridTemplateColumns: '1fr auto' }}>
          {/* Left: rank + icon + symbol + signal */}
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] tabular-nums shrink-0 w-5 text-right ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t.rank}</span>
            <img src={t.image} alt={t.symbol} className="w-7 h-7 rounded-full shrink-0 bg-gray-800" />
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-semibold text-xs leading-tight truncate">{t.symbol}</span>
                {t.rsi !== null && t.rsi < 25 && <span className="text-[9px] shrink-0">🔴</span>}
                {t.rsi !== null && t.rsi > 75 && <span className="text-[9px] shrink-0">🟢</span>}
              </div>
              <SignalBadge score={t.signalScore} darkMode={darkMode} compact />
            </div>
          </div>
          {/* Right: price + 24h + mcap + star */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums font-semibold">{formatPrice(t.price)}</span>
              <span className={`text-xs tabular-nums font-medium ${changeColor(t.change24h)}`}>
                {fmtChange(t.change24h)}
              </span>
              <button
                onClick={(e) => toggleWatch(t.id, e)}
                className={`text-sm hover:scale-110 transition-transform shrink-0 ${watched ? 'text-yellow-400' : darkMode ? 'text-gray-600 hover:text-yellow-400' : 'text-gray-300 hover:text-yellow-500'}`}
              >
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
}

// ─── Pagination controls ──────────────────────────────────────────────────────

function Pagination({ tablePage, totalPages, rowsPerPage, filteredCount, showWL, showLowVolume, setTablePage, setRowsPerPage, darkMode }) {
  if (filteredCount === 0) return null;

  const start = (tablePage - 1) * rowsPerPage + 1;
  const end = Math.min(tablePage * rowsPerPage, filteredCount);
  const showPages = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
  let pageStart = Math.max(1, tablePage - Math.floor(showPages / 2));
  let pageEnd = Math.min(totalPages, pageStart + showPages - 1);
  if (pageEnd - pageStart + 1 < showPages) pageStart = Math.max(1, pageEnd - showPages + 1);

  const btnBase = `px-2 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
    darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
  }`;

  return (
    <div className={`px-4 py-3 border-t ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'} flex flex-col sm:flex-row items-center justify-between gap-3`}>
      <div className="text-xs text-gray-500 text-center sm:text-left">
        {start}–{end} of {filteredCount} tokens
        {!showWL && !showLowVolume && <span className="ml-1 text-orange-500">• Vol &gt;$200K</span>}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setTablePage(1)} disabled={tablePage === 1} className={btnBase}>««</button>
        <button onClick={() => setTablePage((p) => Math.max(1, p - 1))} disabled={tablePage === 1} className={btnBase}>‹</button>
        {Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i).map((p) => (
          <button
            key={p}
            onClick={() => setTablePage(p)}
            className={`w-8 py-1.5 rounded text-xs font-medium transition-colors ${
              p === tablePage
                ? 'bg-orange-500 text-white'
                : darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
        <button onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))} disabled={tablePage === totalPages} className={btnBase}>›</button>
        <button onClick={() => setTablePage(totalPages)} disabled={tablePage === totalPages} className={btnBase}>»»</button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setTablePage(1); }}
          className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer ${
            darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          } border focus:outline-none focus:ring-1 focus:ring-orange-500`}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TokenTable({
  loading,
  error,
  filtered,
  paginatedTokens,
  watchlist,
  darkMode,
  sortBy, setSortBy,
  setPreset,
  setRsiFilter,
  tablePage, setTablePage,
  rowsPerPage, setRowsPerPage,
  totalPages,
  selectedRowIndex,
  showWL,
  showLowVolume,
  fetchData,
  toggleWatch,
  openTokenPage,
}) {
  if (loading) return <TableSkeleton darkMode={darkMode} />;

  if (error) {
    return (
      <div className="text-center py-20 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-500 text-xl mb-2">⚠️ {error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const tableClass = `${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-2xl border overflow-hidden`;

  return (
    <div className={tableClass}>
      <TableHeader sortBy={sortBy} setSortBy={setSortBy} setPreset={setPreset} setRsiFilter={setRsiFilter} darkMode={darkMode} />

      <div>
        {/* Mobile column subheader */}
        <div className={`lg:hidden grid px-2 py-1.5 border-b gap-x-2 ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`} style={{ gridTemplateColumns: '1fr auto' }}>
          <div
            className={`text-[10px] font-semibold uppercase tracking-wide cursor-pointer ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
            onClick={() => { setSortBy(sortBy === 'rank_asc' ? 'rank_desc' : 'rank_asc'); setPreset(null); setRsiFilter(null); }}
          >
            Coin {sortBy === 'rank_asc' ? '↑' : sortBy === 'rank_desc' ? '↓' : ''}
          </div>
          <div className={`text-[10px] font-semibold uppercase tracking-wide text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Price · 24H · MCap
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No tokens match your filters</p>
          </div>
        ) : (
          paginatedTokens.map((token, index) => (
            <TokenRow
              key={token.id}
              token={token}
              index={index}
              isSelected={index === selectedRowIndex}
              watched={watchlist.has(token.id)}
              darkMode={darkMode}
              toggleWatch={toggleWatch}
              openTokenPage={openTokenPage}
            />
          ))
        )}
      </div>

      <Pagination
        tablePage={tablePage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        filteredCount={filtered.length}
        showWL={showWL}
        showLowVolume={showLowVolume}
        setTablePage={setTablePage}
        setRowsPerPage={setRowsPerPage}
        darkMode={darkMode}
      />
    </div>
  );
}
