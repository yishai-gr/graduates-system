import { Input } from "@/components/ui/input";
import { HebrewYearCombobox } from "@/components/users/HebrewYearCombobox";
import { IconSearch } from "@tabler/icons-react";

interface GraduatesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  shiurYearFilter: string[];
  onYearFilterChange: (value: string[]) => void;
  availableYears: { shiur_year: string; count: number }[];
}

export function GraduatesFilters({
  search,
  onSearchChange,
  shiurYearFilter,
  onYearFilterChange,
  availableYears,
}: GraduatesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם..."
          className="pr-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-64">
        <HebrewYearCombobox
          value={
            Array.isArray(shiurYearFilter)
              ? shiurYearFilter
              : shiurYearFilter
                ? [shiurYearFilter]
                : []
          }
          onChange={(val) => onYearFilterChange(val as string[])}
          multiple={true}
          items={availableYears}
        />
      </div>
    </div>
  );
}
