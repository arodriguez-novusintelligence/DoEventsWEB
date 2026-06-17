import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getEnvironment } from '../../../../config/environments/index';
import type { AppEnvironment } from '../../../../config/environments/index';

let apiClient: AxiosInstance | null = null;
let currentEnv: AppEnvironment | null = null;
let authToken = '';
let serviceToken = '';

export function initApiClient(env: AppEnvironment): AxiosInstance {
  currentEnv = env;
  apiClient = axios.create({
    baseURL: env.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  apiClient.interceptors.request.use((config) => {
    const token = authToken || serviceToken;
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  });

  return apiClient;
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    initApiClient(getEnvironment());
  }
  return apiClient!;
}

export function getCurrentEnv(): AppEnvironment {
  if (!currentEnv) {
    initApiClient(getEnvironment());
  }
  return currentEnv!;
}

export function setAuthToken(token: string): void {
  authToken = token;
  if (token) {
    localStorage.setItem('doevents_auth_token', token);
  } else {
    localStorage.removeItem('doevents_auth_token');
  }
}

export function getAuthToken(): string {
  if (!authToken) {
    authToken = localStorage.getItem('doevents_auth_token') || '';
  }
  return authToken;
}

export function setServiceToken(token: string): void {
  serviceToken = token;
}

export async function fetchServiceToken(): Promise<string> {
  const env = getCurrentEnv();
  const response = await axios.post(env.endpoints.generateToken, {}, {
    headers: { 'Content-Type': 'application/json' },
  });
  const token = response.data?.token || response.data?.accessToken || '';
  if (token) setServiceToken(token);
  return token;
}

export async function apiRequest<T>(
  config: AxiosRequestConfig,
  options?: { useServiceToken?: boolean }
): Promise<T> {
  const client = getApiClient();

  if (options?.useServiceToken && !serviceToken) {
    await fetchServiceToken();
  }

  const response = await client.request<T>(config);
  return response.data;
}
