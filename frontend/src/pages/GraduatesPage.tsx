import { useState, useCallback, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { graduatesService } from "@/services/graduatesService";
import type { TableQueryParams } from "@/services/usersService";
import type { Graduate } from "@shared/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GraduatesImportDialog } from "@/components/graduates/GraduatesImportDialog";
import { GraduatesHeader } from "@/components/graduates/GraduatesHeader";
import { useNavigate, Navigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "@/components/table/DataTable";
import { DataTableToolbar } from "@/components/table/DataTableToolbar";
import { DataTablePagination } from "@/components/table/DataTablePagination";
import { MobileCardsView } from "@/components/table/MobileCardsView";
import { GraduateMobileCard } from "@/components/graduates/GraduateMobileCard";
import { getGraduatesColumns } from "@/components/graduates/graduatesColumns";

export default function GraduatesPage() {
  const { can, user, isShiurManager } = usePermissions();
  const navigate = useNavigate();
  useDocumentTitle("ניהול בוגרים");
  const queryClient = useQueryClient();

  const [tableState, setTableState] = useState<TableQueryParams>({
    pageIndex: 0,
    pageSize: 20,
    sorting: [],
    globalFilter: "",
    filters: [],
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Filters excluding own column – for faceted counts
  const filtersExcludingYear = (tableState.filters ?? []).filter(
    (f) => f.id !== "shiur_year",
  );
  const filtersExcludingCity = (tableState.filters ?? []).filter(
    (f) => f.id !== "city",
  );

  const { data: yearsData } = useQuery({
    queryKey: [
      "graduate-years",
      filtersExcludingYear,
      tableState.globalFilter,
      refreshKey,
    ],
    queryFn: () =>
      graduatesService.getGraduateYears({
        filters: filtersExcludingYear,
        globalFilter: tableState.globalFilter,
      }),
    placeholderData: (prev) => prev,
  });
  const availableYears = yearsData ?? [];

  const { data: citiesData } = useQuery({
    queryKey: [
      "graduate-cities",
      filtersExcludingCity,
      tableState.globalFilter,
      refreshKey,
    ],
    queryFn: () =>
      graduatesService.getGraduateCities({
        filters: filtersExcludingCity,
        globalFilter: tableState.globalFilter,
      }),
    placeholderData: (prev) => prev,
  });
  const availableCities = citiesData ?? [];

  const [graduateToDelete, setGraduateToDelete] = useState<Graduate | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Field counts for presence-type filters (faceted – each column's query excludes its own filter)
  const { data: fieldCountsData } = useQuery({
    queryKey: [
      "graduate-field-counts",
      tableState.filters,
      tableState.globalFilter,
      refreshKey,
    ],
    queryFn: () =>
      graduatesService.getGraduateFieldCounts({
        filters: tableState.filters,
        globalFilter: tableState.globalFilter,
      }),
    placeholderData: (prev) => prev,
  });
  const fieldCounts = fieldCountsData ?? {};

  // Fetch data
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      "graduates",
      tableState,
      refreshKey,
      isShiurManager ? user?.shiurs : undefined,
    ],
    queryFn: () => graduatesService.getGraduates(tableState),
    placeholderData: (prev) => prev,
  });

  const graduates = (data?.data as Graduate[]) ?? [];
  const total = data?.total ?? 0;
  const pages =
    ((data as any)?.pages ?? Math.ceil(total / (tableState.pageSize || 20))) ||
    1;

  // Handlers
  const handleEdit = useCallback(
    (graduate: Graduate) => {
      navigate(`/graduates/${graduate.id}/edit`);
    },
    [navigate],
  );

  const handleAdd = useCallback(() => {
    navigate("/graduates/new");
  }, [navigate]);

  const handleView = useCallback(
    (graduate: Graduate) => {
      navigate(`/graduates/${graduate.id}`);
    },
    [navigate],
  );

  const handleDeleteClick = useCallback((graduate: Graduate) => {
    setGraduateToDelete(graduate);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (graduateToDelete) {
      await graduatesService.deleteGraduate(graduateToDelete.id);
      setIsDeleteDialogOpen(false);
      setGraduateToDelete(null);
      setRefreshKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ["graduates"] });
    }
  }, [graduateToDelete, queryClient]);

  const columns = useMemo(
    () =>
      getGraduatesColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
        can,
        availableYears,
        availableCities,
        fieldCounts,
      }),
    [
      handleView,
      handleEdit,
      handleDeleteClick,
      can,
      availableYears,
      availableCities,
      fieldCounts,
    ],
  );

  if (!can("read", "graduates")) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="space-y-6">
      <GraduatesHeader
        canCreate={can("create", "graduates")}
        canImport={can("import", "graduates")}
        onAdd={handleAdd}
        onImport={() => setIsImportDialogOpen(true)}
      />

      <div className="bg-card rounded-lg border shadow-sm p-4 text-card-foreground flex flex-col">
        <DataTableToolbar
          columns={columns}
          state={tableState}
          onStateChange={setTableState}
        />

        <div className="overflow-x-auto rounded-md border">
          <DataTable
            columns={columns}
            data={graduates}
            pageCount={pages}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            state={tableState}
            onStateChange={setTableState}
          />
          <MobileCardsView
            data={graduates}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            renderCard={(g: Graduate) => (
              <GraduateMobileCard
                key={g.id}
                graduate={g}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={
                  can("delete", "graduates") ? handleDeleteClick : undefined
                }
                canEdit={can("update", "graduates", g)}
                canDelete={can("delete", "graduates")}
              />
            )}
          />
        </div>

        <div className="mt-4 border-t pt-2">
          <DataTablePagination
            state={tableState}
            onStateChange={setTableState}
            totalItems={total}
            pageCount={pages}
          />
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setGraduateToDelete(null);
        }}
        title="מחיקת בוגר"
        description={
          <>
            האם אתה בטוח שברצונך למחוק את הבוגר{" "}
            <strong>
              {graduateToDelete?.first_name} {graduateToDelete?.last_name}
            </strong>
            ? פעולה זו אינה הפיכה.
          </>
        }
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="מחק"
      />

      <GraduatesImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={() => {
          setRefreshKey((k) => k + 1);
          queryClient.invalidateQueries({ queryKey: ["graduates"] });
        }}
      />
    </div>
  );
}
