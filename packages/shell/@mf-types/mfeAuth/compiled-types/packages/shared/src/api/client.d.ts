import { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { AppEnvironment } from '../../../../config/environments/index';
export declare function initApiClient(env: AppEnvironment): AxiosInstance;
export declare function getApiClient(): AxiosInstance;
export declare function getCurrentEnv(): AppEnvironment;
export declare function setAuthToken(token: string): void;
export declare function getAuthToken(): string;
export declare function setServiceToken(token: string): void;
export declare function fetchServiceToken(): Promise<string>;
export declare function apiRequest<T>(config: AxiosRequestConfig, options?: {
    useServiceToken?: boolean;
}): Promise<T>;
