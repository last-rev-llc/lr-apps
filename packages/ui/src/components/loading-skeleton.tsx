import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const loadingSkeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    shape: {
      line: "h-4 w-full rounded",
      circle: "rounded-full",
      rect: "rounded-md",
      card: "rounded-xl",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
      full: "w-full",
    },
  },
  compoundVariants: [
    { shape: "circle", size: "sm", className: "h-8 w-8" },
    { shape: "circle", size: "md", className: "h-12 w-12" },
    { shape: "circle", size: "lg", className: "h-16 w-16" },
    { shape: "circle", size: "full", className: "h-24 w-24" },
    { shape: "rect", size: "sm", className: "h-16 w-full" },
    { shape: "rect", size: "md", className: "h-24 w-full" },
    { shape: "rect", size: "lg", className: "h-40 w-full" },
    { shape: "line", size: "sm", className: "h-3 w-3/4" },
    { shape: "line", size: "md", className: "h-4 w-full" },
    { shape: "line", size: "lg", className: "h-5 w-full" },
  ],
  defaultVariants: {
    shape: "line",
    size: "md",
  },
});

export interface LoadingSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSkeletonVariants> {
  width?: string | number;
  height?: string | number;
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, shape, size, width, height, style, ...props }, ref) => {
    if (shape === "card") {
      return (
        <div
          ref={ref}
          className={cn("animate-pulse rounded-xl border bg-card p-6 space-y-4", className)}
          style={{ width, height, ...style }}
          {...props}
        >
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-4/6 rounded bg-muted" />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(loadingSkeletonVariants({ shape, size }), className)}
        style={{ width, height, ...style }}
        {...props}
      />
    );
  },
);
LoadingSkeleton.displayName = "LoadingSkeleton";

export { LoadingSkeleton, loadingSkeletonVariants };
