import { describe, it, expect } from 'vitest';
import { filterUsers, ModerationFilter } from './moderationFilters';

describe('moderationFilters', () => {
    const mockUsers = [
        { id: 1, full_name: 'John Doe', email: 'john@example.com', role: 'STUDENT', account_status: 'ACTIVE' },
        { id: 2, full_name: 'Jane Smith', email: 'jane@expert.com', role: 'EXPERT', account_status: 'ACTIVE' },
        { id: 3, full_name: 'Banned User', email: 'banned@voca.vn', role: 'STUDENT', account_status: 'BANNED' },
    ];

    it('should filter by role', () => {
        const filter: ModerationFilter = { role: 'EXPERT' };
        const result = filterUsers(mockUsers, filter);
        expect(result).toHaveLength(1);
        expect(result[0].full_name).toBe('Jane Smith');
    });

    it('should filter by account status', () => {
        const filter: ModerationFilter = { accountStatus: 'BANNED' };
        const result = filterUsers(mockUsers, filter);
        expect(result).toHaveLength(1);
        expect(result[0].account_status).toBe('BANNED');
    });

    it('should filter by search query (name)', () => {
        const filter: ModerationFilter = { searchQuery: 'Jane' };
        const result = filterUsers(mockUsers, filter);
        expect(result).toHaveLength(1);
        expect(result[0].full_name).toBe('Jane Smith');
    });

    it('should filter by search query (email)', () => {
        const filter: ModerationFilter = { searchQuery: 'example.com' };
        const result = filterUsers(mockUsers, filter);
        expect(result).toHaveLength(1);
        expect(result[0].email).toBe('john@example.com');
    });

    it('should return all users if filter is ALL or empty', () => {
        const filter: ModerationFilter = { role: 'ALL', accountStatus: 'ALL' };
        const result = filterUsers(mockUsers, filter);
        expect(result).toHaveLength(3);
    });

    it('should return empty list if no matches', () => {
        const filter: ModerationFilter = { searchQuery: 'NoSuchUser' };
        const result = filterUsers(mockUsers, filter);
        expect(result).toHaveLength(0);
    });
});
