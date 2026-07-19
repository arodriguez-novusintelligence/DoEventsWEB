import { getEnvironment } from '../../../../config/environments/index';
import { apiRequest, getCurrentEnv, setAuthToken } from './client';
import type {
  ApiResponse,
  CreateAccountData,
  LoginCredentials,
  LoginErrorData,
  LoginSuccessData,
  OtpAction,
  Preference,
  UserPreference,
} from '../types/auth';
import { invalidateWallCache } from '../lib/eventsCache';
import {
  clearPersistedOAuthProfilePhotos,
  clearPersistedUserDisplayName,
  persistOAuthDisplayName,
  persistOAuthProfilePhoto,
} from '../lib/userDisplayName';

function endpoints() {
  try {
    return getCurrentEnv().endpoints;
  } catch {
    return getEnvironment().endpoints;
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<ApiResponse<LoginSuccessData>> {
  try {
    return await apiRequest<ApiResponse<LoginSuccessData>>({
      method: 'POST',
      url: endpoints().login,
      data: credentials,
    });
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: ApiResponse<LoginErrorData> } };
    if (axiosError.response?.data) {
      throw axiosError;
    }
    const env = getEnvironment();
    const response = await fetch(env.endpoints.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(credentials),
    });
    const body = await response.json() as ApiResponse<LoginSuccessData> & ApiResponse<LoginErrorData>;
    if (!response.ok) {
      const err = new Error(body.message || 'Error al iniciar sesión') as Error & {
        response?: { data: ApiResponse<LoginErrorData> };
      };
      err.response = { data: body as ApiResponse<LoginErrorData> };
      throw err;
    }
    return body as ApiResponse<LoginSuccessData>;
  }
}

export async function createUser(data: CreateAccountData): Promise<ApiResponse<{ userID: string }>> {
  const username = (data.username || data.email.split('@')[0] || 'user')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 20) || `user${Date.now().toString().slice(-6)}`;
  const payload = {
    name: data.name,
    lastName: data.lastName,
    date: data.birthDate || '1990-01-01',
    phone: `${data.indicativo || '+57'}${data.phone}`.replace(/\s/g, ''),
    email: data.email.trim().toLowerCase(),
    user: username,
    password: data.password,
    indicativo: data.indicativo || '+57',
    fotoPerfilBase64: data.fotoPerfilBase64,
    termsAccepted: true,
  };
  return apiRequest<ApiResponse<{ userID: string }>>(
    { method: 'POST', url: endpoints().createUser, data: payload },
    { useServiceToken: true },
  );
}

export async function sendActivationLink(email: string, userId: string): Promise<ApiResponse> {
  return requestAuthAction({ action: 'sendActivationLink', email, userId });
}

export async function sendPasswordResetLink(email: string, userId: string): Promise<ApiResponse> {
  return requestAuthAction({ action: 'sendResetLink', email, userId });
}

export async function verifyAuthLink(
  email: string,
  userId: string,
  token: string,
  purpose: 'activation' | 'reset',
): Promise<ApiResponse> {
  return requestAuthAction({ action: 'verifyLink', email, userId, token, purpose });
}

export async function resetPasswordWithToken(
  email: string,
  userId: string,
  token: string,
  newPassword: string,
  otp?: string,
): Promise<ApiResponse> {
  return requestAuthAction({
    action: 'resetPasswordWithToken',
    email,
    userId,
    token: token || undefined,
    otp: otp || undefined,
    newPassword,
  });
}

async function requestAuthAction(payload: OtpAction): Promise<ApiResponse & { sentVia?: string[] }> {
  const data = await apiRequest<{ message?: string; success?: boolean; sentVia?: string[] }>({
    method: 'POST',
    url: endpoints().generateOtp,
    data: payload,
  });
  return {
    success: data.success === true,
    message: data.message || 'Operación completada',
    data,
    sentVia: data.sentVia,
  };
}

export async function updatePassword(email: string, password: string): Promise<ApiResponse> {
  const data = await apiRequest<{ statusDesc?: string; statusCode?: number; success?: boolean; message?: string }>(
    { method: 'POST', url: endpoints().updateUser, data: { email, password } },
    { useServiceToken: true },
  );
  const success = data.success !== false && (data.statusCode === undefined || data.statusCode === 200);
  return {
    success: Boolean(success),
    message: data.statusDesc || data.message || 'Contraseña actualizada',
    data,
    statusDesc: data.statusDesc,
  };
}

export async function getUserByEmail(email: string): Promise<Array<{ id: string }>> {
  return apiRequest<Array<{ id: string }>>({
    method: 'GET',
    url: `${endpoints().getUserByEmail}/${encodeURIComponent(email)}`,
  });
}

export async function generateOtp(
  email: string,
  userId: string,
  options?: { phoneNumber?: string; sendVia?: Array<'email' | 'sms' | 'whatsapp'> },
): Promise<ApiResponse> {
  const payload: OtpAction = {
    action: 'generate',
    email,
    userId,
    phoneNumber: options?.phoneNumber,
    sendVia: options?.sendVia || ['email', 'whatsapp'],
  };
  const data = await apiRequest<{ message?: string; success?: boolean }>({
    method: 'POST',
    url: endpoints().generateOtp,
    data: payload,
  });
  return {
    success: data.success ?? true,
    message: data.message || 'OTP enviado',
    data,
  };
}

/** OTP de activación (legacy). El registro email/contraseña usa sendActivationLink. */
export async function generateEnrollmentOtp(
  email: string,
  userId: string,
  phoneNumber: string,
): Promise<ApiResponse> {
  return generateOtp(email, userId, { phoneNumber, sendVia: ['email', 'whatsapp'] });
}

export async function verifyOtp(email: string, userId: string, otp: string): Promise<ApiResponse> {
  const payload: OtpAction = { action: 'verify', email, userId, otp };
  const data = await apiRequest<{ message?: string; success?: boolean }>({
    method: 'POST',
    url: endpoints().generateOtp,
    data: payload,
  });
  return {
    success: data.success ?? true,
    message: data.message || 'OTP verificado',
    data,
  };
}

export async function googleOAuth(idToken: string): Promise<ApiResponse<LoginSuccessData>> {
  const response = await apiRequest<ApiResponse<LoginSuccessData>>({
    method: 'POST',
    url: endpoints().googleOAuth,
    data: { idToken },
  });
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }
  return response;
}

interface RawPreference {
  preference_id?: number;
  preference_name_es?: string;
  preference_name_en?: string;
  preference_description?: string;
  id?: number;
  name?: string;
  description?: string;
}

function mapPreference(raw: RawPreference): Preference {
  const id = Number(raw.preference_id ?? raw.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    name: raw.preference_name_es || raw.preference_name_en || raw.name || '',
    description: raw.preference_description || raw.description,
  };
}

function normalizePreferences(raw: RawPreference[]): Preference[] {
  return raw.map(mapPreference).filter((p) => Number.isFinite(p.id) && p.id > 0 && !!p.name);
}

async function fetchPreferencesDirect(): Promise<Preference[]> {
  const env = getEnvironment();
  const response = await fetch(env.endpoints.preferences, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`No se pudieron cargar preferencias (${response.status})`);
  }
  const body = await response.json() as { success?: boolean; data?: RawPreference[] };
  return normalizePreferences(body.data || []);
}

export async function getPreferences(): Promise<ApiResponse<Preference[]>> {
  try {
    const response = await apiRequest<{ success?: boolean; data?: RawPreference[] }>({
      method: 'GET',
      url: endpoints().preferences,
    });
    const items = normalizePreferences(response.data || []);
    if (items.length > 0) {
      return { success: response.success ?? true, message: '', data: items };
    }
  } catch {
    // fallback abajo
  }
  const items = await fetchPreferencesDirect();
  return { success: true, message: '', data: items };
}

export async function saveUserPreferences(data: UserPreference): Promise<ApiResponse> {
  try {
    const response = await apiRequest<{ success?: boolean; message?: string }>({
      method: 'POST',
      url: endpoints().userPreferences,
      data,
    });
    return {
      success: response.success ?? true,
      message: response.message || 'Preferencias guardadas correctamente',
      data: response,
    };
  } catch (error: unknown) {
    const env = getEnvironment();
    const response = await fetch(env.endpoints.userPreferences, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await response.json() as { success?: boolean; message?: string };
    if (!response.ok || body.success === false) {
      throw error;
    }
    return {
      success: true,
      message: body.message || 'Preferencias guardadas correctamente',
      data: body,
    };
  }
}

const PENDING_EMAIL_KEY = 'doevents_pending_login_email';
const PENDING_PASSWORD_KEY = 'doevents_pending_login_password';
const PENDING_OAUTH_USER_KEY = 'doevents_pending_oauth_user';

export interface PendingOAuthUser {
  provider: 'google' | 'facebook' | 'apple';
  user: {
    id: string;
    email: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    photo?: string;
  };
}

export function persistPendingLoginCredentials(email: string, password: string): void {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email.trim().toLowerCase());
  sessionStorage.setItem(PENDING_PASSWORD_KEY, password);
}

export function getPendingLoginCredentials(): { email: string; password: string } | null {
  const email = sessionStorage.getItem(PENDING_EMAIL_KEY) || '';
  const password = sessionStorage.getItem(PENDING_PASSWORD_KEY) || '';
  if (!email || !password) return null;
  return { email, password };
}

export function clearPendingLoginCredentials(): void {
  sessionStorage.removeItem(PENDING_EMAIL_KEY);
  sessionStorage.removeItem(PENDING_PASSWORD_KEY);
}

export function persistPendingOAuthUser(payload: PendingOAuthUser): void {
  sessionStorage.setItem(PENDING_OAUTH_USER_KEY, JSON.stringify(payload));
}

export function getPendingOAuthUser(): PendingOAuthUser | null {
  const raw = sessionStorage.getItem(PENDING_OAUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOAuthUser;
  } catch {
    return null;
  }
}

export function clearPendingOAuthUser(): void {
  sessionStorage.removeItem(PENDING_OAUTH_USER_KEY);
}

async function retryOAuthEnrollment(): Promise<ApiResponse<LoginSuccessData> | null> {
  const pending = getPendingOAuthUser();
  if (!pending) return null;

  const env = getEnvironment();
  const endpoint = pending.provider === 'apple'
    ? env.endpoints.appleOAuth
    : pending.provider === 'facebook'
      ? env.endpoints.facebookOAuth
      : env.endpoints.googleOAuth;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ data: { user: pending.user } }),
  });

  const body = await response.json() as ApiResponse<LoginSuccessData> & {
    data?: LoginSuccessData & { codigoRespuesta?: number; userId?: string };
  };

  if (body.success && body.data?.token) {
    clearPendingOAuthUser();
    setAuthToken(body.data.token);
    return body as ApiResponse<LoginSuccessData>;
  }

  if (body.data?.codigoRespuesta === 3) {
    return null;
  }

  return body as ApiResponse<LoginSuccessData>;
}

export async function completeEnrollmentLogin(): Promise<ApiResponse<LoginSuccessData> | null> {
  const pending = getPendingLoginCredentials();
  if (pending) {
    const response = await loginUser(pending);
    if (response.success && response.data?.token) {
      clearPendingLoginCredentials();
    }
    return response;
  }
  return retryOAuthEnrollment();
}

export function persistEnrollmentUserId(userId: string): void {
  if (!userId) return;
  localStorage.setItem('doevents_user_id', userId);
  localStorage.setItem('doevents_enrollment_user_id', userId);
}

export function getEnrollmentUserId(): string {
  return localStorage.getItem('doevents_enrollment_user_id')
    || localStorage.getItem('doevents_user_id')
    || '';
}

export function persistSession(
  token: string,
  userId: string,
  displayName?: string,
  profilePhoto?: string,
  platformRole?: string,
): void {
  setAuthToken(token);
  localStorage.setItem('doevents_user_id', userId);
  if (displayName?.trim()) {
    persistOAuthDisplayName(displayName);
  }
  if (profilePhoto?.trim()) {
    persistOAuthProfilePhoto(userId, profilePhoto);
  }
  if (platformRole?.trim()) {
    localStorage.setItem('doevents_platform_role', platformRole.trim().toLowerCase());
  }
}

export function getPersistedPlatformRole(): string | null {
  return localStorage.getItem('doevents_platform_role');
}

export function persistPlatformRole(platformRole?: string | null): void {
  const role = String(platformRole || '').trim().toLowerCase();
  if (role) {
    localStorage.setItem('doevents_platform_role', role);
  } else {
    localStorage.removeItem('doevents_platform_role');
  }
}

export function clearSession(): void {
  setAuthToken('');
  localStorage.removeItem('doevents_user_id');
  localStorage.removeItem('doevents_platform_role');
  localStorage.removeItem('doevents_enrollment_user_id');
  localStorage.removeItem('doevents_secure_email');
  localStorage.removeItem('doevents_secure_phone');
  clearPendingLoginCredentials();
  clearPendingOAuthUser();
  invalidateWallCache();
  clearPersistedUserDisplayName();
  clearPersistedOAuthProfilePhotos();
}

export function getStoredUserId(): string {
  return localStorage.getItem('doevents_user_id') || '';
}

export function persistSecureData(email: string, phone: string): void {
  localStorage.setItem('doevents_secure_email', email);
  localStorage.setItem('doevents_secure_phone', phone);
}

export function getSecureDataFromStorage(): { email: string; phone: string } {
  return {
    email: localStorage.getItem('doevents_secure_email') || '',
    phone: localStorage.getItem('doevents_secure_phone') || '',
  };
}

export function isAuthenticated(): boolean {
  return !!getStoredUserId() && !!localStorage.getItem('doevents_auth_token');
}
