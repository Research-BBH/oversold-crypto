// ==================================================
// FILE: src/components/UserMenu.jsx
// ==================================================

import { useState } from 'react';

export const UserMenu = ({ user, onLogout, watchlistCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all"
      >
        <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
        <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline">
          {user.name?.split(' ')[0]}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <a
              href="#/watchlist"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              My Watchlist{' '}
              {watchlistCount > 0 && (
                <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  {watchlistCount}
                </span>
              )}
            </a>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};
