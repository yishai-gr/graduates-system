import { Button } from "@/components/ui/button";
import {
  IconChevronRight,
  IconChevronLeft,
  IconChevronsRight,
  IconChevronsLeft,
} from "@tabler/icons-react";
import { type TableQueryParams } from "@/services/usersService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
  state: TableQueryParams;
  onStateChange: (updater: (old: TableQueryParams) => TableQueryParams) => void;
  totalItems: number;
  pageCount: number;
}

export function DataTablePagination({
  state,
  onStateChange,
  totalItems,
  pageCount: totalPages,
}: DataTablePaginationProps) {
  const currentPage = (state.pageIndex ?? 0) + 1;
  const pageSize = state.pageSize ?? 10;

  const handlePageChange = (newPageIndex: number) => {
    onStateChange((old) => ({ ...old, pageIndex: newPageIndex }));
  };

  const handlePageSizeChange = (newSize: string) => {
    onStateChange((old) => ({
      ...old,
      pageSize: Number(newSize),
      pageIndex: 0,
    }));
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
      <div className="flex-1 text-sm text-muted-foreground text-center sm:text-start">
        סה"כ <strong>{totalItems}</strong> רשומות
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="hidden sm:flex items-center gap-2">
          <p className="text-sm font-medium">שורות לעמוד</p>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          עמוד {currentPage} מתוך {totalPages}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex"
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">לעמוד הראשון</span>
            <IconChevronsRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => handlePageChange(currentPage - 2)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">לעמוד הקודם</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => handlePageChange(currentPage)}
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">לעמוד הבא</span>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">לעמוד האחרון</span>
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
