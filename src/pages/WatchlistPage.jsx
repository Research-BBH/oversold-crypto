// ==================================================
// FILE: src/pages/WatchlistPage.jsx
// ==================================================

import { useState, useMemo } from 'react';
import { formatPrice, getRsiStyle } from '../utils';
import { ThemeToggle } from '../components/ThemeToggle';

export const WatchlistPage = ({ tokens, watchlist, onRemove, onBack, user, darkMode, setDarkMode }) => {
  const [sortBy, setSortBy] = useState('rank_asc');

  const watchedTokens = useMemo(() => {
    let filtered = tokens.filter((t) => watchlist.has(t.id));
    const [field, dir] = sortBy.split('_');
    filtered.sort((a, b) => {
      let va = a[field],
        vb = b[field];
      if (va === null || va === undefined) va = dir === 'asc' ? Infinity : -Infinity;
      if (vb === null || vb === undefined) vb = dir === 'asc' ? Infinity : -Infinity;
      return dir === 'asc' ? va - vb : vb - va;
    });
    return filtered;
  }, [tokens, watchlist, sortBy]);

  const toggleSort = (field) => {
    setSortBy((prev) => {
      const [currentField, currentDir] = prev.split('_');
      if (currentField === field) return `${field}_${currentDir === 'asc' ? 'desc' : 'asc'}`;
      const defaults = { rank: 'asc', price: 'desc', change24h: 'desc', rsi: 'asc' };
      return `${field}_${defaults[field] || 'asc'}`;
    });
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {darkMode && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-yellow-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
        </div>
      )}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black">My Watchlist</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {user?.name && <span>Welcome, {user.name.split(' ')[0]}! </span>}
              {watchedTokens.length} {watchedTokens.length === 1 ? 'token' : 'tokens'} saved
            </p>
          </div>
        </div>

        {watchedTokens.length === 0 ? (
          <div
            className={`${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            } border rounded-2xl p-12 text-center`}
          >
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-bold mb-2">Your watchlist is empty</h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Start adding tokens to track your favorite cryptocurrencies
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Browse Tokens
            </button>
          </div>
        ) : (
          <div
            className={`${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            } border rounded-2xl overflow-hidden`}
          >
            <div
              className={`hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b ${
                darkMode ? 'border-white/10' : 'border-gray-100'
              } text-xs text-gray-500 font-semibold uppercase tracking-wider`}
            >
              <div
                className={`col-span-4 flex items-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => toggleSort('rank')}
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
                className={`col-span-2 text-right flex items-center justify-end gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => toggleSort('price')}
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
                className={`col-span-2 text-right flex items-center justify-end gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => toggleSort('change24h')}
              >
                <span>24H / 7D</span>
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
                className={`col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer ${
                  darkMode ? 'hover:text-white' : 'hover:text-gray-900'
                } transition-colors group`}
                onClick={() => toggleSort('rsi')}
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
              <div className="col-span-2 text-center">Actions</div>
            </div>
            <div className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
              {watchedTokens.map((t) => {
                const rs = getRsiStyle(t.rsi);
                return (
                  <div
                    key={t.id}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 ${
                      darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                    } transition-colors items-center`}
                  >
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                      <span
                        className={`text-xs w-6 text-right ${
                          darkMode ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        #{t.rank}
                      </span>
                      <img
                        src={t.image}
                        alt={t.symbol}
                        className="w-10 h-10 rounded-full bg-gray-800"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.symbol}</span>
                          {t.rsi !== null && t.rsi < 25 && <span className="text-xs">🔴</span>}
                          {t.rsi !== null && t.rsi > 75 && <span className="text-xs">🟢</span>}
                        </div>
                        <p className="text-sm text-gray-500">{t.name}</p>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2 text-right font-mono">
                      {formatPrice(t.price)}
                    </div>
                    <div className="col-span-4 md:col-span-2 text-right text-sm">
                      <span className={t.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {t.change24h >= 0 ? '+' : ''}
                        {t.change24h?.toFixed(1)}%
                      </span>
                      <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}> / </span>
                      <span className={t.change7d >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {t.change7d >= 0 ? '+' : ''}
                        {t.change7d?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-center">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${rs.bg} ${rs.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />
                        <span className="font-bold text-sm">
                          {t.rsi !== null ? t.rsi.toFixed(0) : '--'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-center gap-2">
                      <a
                        href={`#/token/${t.id}`}
                        className={`p-2 rounded-lg ${
                          darkMode
                            ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                        } transition-colors`}
                        title="View details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={(e) => onRemove(t.id, e)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
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
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border rounded-xl p-4`}
            >
              <p className="text-xs text-gray-500 mb-1">Avg RSI</p>
              <p className="text-xl font-bold">
                {(
                  watchedTokens.filter((t) => t.rsi !== null).reduce((sum, t) => sum + t.rsi, 0) /
                    watchedTokens.filter((t) => t.rsi !== null).length || 0
                ).toFixed(1)}
              </p>
            </div>
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border rounded-xl p-4`}
            >
              <p className="text-xs text-gray-500 mb-1">Oversold</p>
              <p className="text-xl font-bold text-orange-500">
                {watchedTokens.filter((t) => t.rsi !== null && t.rsi < 30).length}
              </p>
            </div>
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border rounded-xl p-4`}
            >
              <p className="text-xs text-gray-500 mb-1">Overbought</p>
              <p className="text-xl font-bold text-green-500">
                {watchedTokens.filter((t) => t.rsi !== null && t.rsi > 70).length}
              </p>
            </div>
            <div
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border rounded-xl p-4`}
            >
              <p className="text-xs text-gray-500 mb-1">Avg 24h Change</p>
              <p
                className={`text-xl font-bold ${
                  watchedTokens.reduce((sum, t) => sum + (t.change24h || 0), 0) /
                    watchedTokens.length >=
                  0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {(
                  (watchedTokens.reduce((sum, t) => sum + (t.change24h || 0), 0) /
                    watchedTokens.length) ||
                  0
                ).toFixed(2)}
                %
              </p>
            </div>
          </div>
        )}
        <footer
          className={`text-center py-8 mt-8 border-t ${
            darkMode ? 'border-white/10' : 'border-gray-200'
          }`}
        >
          <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Your watchlist is saved to your account and syncs across devices
          </p>
        </footer>
      </div>
    </div>
  );
};
