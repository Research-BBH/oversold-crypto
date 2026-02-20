import { useState, useEffect } from 'react';

export function useRouter() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageTokenId, setPageTokenId] = useState(null);

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      const hashPath = hash.split('?')[0];

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
      window.scrollTo(0, 0);
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const goBack = () => {
    window.location.hash = '#/';
  };

  const openTokenPage = (tokenId, e) => {
    e?.stopPropagation();
    window.open(`${window.location.pathname}#/token/${tokenId}`, '_blank');
  };

  const navigateTo = (hash) => {
    window.location.hash = hash;
  };

  return { currentPage, pageTokenId, goBack, openTokenPage, navigateTo };
}
