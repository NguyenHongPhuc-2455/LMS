import api from "./api";

export interface Employee {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    avatar: string | null;
    employee_id: string | null;
    join_date: string | null;
    position: string;
    department: string;
    total_courses: number;
}

export interface EmployeeListResponse {
    employees: Employee[];
    total: number;
    page: number;
    totalPages: number;
}

export interface CourseProgress {
    course_id: number;
    title: string;
    thumbnail: string | null;
    level: string | null;
    is_mandatory: boolean;
    progress: number;
    completed_count: number;
    total_lessons: number;
    enrolled_at: string;
    deadline_date: string | null;
    is_overdue: boolean;
}

export interface EmployeeProgressResponse {
    employee: {
        id: number;
        full_name: string | null;
        avatar: string | null;
        employee_id: string | null;
        email: string;
        join_date: string | null;
        department: string;
        position: string;
    };
    courses: CourseProgress[];
}

export interface InactiveEmployee {
    id: number;
    full_name: string | null;
    employee_id: string | null;
    avatar: string | null;
    position: string;
    total_duration_minutes: number;
    total_completed_lessons: number;
    total_mandatory_courses: number;
    is_inactive: boolean;
}

export interface InactiveEmployeesResponse {
    days: number;
    total_inactive: number;
    employees: InactiveEmployee[];
}

export const managerService = {
    getEmployees: async (params?: { page: number; limit: number; search?: string; positionId?: number; departmentId?: number }): Promise<EmployeeListResponse> => {
        const response = await api.get('/manager/employees', { params });
        return response.data;
    },
    getEmployeeProgress: async (id: number): Promise<EmployeeProgressResponse> => {
        const response = await api.get(`/manager/employees/${id}/progress`);
        return response.data;
    },
    getInactiveEmployees: async (days: number = 7): Promise<InactiveEmployeesResponse> => {
        const response = await api.get('/manager/reports/inactive', { params: { days } });
        return response.data;
    },
    sendReminder: async (employeeId: number, message?: string): Promise<{ message: string }> => {
        const response = await api.post('/manager/reminders', { employeeId, message });
        return response.data;
    }
};
