"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Something went wrong</h2>
          <p className="text-red-600/80 dark:text-red-400/80 mb-6 max-w-md text-sm">
            {this.state.error?.message || "An unexpected error occurred rendering this component."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-red-700 border border-red-200 hover:bg-red-100 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
