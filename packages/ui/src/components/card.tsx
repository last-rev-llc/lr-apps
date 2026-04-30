import * as React from "react";
import { cn } from "../lib/utils";

type CardSize = "default" | "compact";

const CardSizeContext = React.createContext<CardSize>("default");

type CardProps = React.HTMLAttributes<HTMLDivElement> & { size?: CardSize };

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, size = "default", ...props }, ref) => (
    <CardSizeContext.Provider value={size}>
      <div
        ref={ref}
        data-size={size}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow",
          size === "compact" && "rounded-lg text-sm",
          className,
        )}
        {...props}
      />
    </CardSizeContext.Provider>
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const size = React.useContext(CardSizeContext);
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5",
          size === "compact" ? "p-3" : "p-6",
          className,
        )}
        {...props}
      />
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const size = React.useContext(CardSizeContext);
    return (
      <div
        ref={ref}
        className={cn(size === "compact" ? "p-3 pt-0" : "p-6 pt-0", className)}
        {...props}
      />
    );
  },
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const size = React.useContext(CardSizeContext);
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          size === "compact" ? "p-3 pt-0" : "p-6 pt-0",
          className,
        )}
        {...props}
      />
    );
  },
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
