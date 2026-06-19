import type { AppEnvironment } from '@config/environments/index';

export type OAuthCallbackProvider = 'google' | 'facebook' | 'apple';

export function resolveOAuthFromCognito(
  providerName: string,
  env: AppEnvironment,
): { endpoint: string; pendingProvider: OAuthCallbackProvider } {
  const normalized = providerName.toLowerCase();
  if (normalized.includes('apple')) {
    return { endpoint: env.endpoints.appleOAuth, pendingProvider: 'apple' };
  }
  if (normalized.includes('facebook')) {
    return { endpoint: env.endpoints.facebookOAuth, pendingProvider: 'facebook' };
  }
  return { endpoint: env.endpoints.googleOAuth, pendingProvider: 'google' };
}
