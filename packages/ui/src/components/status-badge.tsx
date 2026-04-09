import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400",
        error:
          "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400",
        neutral:
          "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:border-zinc-400/20 dark:bg-zinc-400/10 dark:text-zinc-400",
        pending:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 animate-pulse dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-400",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

const dotColorMap: Record<string, string> = {
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  error: "bg-red-500 dark:bg-red-400",
  info: "bg-blue-500 dark:bg-blue-400",
  neutral: "bg-zinc-500 dark:bg-zinc-400",
  pending: "bg-yellow-500 dark:bg-yellow-400",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColorMap[variant ?? "neutral"])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  ),
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
