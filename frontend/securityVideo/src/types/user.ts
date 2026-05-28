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
    department_id?: number;
    position?: string;
    position_id?: number;
    join_date?: string;
    roles: string[] | Role[];
    created_at: string;
    updated_at: string;
    is_active?: boolean;
    enrolled_courses?: { id: number; title: string }[];
    enrolled_programs?: { id: number; title: string }[];
    enrollments_count?: number;
    programs_count?: number;
    deleted_at?: string;
}
