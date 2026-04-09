"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((props: { error: Error; reset: () => void }) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center",
            this.props.className,
          )}
        >
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
