import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { formatNumber } from '../utils';

export function DashboardHeader({
  darkMode,
  setDarkMode,
  user,
  handleLogout,
  setShowLoginModal,
  watchlistCount,
  stats,
  lastUpdate,
  apiStats,
  cacheHit,
  onLogoClick,
}) {
  return (
    <header className="mb-4 sm:mb-6">
      {/* Top row: logo + actions */}
      <div className="flex items-center justify-between gap-2">
        <h1
          onClick={onLogoClick}
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
            <UserMenu user={user} onLogout={handleLogout} watchlistCount={watchlistCount} />
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
            <span className={`w-2 h-2 rounded-full animate-pulse ${cacheHit ? 'bg-sky-400' : 'bg-green-500'}`} />
            <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {cacheHit ? 'Cached' : 'Live'}
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
  );
}
