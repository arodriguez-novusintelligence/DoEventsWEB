import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string;
  idUser: string;
  isAuthenticated: boolean;
}

interface SecureDataState {
  email: string;
  phone: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('doevents_auth_token') || '',
    idUser: localStorage.getItem('doevents_user_id') || '',
    isAuthenticated: !!localStorage.getItem('doevents_auth_token'),
  } as AuthState,
  reducers: {
    setAuthData(state, action: PayloadAction<{ token: string; idUser: string }>) {
      state.token = action.payload.token;
      state.idUser = action.payload.idUser;
      localStorage.setItem('doevents_auth_token', action.payload.token);
      localStorage.setItem('doevents_user_id', action.payload.idUser);
    },
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
    },
    clearAuthData(state) {
      state.token = '';
      state.idUser = '';
      state.isAuthenticated = false;
      localStorage.removeItem('doevents_auth_token');
      localStorage.removeItem('doevents_user_id');
    },
  },
});

const secureDataSlice = createSlice({
  name: 'secureData',
  initialState: {
    email: localStorage.getItem('doevents_secure_email') || '',
    phone: localStorage.getItem('doevents_secure_phone') || '',
  } as SecureDataState,
  reducers: {
    setSecureData(state, action: PayloadAction<{ email: string; phone: string }>) {
      state.email = action.payload.email;
      state.phone = action.payload.phone;
      localStorage.setItem('doevents_secure_email', action.payload.email);
      localStorage.setItem('doevents_secure_phone', action.payload.phone);
    },
    clearSecureData(state) {
      state.email = '';
      state.phone = '';
      localStorage.removeItem('doevents_secure_email');
      localStorage.removeItem('doevents_secure_phone');
    },
  },
});

export const { setAuthData, setAuthenticated, clearAuthData } = authSlice.actions;
export const { setSecureData, clearSecureData } = secureDataSlice.actions;

export function createAppStore() {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      secureData: secureDataSlice.reducer,
    },
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
