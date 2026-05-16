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
    created_at: string;
    instructor?: { full_name: string };
    courses: ProgramCourse[];
    _count?: { enrollments: number; courses: number };
}
