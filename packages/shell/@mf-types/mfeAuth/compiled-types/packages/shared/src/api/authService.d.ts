import type { ApiResponse, CreateAccountData, LoginCredentials, LoginSuccessData, Preference, UserPreference } from '../types/auth';
export declare function loginUser(credentials: LoginCredentials): Promise<ApiResponse<LoginSuccessData>>;
export declare function createUser(data: CreateAccountData): Promise<ApiResponse<{
    userID: string;
}>>;
export declare function updatePassword(email: string, password: string): Promise<ApiResponse>;
export declare function getUserByEmail(email: string): Promise<Array<{
    id: string;
}>>;
export declare function generateOtp(email: string, userId: string): Promise<ApiResponse>;
export declare function verifyOtp(email: string, userId: string, otp: string): Promise<ApiResponse>;
export declare function googleOAuth(idToken: string): Promise<ApiResponse<LoginSuccessData>>;
export declare function getPreferences(): Promise<ApiResponse<Preference[]>>;
export declare function saveUserPreferences(data: UserPreference): Promise<ApiResponse>;
export declare function persistPendingLoginCredentials(email: string, password: string): void;
export declare function getPendingLoginCredentials(): {
    email: string;
    password: string;
} | null;
export declare function clearPendingLoginCredentials(): void;
export declare function completeEnrollmentLogin(): Promise<ApiResponse<LoginSuccessData> | null>;
export declare function persistEnrollmentUserId(userId: string): void;
export declare function getEnrollmentUserId(): string;
export declare function persistSession(token: string, userId: string): void;
export declare function clearSession(): void;
export declare function getStoredUserId(): string;
export declare function persistSecureData(email: string, phone: string): void;
export declare function getSecureDataFromStorage(): {
    email: string;
    phone: string;
};
export declare function isAuthenticated(): boolean;
