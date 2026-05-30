import api from '@/lib/api';

export interface UserQueryParams {
    skip?: number;
    limit?: number;
    role?: string;
    account_status?: string;
    is_active?: boolean;
    search?: string;
    sort_by?: string;
    sort_desc?: boolean;
}

export interface UserCreateDto {
    email: string;
    password: string;
    full_name: string;
    phone_number: string;
    role?: 'STUDENT' | 'EXPERT' | 'ADMIN';
    credits?: number;
    is_active?: boolean;
    is_superuser?: boolean;
}

export interface UserUpdateDto {
    email?: string;
    full_name?: string;
    phone_number?: string;
    role?: 'STUDENT' | 'EXPERT' | 'ADMIN';
    credits?: number;
    is_active?: boolean;
    is_superuser?: boolean;
    account_status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    phone_number?: string;
    role: 'STUDENT' | 'EXPERT' | 'ADMIN';
    credits: number;
    is_active: boolean;
    is_superuser: boolean;
    account_status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    created_at?: string;
}

export interface PaginatedUserResponse {
    items: User[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export const userService = {
    /**
     * Get users with pagination, filtering, search, and sorting
     */
    getUsers: async (params: UserQueryParams): Promise<PaginatedUserResponse> => {
        const response = await api.get('users/admin/users', { params });
        return response.data;
    },

    /**
     * Create a new user
     */
    createUser: async (data: UserCreateDto): Promise<User> => {
        const response = await api.post('users/admin/users', data);
        return response.data;
    },

    /**
     * Update user by ID
     */
    updateUser: async (id: number, data: UserUpdateDto): Promise<User> => {
        const response = await api.put(`users/admin/users/${id}`, data);
        return response.data;
    },

    /**
     * Delete user (soft delete by default)
     */
    deleteUser: async (id: number, hardDelete: boolean = false): Promise<void> => {
        await api.delete(`users/admin/users/${id}`, {
            params: { hard_delete: hardDelete }
        });
    }
};
