import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Load user + watchlist from localStorage on mount
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

  // Persist watchlist whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`oversold_watchlist_${user.id}`, JSON.stringify([...watchlist]));
    }
  }, [watchlist, user]);

  const handleLogin = useCallback((loggedInUser) => {
    setUser(loggedInUser);
    const saved = localStorage.getItem(`oversold_watchlist_${loggedInUser.id}`);
    if (saved) setWatchlist(new Set(JSON.parse(saved)));
    else setWatchlist(new Set());
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('oversold_user');
    setUser(null);
    setWatchlist(new Set());
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  }, []);

  const toggleWatch = useCallback(
    (id, e) => {
      e?.stopPropagation();
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      setWatchlist((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [user]
  );

  return {
    user,
    watchlist,
    showLoginModal,
    setShowLoginModal,
    handleLogin,
    handleLogout,
    toggleWatch,
  };
}
