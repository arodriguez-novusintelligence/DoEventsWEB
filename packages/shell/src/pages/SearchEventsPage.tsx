import React from 'react';
import { useLocation } from 'react-router-dom';
import GlobalSearchView from '@lovable/components/feed/GlobalSearchView';

type SearchLocationState = {
  q?: string;
  tab?: 'events' | 'users' | 'posts';
};

/** Búsqueda global — delega en componente Lovable empalado (eventos, usuarios, publicaciones). */
export const SearchEventsPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as SearchLocationState | null) ?? {};
  return (
    <div className="min-h-screen bg-secondary pb-24">
      <GlobalSearchView
        initialQuery={state.q}
        initialTab={state.tab ?? (state.q ? 'events' : undefined)}
      />
    </div>
  );
};

export default SearchEventsPage;
