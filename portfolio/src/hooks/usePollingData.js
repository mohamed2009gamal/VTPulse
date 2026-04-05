import { useCallback, useEffect, useRef, useState } from 'react';

export default function usePollingData(loader, options = {}) {
  const {
    initialData,
    interval = 15000,
    enabled = true
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (background = false) => {
      if (!enabled) {
        return null;
      }

      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const nextData = await loader();
        if (!mountedRef.current) {
          return null;
        }

        setData(nextData);
        setError('');
        setLastUpdated(new Date());
        return nextData;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        setError(err?.message || 'Failed to refresh data.');
        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, loader]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    load(false);

    if (!interval || interval <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, interval, load]);

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh: load
  };
}
