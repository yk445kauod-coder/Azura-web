/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service if needed
    if (typeof window !== "undefined" && "gtag" in window) {
      (window as any).gtag?.("event", "exception", {
        description: error.message,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left p-4 bg-muted rounded-xl text-xs overflow-auto">
                <summary className="font-semibold cursor-pointer mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for manual error handling
import { useCallback } from "react";

export function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      console.error("Handled error:", error.message);
      // Can be used to show toast notifications or log to monitoring
    } else {
      console.error("Unknown error:", error);
    }
  }, []);

  return handleError;
}