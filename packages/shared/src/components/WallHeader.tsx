import React from 'react';
import { SearchIcon } from './icons/TabIcons';

export interface WallHeaderProps {
  userName?: string;
  isAuthenticated?: boolean;
  onSearchClick?: () => void;
}

export const WallHeader: React.FC<WallHeaderProps> = ({
  userName,
  isAuthenticated = true,
  onSearchClick,
}) => (
  <header className="de-wall-hero">
    <div className="de-safe-top" />
    <div className="de-wall-hero__content">
      <div className="de-wall-hero__text">
        <h1 className="de-wall-hero__title">
          {isAuthenticated && userName ? `Hola ${userName}` : 'Bienvenido'}
        </h1>
        <p className="de-wall-hero__subtitle">
          Estos son algunos eventos que te pueden interesar.
        </p>
      </div>
      <button
        type="button"
        className="de-wall-hero__search"
        onClick={onSearchClick}
        aria-label="Buscar eventos"
      >
        <SearchIcon />
      </button>
    </div>
  </header>
);
