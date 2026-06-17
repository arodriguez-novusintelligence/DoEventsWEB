import React from 'react';
import { createRoot } from 'react-dom/client';
import ShellApp from './main';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShellApp />
  </React.StrictMode>
);
