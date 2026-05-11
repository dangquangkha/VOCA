import { http, HttpResponse } from 'msw';

export const handlers = [
    // Mock login endpoint
    http.post('*/auth/login/access-token', () => {
        return HttpResponse.json({
            access_token: 'mock-token',
            token_type: 'bearer',
        });
    }),

    // Mock users/me endpoint
    http.get('*/users/me', () => {
        return HttpResponse.json({
            id: 1,
            email: 'test@voca.vn',
            full_name: 'Test User',
            role: 'STUDENT',
            account_status: 'ACTIVE',
            expert_profile: null,
        });
    }),

    // Mock register endpoint
    http.post('*/auth/register', () => {
        return HttpResponse.json({
            id: 1,
            email: 'test@voca.vn',
            full_name: 'Test User',
            role: 'STUDENT',
        });
    }),
];
