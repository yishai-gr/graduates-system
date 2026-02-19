import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoResults } from "@/components/common/NoResults";
import { PaginationControls } from "@/components/common/PaginationControls";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

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
  onPageSizeChange?: (newPageSize: number) => void;
  isLoading?: boolean;
  mobileRenderer?: (item: T) => React.ReactNode;
  totalLabel?: string;
}

function DataTableComponent<T extends { id: string | number }>({
  data,
  columns,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  mobileRenderer,
  totalLabel,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Top Pagination Controls */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
        totalLabel={totalLabel}
      />

      {/* Mobile Card View */}
      {mobileRenderer && (
        <div className="grid gap-4 md:hidden">
          {isLoading ? (
            <LoadingSpinner className="py-8" />
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
                  <LoadingSpinner />
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

      {/* Bottom Pagination Controls */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
        totalLabel={totalLabel}
      />
    </div>
  );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
