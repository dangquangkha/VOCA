// Enhanced filtering for moderation dashboard

export interface ModerationFilter {
    role?: "STUDENT" | "EXPERT" | "ALL";
    accountStatus?: "ACTIVE" | "SUSPENDED" | "BANNED" | "ALL";
    searchQuery?: string;
}

export function filterUsers(users: any[], filter: ModerationFilter) {
    return users.filter(user => {
        // Role filter
        if (filter.role && filter.role !== "ALL" && user.role !== filter.role) {
            return false;
        }

        // Account status filter
        if (filter.accountStatus && filter.accountStatus !== "ALL" && user.account_status !== filter.accountStatus) {
            return false;
        }

        // Search query filter
        if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            const matchesName = user.full_name?.toLowerCase().includes(query);
            const matchesEmail = user.email?.toLowerCase().includes(query);
            const matchesId = user.id.toString().includes(query);

            if (!matchesName && !matchesEmail && !matchesId) {
                return false;
            }
        }

        return true;
    });
}
