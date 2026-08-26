import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(this.state.error, this.handleReset);
        }
        return fallback;
      }

      return (
        <div className="flex items-center justify-center p-8 min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="inline-flex p-3 rounded-lg bg-error/10 text-error mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-headline-md font-semibold text-on-surface mb-2">
              Something went wrong
            </h3>
            <p className="text-body-md text-on-surface-variant mb-4">
              An unexpected error occurred while rendering this section. Try reloading the page,
              or navigate back to continue.
            </p>
            {this.state.error?.message && (
              <pre className="text-left text-body-sm font-mono text-error bg-error/5 border border-error/20 rounded p-3 mb-4 overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded border border-outline text-body-md font-medium hover:bg-surface-container-low transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded bg-primary text-white text-body-md font-medium hover:bg-primary-container transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
