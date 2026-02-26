import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

interface UsersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function UsersFilters({ search, onSearchChange }: UsersFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 w-full sm:max-w-sm">
        <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם או אימייל..."
          className="pr-9 w-full"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
