export interface ReportCourse {
    courseId: number;
    courseTitle: string;
    daysOverdue?: number;
    remainingDays?: number;
    progress: number;
    isCompleted?: boolean;
}

export interface ReportUser {
    userId: number;
    fullName: string;
    email: string;
    phone?: string;
    employeeId?: string;
    department?: string;
    joinDate: string;
    courses: ReportCourse[];
}
