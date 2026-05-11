import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ExpertExplorePage from './page';
import api from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ExpertExplorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the explore page and fetches experts', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          hourly_rate: 100,
          rating: 4.5,
          total_reviews: 10,
          experience_years: 5,
          user: {
            full_name: 'Test Expert',
            avatar_url: '/avatar.png',
          },
          bio: 'Test bio',
          tags: 'IT, React',
        },
      ],
      total: 1,
    };

    (api.get as any).mockResolvedValue({ data: mockData });

    render(<ExpertExplorePage />);

    // Check if hero title is rendered
    expect(screen.getByText(/Kết quả chọn lọc/i)).toBeDefined();

    // Verify API call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('experts', expect.objectContaining({
        params: expect.objectContaining({
          page: 1,
          limit: 3,
        }),
      }));
    });

    // Check if expert card is rendered
    await waitFor(() => {
      expect(screen.getByText('Test Expert')).toBeDefined();
    });
  });

  it('handles empty results correctly', async () => {
    (api.get as any).mockResolvedValue({ data: { items: [], total: 0 } });

    render(<ExpertExplorePage />);

    await waitFor(() => {
      expect(screen.getByText(/Hiển thị 0 trong tổng số 0 nhân tài/i)).toBeDefined();
    });
  });

  it('updates when filters change', async () => {
    (api.get as any).mockResolvedValue({ data: { items: [], total: 0 } });

    const { rerender } = render(<ExpertExplorePage />);

    // This is a basic test to ensure the component doesn't crash on re-renders
    rerender(<ExpertExplorePage />);
    
    expect(api.get).toHaveBeenCalled();
  });
});
