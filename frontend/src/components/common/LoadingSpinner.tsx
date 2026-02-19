import { IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  text = "טוען נתונים...",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-3 text-foreground animate-in fade-in-50",
        className,
      )}
    >
      <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse">{text}</p>
    </div>
  );
}
