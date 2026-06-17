/**
 * Configuración centralizada de entornos DoEventsWEB.
 *
 * Para cambiar de entorno:
 *   - Desarrollo local: DOEVENTS_ENV=dev (por defecto)
 *   - QA:               DOEVENTS_ENV=qa
 *   - Producción:       DOEVENTS_ENV=prod
 *
 * También puede definirse en .env como VITE_DOEVENTS_ENV=qa
 */

export type EnvironmentName = 'dev' | 'qa' | 'prod';

export interface ApiEndpoints {
  login: string;
  googleOAuth: string;
  appleOAuth: string;
  appleCallback: string;
  createUser: string;
  updateUser: string;
  getUserByEmail: string;
  getUser: string;
  generateOtp: string;
  generateToken: string;
  preferences: string;
  userPreferences: string;
  eventsFeed: string;
  getUserEvents: string;
  getEvent: string;
  createEvent: string;
  publishEvent: string;
  searchEvents: string;
  eventLike: string;
  getEventsByFilter: string;
  eventTypes: string;
  wallFeed: string;
  getImage: string;
  userTickets: string;
  notificationsByUser: string;
  updateNotification: string;
  deleteNotification: string;
  deleteAllNotifications: string;
  profileImages: string;
  profileImagesUpload: string;
  profileCover: string;
  getUserStats: string;
  eventCalifications: string;
  canRequestRefund: string;
  processRefund: string;
  searchUsers: string;
  createVenue: string;
  triggerNotification: string;
  getFavoriteUserEvents: string;
  updateProfileVisibility: string;
  bankDataByUser: string;
  createBankData: string;
  setDefaultBankData: string;
  guestsBase: string;
  userInvitations: string;
  servicesBase: string;
  wompiBase: string;
  subscriptionsBase: string;
  adminBase: string;
  aiAssistant: string;
}

export interface ChatEndpoints {
  restBaseUrl: string;
  websocketUrl: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    enabled: boolean;
  };
  facebook: {
    appId: string;
    enabled: boolean;
  };
  apple: {
    clientId: string;
    enabled: boolean;
  };
}

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectSignIn: string;
  redirectSignOut: string;
}

export interface AppEnvironment {
  name: EnvironmentName;
  label: string;
  awsRegion: string;
  apiBaseUrl: string;
  webBaseUrl: string;
  websocketUrl: string;
  dynamoDbSuffix: string;
  lambdaPrefix: string;
  endpoints: ApiEndpoints;
  chat: ChatEndpoints;
  cognito: CognitoConfig;
  oauth: OAuthConfig;
  features: {
    auth: boolean;
    events: boolean;
    chat: boolean;
    notifications: boolean;
    aiAssistant: boolean;
  };
  googleMapsApiKey: string;
}

/** Chat REST/WebSocket — QA usa api-qa + WS en us-east-2 */
const QA_CHAT_REST = 'https://api-qa.doeventsapp.com/chats';
const QA_CHAT_WS = 'wss://zjg66jel41.execute-api.us-east-2.amazonaws.com/qa';
const US_CHAT_REST = 'https://s74yw0vme7.execute-api.us-east-1.amazonaws.com/dev';
const US_CHAT_WS = 'wss://g3216zaw17.execute-api.us-east-1.amazonaws.com/dev';

/** Rutas con prefijo según API mappings de api-qa.doeventsapp.com */
const buildEndpoints = (baseUrl: string): ApiEndpoints => ({
  login: `${baseUrl}/login/login`,
  googleOAuth: `${baseUrl}/login/googleOAuth`,
  appleOAuth: `${baseUrl}/login/appleOAuth`,
  appleCallback: `${baseUrl}/login/apple-callback`,
  createUser: `${baseUrl}/users/createUser`,
  updateUser: `${baseUrl}/users/updateUser`,
  getUserByEmail: `${baseUrl}/users/getUserByEmail`,
  getUser: `${baseUrl}/users/getUser`,
  generateOtp: `${baseUrl}/auth/generateOtp`,
  generateToken: `${baseUrl}/auth/generateToken`,
  preferences: `${baseUrl}/auth/preference`,
  userPreferences: `${baseUrl}/auth/userPreference`,
  eventsFeed: `${baseUrl}/events-feed/eventsFeed`,
  getUserEvents: `${baseUrl}/events/getUserEvents`,
  getEvent: `${baseUrl}/events/getEvents`,
  createEvent: `${baseUrl}/events/createEvent`,
  publishEvent: `${baseUrl}/events/publishEvent`,
  searchEvents: `${baseUrl}/events/searchEvents`,
  eventLike: `${baseUrl}/events/eventLike`,
  getEventsByFilter: `${baseUrl}/events/getEventsByFilter`,
  eventTypes: `${baseUrl}/event-types/EventTypes`,
  wallFeed: `${baseUrl}/wall/v1/feed/home`,
  getImage: `${baseUrl}/images/getImageById`,
  userTickets: `${baseUrl}/orders/users`,
  notificationsByUser: `${baseUrl}/notifications/notifications-by-user`,
  updateNotification: `${baseUrl}/notifications/update-notification`,
  deleteNotification: `${baseUrl}/notifications/notifications`,
  deleteAllNotifications: `${baseUrl}/notifications/notifications`,
  profileImages: `${baseUrl}/users/users`,
  profileImagesUpload: `${baseUrl}/users/users`,
  profileCover: `${baseUrl}/users/users`,
  getUserStats: `${baseUrl}/users/getUserStats`,
  eventCalifications: `${baseUrl}/events/events`,
  canRequestRefund: `${baseUrl}/events/canRequestRefund`,
  processRefund: `${baseUrl}/events/processRefund`,
  searchUsers: `${baseUrl}/users/searchUsers`,
  createVenue: `${baseUrl}/venues/venues`,
  triggerNotification: `${baseUrl}/notifications/trigger-notification`,
  getFavoriteUserEvents: `${baseUrl}/events/getFavoriteUserEvents`,
  updateProfileVisibility: `${baseUrl}/users/updateUserProfileVisibility`,
  bankDataByUser: `${baseUrl}/bank/obtenerDatosBancariosByUserId`,
  createBankData: `${baseUrl}/bank/crearDatosBancarios`,
  setDefaultBankData: `${baseUrl}/bank/datosBancarios`,
  guestsBase: `${baseUrl}/guests`,
  userInvitations: `${baseUrl}/users`,
  servicesBase: `${baseUrl}/services`,
  wompiBase: `${baseUrl}/checkouts`,
  subscriptionsBase: `${baseUrl}/subscriptions`,
  adminBase: `${baseUrl}/backoffice`,
  aiAssistant: `${baseUrl}/ai`,
});

const buildChat = (restBaseUrl: string, websocketUrl: string): ChatEndpoints => ({
  restBaseUrl,
  websocketUrl,
});

const dev: AppEnvironment = {
  name: 'dev',
  label: 'Desarrollo Local',
  awsRegion: 'us-east-1',
  apiBaseUrl: 'https://api-qa.doeventsapp.com',
  webBaseUrl: 'https://qa.doeventsapp.com',
  websocketUrl: 'wss://ws-qa.doeventsapp.com',
  dynamoDbSuffix: '-qa',
  lambdaPrefix: 'qa-',
  endpoints: buildEndpoints('https://api-qa.doeventsapp.com'),
  chat: buildChat(QA_CHAT_REST, QA_CHAT_WS),
  cognito: {
    region: 'us-east-2',
    userPoolId: 'CONFIGURE_QA_USER_POOL_ID',
    clientId: 'CONFIGURE_QA_CLIENT_ID',
    domain: 'doevents-qa.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://qa.doeventsapp.com/auth/callback',
    redirectSignOut: 'https://qa.doeventsapp.com/auth/login',
  },
  oauth: {
    google: {
      clientId: '465354618241-o281g4an56hcrvmjgc3p727otg2fej8m.apps.googleusercontent.com',
      enabled: true,
    },
    facebook: { appId: '', enabled: false },
    apple: { clientId: '', enabled: false },
  },
  features: {
    auth: true,
    events: true,
    chat: true,
    notifications: true,
    aiAssistant: true,
  },
  googleMapsApiKey: '',
};

const qa: AppEnvironment = {
  name: 'qa',
  label: 'QA - Pre-producción',
  awsRegion: 'us-east-2',
  apiBaseUrl: 'https://api-qa.doeventsapp.com',
  webBaseUrl: 'https://qa.doeventsapp.com',
  websocketUrl: 'wss://ws-qa.doeventsapp.com',
  dynamoDbSuffix: '-qa',
  lambdaPrefix: 'qa-',
  endpoints: buildEndpoints('https://api-qa.doeventsapp.com'),
  chat: buildChat(QA_CHAT_REST, QA_CHAT_WS),
  cognito: {
    region: 'us-east-2',
    userPoolId: 'CONFIGURE_QA_USER_POOL_ID',
    clientId: 'CONFIGURE_QA_CLIENT_ID',
    domain: 'doevents-qa.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://qa.doeventsapp.com/auth/callback',
    redirectSignOut: 'https://qa.doeventsapp.com/auth/login',
  },
  oauth: {
    google: {
      clientId: '465354618241-o281g4an56hcrvmjgc3p727otg2fej8m.apps.googleusercontent.com',
      enabled: true,
    },
    facebook: { appId: 'CONFIGURE_FACEBOOK_APP_ID', enabled: false },
    apple: { clientId: 'CONFIGURE_APPLE_SERVICES_ID', enabled: false },
  },
  features: {
    auth: true,
    events: true,
    chat: true,
    notifications: true,
    aiAssistant: true,
  },
  googleMapsApiKey: '',
};

const prod: AppEnvironment = {
  name: 'prod',
  label: 'Producción',
  awsRegion: 'us-east-1',
  apiBaseUrl: 'https://api.doeventsapp.com',
  webBaseUrl: 'https://doeventsapp.com',
  websocketUrl: 'wss://ws.doeventsapp.com',
  dynamoDbSuffix: '',
  lambdaPrefix: '',
  endpoints: buildEndpoints('https://api.doeventsapp.com'),
  chat: buildChat(US_CHAT_REST.replace('/dev', '/prod'), 'wss://ws.doeventsapp.com'),
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_WDpSw6deY',
    clientId: '58nnh6a3h9d5v0ng66bar2t00v',
    domain: 'doevents.auth.us-east-1.amazoncognito.com',
    redirectSignIn: 'https://doeventsapp.com/auth/callback',
    redirectSignOut: 'https://doeventsapp.com/login',
  },
  oauth: {
    google: { clientId: '', enabled: false },
    facebook: { appId: '', enabled: false },
    apple: { clientId: '', enabled: false },
  },
  features: {
    auth: true,
    events: true,
    chat: true,
    notifications: true,
    aiAssistant: false,
  },
  googleMapsApiKey: '',
};

/** Lee variables VITE_* inyectadas en build (sin exponer secrets en frontend). */
function envVar(key: string, fallback = ''): string {
  if (typeof import.meta !== 'undefined') {
    const val = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
    if (val) return val;
  }
  return fallback;
}

function applyRuntimeOverrides(base: AppEnvironment): AppEnvironment {
  const googleClientId = envVar('VITE_GOOGLE_CLIENT_ID', base.oauth.google.clientId);
  const facebookAppId = envVar('VITE_FACEBOOK_APP_ID', base.oauth.facebook.appId);
  const appleClientId = envVar('VITE_APPLE_CLIENT_ID', base.oauth.apple.clientId);
  const cognitoPoolId = envVar('VITE_COGNITO_USER_POOL_ID', base.cognito.userPoolId);
  const cognitoClientId = envVar('VITE_COGNITO_CLIENT_ID', base.cognito.clientId);
  const cognitoDomain = envVar('VITE_COGNITO_DOMAIN', base.cognito.domain);

  const googleConfigured = googleClientId.length > 0 && !googleClientId.startsWith('CONFIGURE_');
  const facebookConfigured = facebookAppId.length > 0 && !facebookAppId.startsWith('CONFIGURE_');
  const appleConfigured = appleClientId.length > 0 && !appleClientId.startsWith('CONFIGURE_');

  const googleMapsApiKey = envVar('VITE_GOOGLE_MAPS_API_KEY', base.googleMapsApiKey);

  return {
    ...base,
    googleMapsApiKey,
    cognito: {
      ...base.cognito,
      userPoolId: cognitoPoolId,
      clientId: cognitoClientId,
      domain: cognitoDomain,
    },
    oauth: {
      google: { clientId: googleClientId, enabled: googleConfigured },
      facebook: { appId: facebookAppId, enabled: facebookConfigured },
      apple: { clientId: appleClientId, enabled: appleConfigured },
    },
  };
}

const environments: Record<EnvironmentName, AppEnvironment> = { dev, qa, prod };

export function resolveEnvironment(): EnvironmentName {
  const fromVite = typeof import.meta !== 'undefined'
    ? (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_DOEVENTS_ENV
    : undefined;
  const envName = (fromVite || 'dev') as EnvironmentName;
  return envName in environments ? envName : 'dev';
}

export function getEnvironment(): AppEnvironment {
  return applyRuntimeOverrides(environments[resolveEnvironment()]);
}

export function getEnvironmentByName(name: EnvironmentName): AppEnvironment {
  return applyRuntimeOverrides(environments[name]);
}

/** URL de login federado vía Cognito Hosted UI */
export function getCognitoLoginUrl(provider?: 'Google' | 'Facebook' | 'SignInWithApple'): string {
  const env = getEnvironment();
  const base = `https://${env.cognito.domain}/oauth2/authorize`;
  const params = new URLSearchParams({
    client_id: env.cognito.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: env.cognito.redirectSignIn,
  });
  if (provider) params.set('identity_provider', provider);
  return `${base}?${params.toString()}`;
}

export default getEnvironment;
