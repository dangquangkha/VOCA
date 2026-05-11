/**
 * Global utility to resolve avatar URLs consistently across the application.
 */
export function getAvatarUrl(path: string | null | undefined, fullName: string = 'User'): string {
    if (!path) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0A1018&color=C9A84C&size=200&bold=true`;
    }

    if (path.startsWith('http')) {
        return path;
    }

    // Resolve relative path using backend API URL
    // Default to localhost:8001 if env is missing
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';
    // Remove /api/v1 if it exists in the base URL to get the root (where /uploads is)
    const rootBase = apiBase.replace('/api/v1', '');
    const cleanRootBase = rootBase.endsWith('/') ? rootBase.slice(0, -1) : rootBase;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanRootBase}${cleanPath}`;
}
