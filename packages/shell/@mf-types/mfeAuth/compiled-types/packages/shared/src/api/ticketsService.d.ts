export interface UserTicketOrder {
    id?: string;
    amount?: number;
    metadata?: {
        eventName?: string;
        reference?: string;
        orderTotals?: {
            total_amount?: number;
        };
    };
    tickets?: Array<{
        id?: string;
        qrCodeKey?: string;
        status?: string;
    }>;
}
export declare function fetchUserTickets(userId: string): Promise<UserTicketOrder[]>;
