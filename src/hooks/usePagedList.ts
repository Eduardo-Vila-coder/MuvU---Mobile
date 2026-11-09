import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { getErrorMessage } from '../api/errors';
import type { Page, PageParams } from '../types/page';

type PageFetcher<T> = (params: PageParams, signal: AbortSignal) => Promise<Page<T>>;

export interface PagedListState<T> {
  items: T[];
  totalElements: number;
  isFirstLoad: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  reload: () => void;
}

// Infinite scroll over a paginated endpoint: page 0 first, next pages are appended.
// If the filters change, the parent gives the list a new `key` so this hook starts over.
export function usePagedList<T>(fetchPage: PageFetcher<T>, pageSize = 10): PagedListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchPage({ page, size: pageSize }, controller.signal)
      .then((result) => {
        setItems((prev) => (page === 0 ? result.content : [...prev, ...result.content]));
        setTotalPages(result.page.totalPages);
        setTotalElements(result.page.totalElements);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return; // cancelled on unmount / new request
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey]);

  const hasMore = page + 1 < totalPages;

  const loadMore = useCallback(() => {
    if (!loading && !error && hasMore) setPage((current) => current + 1);
  }, [loading, error, hasMore]);

  // Retry logic: request the same page again
  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  // Pull to refresh / shake / screen focus: back to the first page
  const reload = useCallback(() => {
    setPage(0);
    setReloadKey((key) => key + 1);
  }, []);

  return {
    items,
    totalElements,
    isFirstLoad: loading && items.length === 0,
    isRefreshing: loading && page === 0 && items.length > 0,
    isLoadingMore: loading && page > 0,
    error,
    hasMore,
    loadMore,
    retry,
    reload,
  };
}