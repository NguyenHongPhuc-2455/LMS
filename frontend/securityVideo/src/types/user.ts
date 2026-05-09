export interface Role {
    id: number;
    name: string;
    description?: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    avatar?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    bio?: string;
    employee_id?: string;
    department?: string;
    position?: string;
    join_date?: string;
    roles: string[] | Role[];
    created_at: string;
    updated_at: string;
    enrolled_courses?: { id: number; title: string }[];
    enrollments_count?: number;
}
