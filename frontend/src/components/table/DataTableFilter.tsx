import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  IconFilter,
  IconCheck,
  IconX,
  IconDatabaseOff,
  IconDatabaseImport,
} from "@tabler/icons-react";
import { type ColumnMeta } from "./columns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DataTableFilterProps {
  id: string;
  title: string;
  meta: ColumnMeta;
  filterValue?: string[];
  onFilterChange: (value?: string[]) => void;
}

export function DataTableFilter({
  title,
  meta,
  filterValue,
  onFilterChange,
}: DataTableFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!meta || !meta.filterVariant) {
    return null;
  }

  const isSelect = meta.filterVariant === "select";
  const defaultOptions = meta.filterOptions || [];

  const options = isSelect
    ? defaultOptions
    : defaultOptions.length > 0
      ? defaultOptions.map((o) => ({
          ...o,
          icon: o.value === "isEmpty" ? IconDatabaseOff : IconDatabaseImport,
        }))
      : [
          { label: "ריקים בלבד", value: "isEmpty", icon: IconDatabaseOff },
          {
            label: "מלאים בלבד",
            value: "isNotEmpty",
            icon: IconDatabaseImport,
          },
        ];

  const filteredOptions = isSelect
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : options;

  const selectedValues: string[] = filterValue ?? [];
  const isConfigured = selectedValues.length > 0;

  const handleToggle = (val: string) => {
    if (isSelect) {
      // multi-select: toggle in/out of array
      const next = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val];
      onFilterChange(next.length > 0 ? next : undefined);
    } else {
      // presence: single select, toggle off if same
      const next = selectedValues.includes(val) ? [] : [val];
      onFilterChange(next.length > 0 ? next : undefined);
    }
  };

  const clearFilter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onFilterChange(undefined);
  };

  const badgeLabel = () => {
    if (!isConfigured) return null;
    if (selectedValues.length === 1) {
      return (
        options.find((o) => o.value === selectedValues[0])?.label ||
        selectedValues[0]
      );
    }
    return `${selectedValues.length} נבחרו`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed flex gap-2 w-full md:w-auto mt-2 md:mt-0"
        >
          <IconFilter className="h-4 w-4" />
          {title}
          {isConfigured && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal flex gap-1 items-center"
              >
                {badgeLabel()}
                <IconX
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={clearFilter}
                />
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="flex flex-col text-sm">
          <div className="py-2 px-3 font-semibold text-muted-foreground border-b bg-muted/30">
            בחר סינון ל{title}
          </div>
          {isSelect && options.length > 5 && (
            <div className="bg-muted/10 p-2 border-b">
              <Input
                className="h-8 shadow-none"
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          <div className="overflow-y-auto max-h-[250px]">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground opacity-50 text-xs">
                לא נמצאו תוצאות
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const Icon = (option as any).icon;
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => handleToggle(option.value)}
                  >
                    <div
                      className={cn(
                        "ml-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <IconCheck className="h-4 w-4" />
                    </div>
                    {Icon && (
                      <Icon className="mr-2 ml-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {isConfigured && (
          <div className="p-1 border-t">
            <Button
              variant="ghost"
              className="w-full justify-center font-normal px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={clearFilter}
            >
              נקה סינון
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
