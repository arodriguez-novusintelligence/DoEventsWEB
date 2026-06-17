export interface AppNotification {
    id: string;
    notificationId?: string;
    userId?: string;
    channel?: string;
    type?: string;
    status?: string;
    title?: string;
    message?: string;
    createdAt?: string;
    read?: boolean;
}
export declare function fetchUserNotifications(userId: string): Promise<AppNotification[]>;
