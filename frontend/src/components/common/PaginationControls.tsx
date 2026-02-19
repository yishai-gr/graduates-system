import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  totalLabel?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  totalLabel = "רשומות",
}: PaginationControlsProps) {
  // Helper to generate page numbers with ellipsis (Desktop only)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:justify-between py-2">
      {/* Top Row (Mobile) / Right Side (Desktop): Page Size Selector */}
      <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap sm:hidden">
            הצג:
          </span>
          <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
            שורות בעמוד:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="h-9 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Total Count (Left on Top Row - Mobile Only) */}
        <div className="text-sm text-muted-foreground font-medium sm:hidden">
          {total} {totalLabel}
        </div>
      </div>

      {/* Bottom Row (Mobile) / Left Side (Desktop): Nav & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
        {/* Desktop Total Info - To the Right of Navigation */}
        <div className="hidden sm:block text-sm text-muted-foreground ml-auto pl-4">
          {totalPages > 1
            ? `עמוד ${currentPage} מתוך ${totalPages} (${total} ${totalLabel})`
            : `${total} ${totalLabel}`}
        </div>

        {/* Navigation Controls (Hidden if only 1 page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between w-full sm:w-auto bg-muted/30 p-1 rounded-lg sm:bg-transparent sm:p-0 sm:gap-1">
            {/* Previous Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="h-10 w-10 sm:h-8 sm:w-8 sm:border sm:border-input"
            >
              <IconChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="sr-only">הקודם</span>
            </Button>

            {/* Mobile: Current Page Text */}
            <span className="text-sm font-medium sm:hidden">
              עמוד {currentPage} מתוך {totalPages}
            </span>

            {/* Desktop: Number Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={`page-${page}`}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="h-10 w-10 sm:h-8 sm:w-8 sm:border sm:border-input"
            >
              <IconChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="sr-only">הבא</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
