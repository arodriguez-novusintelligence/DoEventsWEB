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
    eventTypes: string;
    wallFeed: string;
    getImage: string;
    userTickets: string;
    notificationsByUser: string;
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
    cognito: CognitoConfig;
    oauth: OAuthConfig;
    features: {
        auth: boolean;
        events: boolean;
        chat: boolean;
        notifications: boolean;
    };
}
export declare function resolveEnvironment(): EnvironmentName;
export declare function getEnvironment(): AppEnvironment;
export declare function getEnvironmentByName(name: EnvironmentName): AppEnvironment;
/** URL de login federado vía Cognito Hosted UI */
export declare function getCognitoLoginUrl(provider?: 'Google' | 'Facebook' | 'SignInWithApple'): string;
export default getEnvironment;
