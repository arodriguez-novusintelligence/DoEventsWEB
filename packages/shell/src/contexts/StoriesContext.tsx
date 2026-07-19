import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchNearbyStories, fetchUserStories, getStoredUserLocation, userIdsMatch } from '@doevents/shared';

interface StoriesContextValue {
  activeAuthorIds: Set<string>;
  hasActiveStory: (userId: string) => boolean;
  refreshStories: () => void;
  loading: boolean;
  loadError: boolean;
  loadErrorMessage: string | null;
  isEmpty: boolean;
  authorCount: number;
}

export type { StoriesContextValue };

const StoriesContext = createContext<StoriesContextValue>({
  activeAuthorIds: new Set(),
  hasActiveStory: () => false,
  refreshStories: () => undefined,
  loading: false,
  loadError: false,
  loadErrorMessage: null,
  isEmpty: true,
  authorCount: 0,
});

interface StoriesProviderProps {
  children: React.ReactNode;
  currentUserId?: string | null;
}

export const StoriesProvider: React.FC<StoriesProviderProps> = ({ children, currentUserId }) => {
  const [activeAuthorIds, setActiveAuthorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshStories = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loc = getStoredUserLocation();

    const load = async () => {
      setLoading(true);
      setLoadError(false);
      setLoadErrorMessage(null);
      try {
        const [rings, ownStories] = await Promise.all([
          fetchNearbyStories({
            lat: loc?.lat,
            lng: loc?.lng,
            radiusKm: 100,
            limit: 50,
          }),
          currentUserId ? fetchUserStories(currentUserId) : Promise.resolve([]),
        ]);
        if (cancelled) return;

        const ids = new Set(rings.map((r) => r.authorId).filter(Boolean) as string[]);
        if (currentUserId && ownStories.length > 0) {
          ids.add(currentUserId);
        }
        setActiveAuthorIds(ids);
      } catch (err) {
        if (!cancelled) {
          setActiveAuthorIds(new Set());
          setLoadError(true);
          setLoadErrorMessage(
            err instanceof Error ? err.message : 'No se pudieron cargar las historias',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [refreshKey, currentUserId]);

  const value = useMemo<StoriesContextValue>(() => ({
    activeAuthorIds,
    hasActiveStory: (userId: string) => {
      if (!userId) return false;
      if (activeAuthorIds.has(userId)) return true;
      for (const id of activeAuthorIds) {
        if (userIdsMatch(id, userId)) return true;
      }
      return false;
    },
    refreshStories,
    loading,
    loadError,
    loadErrorMessage,
    isEmpty: !loading && !loadError && activeAuthorIds.size === 0,
    authorCount: activeAuthorIds.size,
  }), [activeAuthorIds, refreshStories, loading, loadError, loadErrorMessage]);

  return (
    <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>
  );
};

export function useActiveStoryAuthors(): StoriesContextValue {
  return useContext(StoriesContext);
}

/** Alias Lovable — misma API que `useActiveStoryAuthors`. */
export const useStories = useActiveStoryAuthors;
