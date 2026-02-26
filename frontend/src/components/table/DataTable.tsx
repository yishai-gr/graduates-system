import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type TableQueryParams } from "@/services/usersService";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  state: TableQueryParams;
  onStateChange: (updater: (old: TableQueryParams) => TableQueryParams) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  isLoading = false,
  isFetching = false,
  isError = false,
  state,
  onStateChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data: data ?? [],
    columns,
    pageCount: pageCount,
    state: {
      pagination: {
        pageIndex: state.pageIndex ?? 0,
        pageSize: state.pageSize ?? 10,
      },
      sorting: state.sorting ?? [],
      globalFilter: state.globalFilter,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: (updaterOrValue) => {
      onStateChange((old) => {
        const newPagination =
          typeof updaterOrValue === "function"
            ? updaterOrValue({
                pageIndex: old.pageIndex ?? 0,
                pageSize: old.pageSize ?? 10,
              })
            : updaterOrValue;
        return {
          ...old,
          pageIndex: newPagination.pageIndex,
          pageSize: newPagination.pageSize,
        };
      });
    },
    onSortingChange: (updaterOrValue) => {
      onStateChange((old) => {
        const newSorting =
          typeof updaterOrValue === "function"
            ? updaterOrValue(old.sorting ?? [])
            : updaterOrValue;
        return { ...old, sorting: newSorting };
      });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="relative hidden md:block rounded-md border bg-card">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/50 backdrop-blur-[1px]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                טוען נתונים...
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-destructive"
              >
                שגיאה בשליפת הנתונים. נסה שוב.
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                לא נמצאו רשומות.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
