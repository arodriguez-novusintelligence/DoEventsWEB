import type { AppDispatch } from '@doevents/shared';
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: {
                            credential?: string;
                            error?: string;
                        }) => void;
                    }) => void;
                    prompt: () => void;
                };
            };
        };
    }
}
declare function isCognitoConfigured(): boolean;
export declare function loginWithGoogleCognito(): void;
export declare function loginWithGoogleDirect(dispatch: AppDispatch, onSuccess: (message: string) => void, onError: (message: string) => void, onNeedsGustos: (userId: string) => void): Promise<void>;
export declare function loginWithGoogle(dispatch: AppDispatch, onSuccess: (message: string) => void, onError: (message: string) => void, onNeedsGustos: (userId: string) => void): Promise<void>;
export { isCognitoConfigured };
