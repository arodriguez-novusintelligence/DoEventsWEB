import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchNearbyStories, fetchUserStories, getStoredUserLocation } from '@doevents/shared';

interface StoriesContextValue {
  activeAuthorIds: Set<string>;
  hasActiveStory: (userId: string) => boolean;
  refreshStories: () => void;
  loading: boolean;
}

const StoriesContext = createContext<StoriesContextValue>({
  activeAuthorIds: new Set(),
  hasActiveStory: () => false,
  refreshStories: () => undefined,
  loading: false,
});

interface StoriesProviderProps {
  children: React.ReactNode;
  currentUserId?: string | null;
}

export const StoriesProvider: React.FC<StoriesProviderProps> = ({ children, currentUserId }) => {
  const [activeAuthorIds, setActiveAuthorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshStories = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loc = getStoredUserLocation();

    const load = async () => {
      setLoading(true);
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
      } catch {
        if (!cancelled) setActiveAuthorIds(new Set());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [refreshKey, currentUserId]);

  const value = useMemo<StoriesContextValue>(() => ({
    activeAuthorIds,
    hasActiveStory: (userId: string) => activeAuthorIds.has(userId),
    refreshStories,
    loading,
  }), [activeAuthorIds, refreshStories, loading]);

  return (
    <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>
  );
};

export function useActiveStoryAuthors(): StoriesContextValue {
  return useContext(StoriesContext);
}
