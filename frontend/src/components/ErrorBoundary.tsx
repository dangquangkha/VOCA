'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches unhandled React errors and shows a graceful error page
 * instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to error tracking service (e.g., Sentry)
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-8">
          <div className="max-w-lg w-full text-center space-y-12">
            {/* Section label */}
            <div className="flex items-center justify-center gap-6">
              <div className="w-12 h-[1.5px] bg-[#0046EA]" />
              <span className="text-[10px] font-black text-[#0046EA] uppercase tracking-[0.5em]">
                Lỗi Hệ Thống
              </span>
              <div className="w-12 h-[1.5px] bg-[#0046EA]" />
            </div>

            {/* Error code */}
            <div className="text-[120px] font-serif italic font-bold text-[#0046EA]/10 leading-none select-none">
              500
            </div>

            {/* Message */}
            <div className="space-y-6">
              <h1 className="text-4xl font-serif italic font-bold text-[#171716]">
                Có lỗi xảy ra.
              </h1>
              <p className="text-[16px] text-black/50 leading-relaxed font-sans">
                Chúng tôi xin lỗi vì sự bất tiện này. Vui lòng thử tải lại trang hoặc quay lại trang chủ.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="text-left text-[11px] bg-gray-50 border border-gray-200 p-4 text-red-600 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => window.location.reload()}
                className="px-10 py-4 bg-[#0046EA] text-white text-[10px] font-black tracking-[0.5em] uppercase hover:bg-[#00A4FD] transition-colors duration-500"
              >
                Tải lại trang
              </button>
              <a
                href="/"
                className="px-10 py-4 border border-[#0046EA]/30 text-[#0046EA] text-[10px] font-black tracking-[0.5em] uppercase hover:border-[#0046EA] transition-colors duration-500"
              >
                Trang chủ
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
