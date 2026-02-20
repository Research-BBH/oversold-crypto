// ==================================================
// FILE: src/hooks/useDataFetcher.js
// Smart data fetching: ETag/304, Page Visibility pause,
// error backoff, immediate refresh on tab return
// ==================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL, API_URL_ENHANCED, REFRESH_INTERVAL } from '../utils';

// When the tab is hidden we slow right down — still alive but not hammering
const HIDDEN_INTERVAL  = 5 * 60 * 1000; // 5 minutes
// Maximum retry delay under error backoff
const MAX_BACKOFF_MS   = 10 * 60 * 1000; // 10 minutes
// If this much time has passed since the last successful fetch we consider
// the data "stale" and trigger an immediate refresh when the tab regains focus
const STALE_THRESHOLD  = REFRESH_INTERVAL * 1.5;

export function useDataFetcher({ useEnhancedAPI = true } = {}) {
  const [tokens,     setTokens]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [apiStats,   setApiStats]   = useState(null);
  // Whether the last poll was a cache-hit (304)
  const [cacheHit,   setCacheHit]   = useState(false);

  // Persistent refs — never trigger re-renders
  const etagRef         = useRef(null);   // last ETag received from the API
  const lastSuccessRef  = useRef(null);   // timestamp (ms) of last successful fetch
  const retryCountRef   = useRef(0);
  const intervalRef     = useRef(null);
  const isFetchingRef   = useRef(false);  // guard against concurrent fetches

  const url = useEnhancedAPI ? API_URL_ENHANCED : API_URL;

  // ── Core fetch ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async ({ force = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setError(null);

      const headers = { Accept: 'application/json' };
      // Send stored ETag so the CDN / edge function can short-circuit with 304
      if (etagRef.current && !force) {
        headers['If-None-Match'] = etagRef.current;
      }

      const res = await fetch(url, {
        // Bypass the browser's own HTTP cache — we manage freshness ourselves
        cache: 'no-store',
        headers,
      });

      // ── 304 Not Modified: data is identical to what we already have ──
      if (res.status === 304) {
        setCacheHit(true);
        retryCountRef.current = 0;
        // lastUpdate stays unchanged (data hasn't changed)
        // lastSuccessRef advances so the stale-check resets
        lastSuccessRef.current = Date.now();
        return;
      }

      if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${res.statusText}`);
      }

      // Store the new ETag for the next request
      const newETag = res.headers.get('ETag');
      if (newETag) etagRef.current = newETag;

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const processed = data.tokens.map((t) => ({
        ...t,
        volMcap: t.mcap ? (t.volume / t.mcap) * 100 : 0,
      }));

      setTokens(processed);
      setLastUpdate(new Date(data.timestamp));
      setApiStats(data.stats);
      setCacheHit(false);
      setLoading(false);
      retryCountRef.current = 0;
      lastSuccessRef.current = Date.now();

    } catch (e) {
      setError(e.message);
      setLoading(false);

      // Exponential backoff: 60s → 120s → 240s → … capped at 10 min
      retryCountRef.current += 1;
      const backoff = Math.min(
        REFRESH_INTERVAL * Math.pow(2, retryCountRef.current - 1),
        MAX_BACKOFF_MS
      );
      clearInterval(intervalRef.current);
      intervalRef.current = setTimeout(() => {
        // After backoff, resume normal polling
        fetchData();
        intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
      }, backoff);
      return; // skip the normal interval reset below
    } finally {
      isFetchingRef.current = false;
    }
  }, [url]);

  // ── Polling + Page Visibility ──────────────────────────────────────────────

  const startPolling = useCallback((interval = REFRESH_INTERVAL) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchData, interval);
  }, [fetchData]);

  useEffect(() => {
    // Initial load
    fetchData();
    startPolling(REFRESH_INTERVAL);

    const handleVisibility = () => {
      if (document.hidden) {
        // Tab hidden — reduce polling frequency to be kind to the API
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(fetchData, HIDDEN_INTERVAL);
      } else {
        // Tab visible again
        clearInterval(intervalRef.current);

        const sinceLastFetch = Date.now() - (lastSuccessRef.current ?? 0);
        if (sinceLastFetch > STALE_THRESHOLD) {
          // Data is stale — fetch immediately, then resume normal polling
          fetchData();
        }
        // Resume normal interval regardless (so next tick is always fresh)
        intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData, startPolling]);

  // ── Manual refresh (exposed for the refresh button / keyboard shortcut) ────
  const manualRefresh = useCallback(() => {
    // Force = skip ETag so we definitely get fresh data
    etagRef.current = null;
    fetchData({ force: true });
    // Reset the interval so the next auto-poll is a full interval away
    startPolling(REFRESH_INTERVAL);
  }, [fetchData, startPolling]);

  return {
    tokens,
    loading,
    error,
    lastUpdate,
    apiStats,
    cacheHit,
    fetchData: manualRefresh, // keep the same external API as before
  };
}
