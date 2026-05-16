export interface Lesson {
    id: number;
    section_id: number;
    title: string;
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
    video_url?: string | null;
    content?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    duration?: number;
    order: number;
    is_free: boolean;
    isCompleted?: boolean;
}

export interface Section {
    id: number;
    course_id: number;
    title: string;
    order: number;
    lessons: Lesson[];
}

export interface Course {
    id: number;
    category_id?: number | null;
    instructor_id: number;
    title: string;
    description: string;
    level: string;
    thumbnail: string;
    intro_video_url?: string;
    learning_outcomes?: string;
    requirements?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    is_private: boolean;
    is_mandatory: boolean;
    apply_scope: string;
    mandatory_targets?: any;
    mandatory_deadline_days?: number;
    mandatory_start_date?: string | null;
    mandatory_end_date?: string | null;
    allow_early_access: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    category?: { id: number; name: string };
    instructor?: {
        id: number;
        username: string;
        full_name: string;
        email: string;
        phone?: string;
    };
    sections?: Section[];
    _count?: {
        sections: number;
        enrollments: number;
    };
    
    // UI states
    hasAccess?: boolean;
    requestStatus?: string | null;
    isOverdue?: boolean;
    remainingDays?: number;
    canAccess?: boolean;
    accessReason?: string;
    deadlineDate?: string;
    progressPercent?: number;
    isCourseFinished?: boolean;
}
