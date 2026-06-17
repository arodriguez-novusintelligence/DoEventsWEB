import type { EventsFeedResponse, FeedEventItem, UserEventsResponse } from '../types/events';
export declare function fetchEventsFeed(userId?: string, offset?: number, limit?: number): Promise<EventsFeedResponse>;
export declare function fetchUserEvents(userId: string): Promise<UserEventsResponse>;
export declare function fetchEventById(eventId: string): Promise<FeedEventItem | null>;
export declare function fetchWallFeed(): Promise<unknown>;
