import React, { useState } from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import { AppHeader, BottomDock, SideDrawer } from '@doevents/shared';



const MAIN_TAB_PATHS = ['/', '/events', '/map', '/profile'];

const HEADER_PATHS = [
  ...MAIN_TAB_PATHS,
  '/tickets',
  '/access',
  '/guests',
  '/notifications',
  '/chat',
];

const BOTTOM_NAV_PATHS = [...MAIN_TAB_PATHS, '/profile/gallery'];



export const MainLayout: React.FC = () => {

  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const showMainChrome = HEADER_PATHS.some((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`));

  const showBottomNav = BOTTOM_NAV_PATHS.includes(location.pathname)
    || location.pathname.startsWith('/profile/plan');



  return (

    <div className="de-app">

      {showMainChrome && <AppHeader onMenuOpen={() => setDrawerOpen(true)} />}

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="de-app-main">

        <Outlet />

      </main>

      {showBottomNav && <BottomDock />}

    </div>

  );

};



export default MainLayout;

