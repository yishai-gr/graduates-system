import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";
import {
  type TableQueryParams,
  type ColumnFilter,
} from "@/services/usersService";
import { useState, useEffect } from "react";
import { type ColumnMeta } from "./columns";
import { DataTableFilter } from "./DataTableFilter";
import { type ColumnDef } from "@tanstack/react-table";

interface DataTableToolbarProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  state: TableQueryParams;
  onStateChange: (updater: (old: TableQueryParams) => TableQueryParams) => void;
}

export function DataTableToolbar<TData, TValue>({
  columns,
  state,
  onStateChange,
}: DataTableToolbarProps<TData, TValue>) {
  const [searchValue, setSearchValue] = useState(state.globalFilter || "");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onStateChange((old) => {
        if (old.globalFilter === searchValue) return old;
        return {
          ...old,
          globalFilter: searchValue,
          pageIndex: 0, // Reset page when searching
        };
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onStateChange]);

  const handleReset = () => {
    setSearchValue("");
    onStateChange((old) => ({
      ...old,
      globalFilter: "",
      pageIndex: 0,
      filters: undefined,
    }));
  };
  const handleFilterChange = (id: string, value?: string[]) => {
    onStateChange((old) => {
      const currentFilters = old.filters || [];
      const filterExists = currentFilters.some((f) => f.id === id);

      let newFilters: ColumnFilter[];

      if (value === undefined || value.length === 0) {
        // Remove filter
        newFilters = currentFilters.filter((f) => f.id !== id);
      } else if (filterExists) {
        // Update filter
        newFilters = currentFilters.map((f) =>
          f.id === id ? { ...f, value } : f,
        );
      } else {
        // Add new filter
        newFilters = [...currentFilters, { id, value }];
      }

      return {
        ...old,
        filters: newFilters.length > 0 ? newFilters : undefined,
        pageIndex: 0,
      };
    });
  };

  const activeFiltersCount = state.filters?.length || 0;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4 md:gap-2">
      <div className="flex items-center justify-between gap-2 w-full md:w-auto">
        <div className="relative w-full md:max-w-sm text-right">
          <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש חופשי..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full pl-8 pr-10" // padding right for the icon in RTL
          />
          {searchValue && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="absolute left-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            >
              <IconX className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">נקה חיפוש</span>
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden relative shrink-0"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          aria-label="הצג סינונים"
        >
          <IconFilter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground border-2 border-background">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      <div
        className={`flex-1 flex-wrap items-center gap-2 rtl:space-x-reverse ${
          isMobileFiltersOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Dynamic Column Filters */}
        {columns.map((col: any) => {
          const meta = col.meta as ColumnMeta;
          if (!meta || !meta.filterVariant) return null;

          const activeFilter = state.filters?.find(
            (f) => f.id === col.accessorKey,
          );
          const activeValue: string[] | undefined = activeFilter
            ? Array.isArray(activeFilter.value)
              ? activeFilter.value
              : [activeFilter.value]
            : undefined;

          return (
            <DataTableFilter
              key={col.accessorKey}
              id={col.accessorKey}
              title={col.header as string}
              meta={meta}
              filterValue={activeValue}
              onFilterChange={(val) => handleFilterChange(col.accessorKey, val)}
            />
          );
        })}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={() =>
              onStateChange((old) => ({
                ...old,
                filters: undefined,
                pageIndex: 0,
              }))
            }
            className="h-8 px-2 lg:px-3 text-muted-foreground"
          >
            איפוס סינונים
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
