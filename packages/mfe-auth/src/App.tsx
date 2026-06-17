import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createAppStore, ToastProvider, globalStyles } from '@doevents/shared';
import { AuthRoutes } from './AuthRoutes';

const store = createAppStore();

const App: React.FC = () => (
  <Provider store={store}>
    <ToastProvider>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <AuthRoutes />
      </BrowserRouter>
    </ToastProvider>
  </Provider>
);

export default App;
