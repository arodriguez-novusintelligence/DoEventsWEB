import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import {
  createAppStore,
  ToastProvider,
  globalStyles,
  initApiClient,
} from '@doevents/shared';
import '@lovable/index.css';
import { getEnvironment } from '@config/environments/index';
import { AppRouter } from './App';

const store = createAppStore();
const env = getEnvironment();
initApiClient(env);

const ShellApp: React.FC = () => (
  <Provider store={store}>
    <ToastProvider>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ToastProvider>
  </Provider>
);

export default ShellApp;
