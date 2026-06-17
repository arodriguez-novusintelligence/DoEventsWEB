export interface UserProfile {
    id?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    phone?: string;
    username?: string;
    imagen?: string;
    bio?: string;
}
export declare function fetchUserById(userId: string): Promise<UserProfile | null>;
