import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /** The size of the spinner: "sm" (16px), "md" (24px), "lg" (32px) */
  size?: "sm" | "md" | "lg";
  /** Whether to show the spinner in a centered card layout */
  fullPage?: boolean;
  /** Optional text to display below the spinner */
  text?: string;
  /** Optional className to override styles */
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  fullPage = false,
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-b-2 border-primary",
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
}
