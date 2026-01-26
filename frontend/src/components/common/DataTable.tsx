import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NoResults } from "@/components/common/NoResults";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  mobileRenderer?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading,
  mobileRenderer,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      {mobileRenderer && (
        <div className="grid gap-4 md:hidden">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              טוען נתונים...
            </div>
          ) : data.length === 0 ? (
            <NoResults />
          ) : (
            data.map((item) => <div key={item.id}>{mobileRenderer(item)}</div>)
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div
        className={`rounded-md border ${mobileRenderer ? "hidden md:block" : ""}`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className="text-right">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  טוען נתונים...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
                  <NoResults />
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col, index) => (
                    <TableCell key={index}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                          ? (item[col.accessorKey] as React.ReactNode)
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 space-x-reverse">
          <div className="text-sm text-muted-foreground ml-auto pl-2">
            עמוד {page} מתוך {totalPages} ({total} רשומות)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            <IconChevronRight className="h-4 w-4" />
            הקודם
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            הבא
            <IconChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
