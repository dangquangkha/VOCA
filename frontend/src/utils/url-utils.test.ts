import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvatarUrl } from './url-utils';

describe('getAvatarUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    it('should return a UI-avatars URL when no path is provided', () => {
        const url = getAvatarUrl(null, 'John Doe');
        expect(url).toContain('ui-avatars.com/api/');
        expect(url).toContain('name=John%20Doe');
    });

    it('should return the same URL if it starts with http', () => {
        const externalUrl = 'https://example.com/avatar.png';
        const url = getAvatarUrl(externalUrl);
        expect(url).toBe(externalUrl);
    });

    it('should resolve relative paths using the default API URL if env is missing', () => {
        process.env.NEXT_PUBLIC_API_URL = '';
        const path = 'uploads/avatar.png';
        const url = getAvatarUrl(path);
        // Default is http://127.0.0.1:8000
        expect(url).toBe('http://127.0.0.1:8000/uploads/avatar.png');
    });

    it('should resolve relative paths using NEXT_PUBLIC_API_URL and strip /api/v1', () => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.voca.vn/api/v1';
        const path = '/uploads/test.jpg';
        const url = getAvatarUrl(path);
        expect(url).toBe('https://api.voca.vn/uploads/test.jpg');
    });

    it('should handle paths with and without leading slash consistently', () => {
        process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
        expect(getAvatarUrl('test.png')).toBe('http://localhost:8000/test.png');
        expect(getAvatarUrl('/test.png')).toBe('http://localhost:8000/test.png');
    });
});
