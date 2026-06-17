import React from 'react';

export interface PageTopbarProps {
  title: string;
}

export const PageTopbar: React.FC<PageTopbarProps> = ({ title }) => (
  <>
    <div className="de-safe-top" />
    <header className="de-page-topbar">
      <h1>{title}</h1>
    </header>
  </>
);
