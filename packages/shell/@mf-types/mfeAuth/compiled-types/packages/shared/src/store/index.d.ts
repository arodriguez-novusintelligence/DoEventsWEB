interface AuthState {
    token: string;
    idUser: string;
    isAuthenticated: boolean;
}
interface SecureDataState {
    email: string;
    phone: string;
}
export declare const setAuthData: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    token: string;
    idUser: string;
}, "auth/setAuthData">, setAuthenticated: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "auth/setAuthenticated">, clearAuthData: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/clearAuthData">;
export declare const setSecureData: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    email: string;
    phone: string;
}, "secureData/setSecureData">, clearSecureData: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"secureData/clearSecureData">;
export declare function createAppStore(): import("@reduxjs/toolkit").EnhancedStore<{
    auth: AuthState;
    secureData: SecureDataState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        auth: AuthState;
        secureData: SecureDataState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export {};
