import type { Course } from './course';

export interface ProgramCourse {
    order: number;
    course: Course;
}

export interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    
    is_mandatory?: boolean;
    mandatory_at?: string | null;
    apply_scope?: 'ALL_EMPLOYEE' | 'BY_DEPARTMENT' | 'BY_POSITION' | 'SPECIFIC_USER' | 'NEW_EMPLOYEE' | 'NEW_EMPLOYEE_BY_DEPARTMENT' | 'NEW_EMPLOYEE_BY_POSITION';
    mandatory_targets?: any;
    mandatory_deadline_days?: number | null;
    mandatory_start_date?: string | null;
    mandatory_end_date?: string | null;
    allow_early_access?: boolean;

    created_at: string;
    instructor?: { full_name: string };
    courses: ProgramCourse[];
    _count?: { enrollments: number; courses: number };
}
