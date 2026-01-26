import { IconSearch } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface NoResultsProps {
  title?: string;
  description?: string;
  className?: string;
  icon?: React.ElementType;
}

export function NoResults({
  title = "לא נמצאו תוצאות",
  description = "נסה לשנות את הגדרות החיפוש או הסינון",
  className,
  icon: Icon = IconSearch,
}: NoResultsProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <div className="bg-muted/50 rounded-full p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}
