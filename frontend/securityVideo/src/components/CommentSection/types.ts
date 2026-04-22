export interface User {
    id: number;
    full_name: string;
    avatar: string;
    username: string;
    roles?: string[];
}

export interface Comment {
    id: number;
    content: string;
    user_id: number;
    lesson_id: number;
    parent_id: number | null;
    created_at: string;
    user: User;
    replies?: Comment[];
}
