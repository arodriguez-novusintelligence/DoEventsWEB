import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalSearchView from '@lovable/components/feed/GlobalSearchView';

/** Búsqueda global — delega en componente Lovable empalado (eventos, usuarios, publicaciones). */
export const SearchEventsPage: React.FC = () => {
  const navigate = useNavigate();
  return <GlobalSearchView onBack={() => navigate(-1)} />;
};

export default SearchEventsPage;
