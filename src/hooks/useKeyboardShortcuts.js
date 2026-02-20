import { useState, useEffect, useRef } from 'react';

export function useKeyboardShortcuts({
  currentPage,
  paginatedTokens,
  tablePage,
  totalPages,
  user,
  showLoginModal,
  setShowLoginModal,
  setShowWL,
  setDarkMode,
  setTablePage,
  setWatchlist,
  fetchData,
  navigateTo,
  openTokenPage,
}) {
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const searchInputRef = useRef(null);

  // Reset row selection when page or tab changes
  useEffect(() => {
    setSelectedRowIndex(-1);
  }, [tablePage, currentPage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        if (showShortcutsModal) setShowShortcutsModal(false);
        else if (showLoginModal) setShowLoginModal(false);
        else if (selectedRowIndex >= 0) setSelectedRowIndex(-1);
        else if (isTyping) e.target.blur();
        return;
      }

      if (isTyping) return;
      if (currentPage !== 'home') return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsModal(true);
          break;
        case 'w':
        case 'W':
          if (user) setShowWL((prev) => !prev);
          else setShowLoginModal(true);
          break;
        case 'd':
        case 'D':
          setDarkMode((prev) => !prev);
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) fetchData();
          break;
        case 'j':
        case 'J':
        case 'ArrowDown':
          e.preventDefault();
          setSelectedRowIndex((prev) => Math.min(prev + 1, paginatedTokens.length - 1));
          break;
        case 'k':
        case 'K':
        case 'ArrowUp':
          e.preventDefault();
          setSelectedRowIndex((prev) => {
            if (prev <= 0) return 0;
            return prev - 1;
          });
          break;
        case 'Enter':
          if (selectedRowIndex >= 0 && selectedRowIndex < paginatedTokens.length) {
            navigateTo(`#/token/${paginatedTokens[selectedRowIndex].id}`);
          }
          break;
        case 'o':
        case 'O':
          if (selectedRowIndex >= 0 && selectedRowIndex < paginatedTokens.length) {
            openTokenPage(paginatedTokens[selectedRowIndex].id, { stopPropagation: () => {} });
          }
          break;
        case 's':
        case 'S':
          if (selectedRowIndex >= 0 && selectedRowIndex < paginatedTokens.length && user) {
            const token = paginatedTokens[selectedRowIndex];
            setWatchlist((prev) => {
              const next = new Set(prev);
              next.has(token.id) ? next.delete(token.id) : next.add(token.id);
              return next;
            });
          }
          break;
        case '[':
          if (tablePage > 1) {
            setTablePage((p) => p - 1);
            setSelectedRowIndex(-1);
          }
          break;
        case ']':
          if (tablePage < totalPages) {
            setTablePage((p) => p + 1);
            setSelectedRowIndex(-1);
          }
          break;
        case 'G':
          setSelectedRowIndex(paginatedTokens.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    showShortcutsModal,
    showLoginModal,
    selectedRowIndex,
    paginatedTokens,
    user,
    tablePage,
    totalPages,
    fetchData,
    navigateTo,
    openTokenPage,
    setDarkMode,
    setShowLoginModal,
    setShowWL,
    setTablePage,
    setWatchlist,
  ]);

  return {
    selectedRowIndex,
    setSelectedRowIndex,
    showShortcutsModal,
    setShowShortcutsModal,
    searchInputRef,
  };
}
