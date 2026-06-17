import { getCognitoLoginUrl } from '@config/environments/index';

export type OAuthProvider = 'Google' | 'Facebook' | 'SignInWithApple';

export function redirectToOAuth(provider: OAuthProvider): void {
  window.location.href = getCognitoLoginUrl(provider);
}
