import { useState, useCallback, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usersService, type TableQueryParams } from "@/services/usersService";
import type { User } from "@shared/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UsersHeader } from "@/components/users/UsersHeader";
import { useNavigate, Navigate } from "react-router";
import { useTableData } from "@/hooks/useTableData";
import { useQueryClient } from "@tanstack/react-query";

import { DataTable } from "@/components/table/DataTable";
import { DataTableToolbar } from "@/components/table/DataTableToolbar";
import { DataTablePagination } from "@/components/table/DataTablePagination";
import { MobileCardsView } from "@/components/table/MobileCardsView";
import { UserMobileCard } from "@/components/users/UserMobileCard";
import { getUsersColumns } from "@/components/users/usersColumns";

export default function UsersPage() {
  const { isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  useDocumentTitle("ניהול משתמשים");
  const queryClient = useQueryClient();

  const [tableState, setTableState] = useState<TableQueryParams>({
    pageIndex: 0,
    pageSize: 10,
    sorting: [],
    globalFilter: "",
    filters: [],
  });

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch data
  const { data, isLoading, isFetching, isError } = useTableData(tableState);
  const users = (data?.data as User[]) ?? [];
  const total = data?.total ?? 0;
  const pages = (data as any)?.pages ?? 1;

  // Handlers
  const handleEdit = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}/edit`);
    },
    [navigate],
  );

  const handleAdd = useCallback(() => {
    navigate("/users/new");
  }, [navigate]);

  const handleView = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}`);
    },
    [navigate],
  );

  const handleChangePassword = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}/password`);
    },
    [navigate],
  );

  const handleDeleteClick = useCallback((user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (userToDelete) {
      await usersService.deleteUser(userToDelete.id);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      // Invalidate React Query to refresh the table
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  }, [userToDelete, queryClient]);

  const columns = useMemo(
    () =>
      getUsersColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
        onChangePassword: handleChangePassword,
      }),
    [handleView, handleEdit, handleDeleteClick, handleChangePassword],
  );

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="space-y-6">
      <UsersHeader onAdd={handleAdd} />

      <div className="bg-card rounded-lg border shadow-sm p-4 text-card-foreground flex flex-col">
        <DataTableToolbar
          columns={columns}
          state={tableState}
          onStateChange={setTableState}
        />

        <div className="overflow-x-auto rounded-md border">
          <DataTable
            columns={columns}
            data={users}
            pageCount={pages}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            state={tableState}
            onStateChange={setTableState}
          />
          <MobileCardsView
            data={users}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            renderCard={(user: User) => (
              <UserMobileCard
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDeleteClick}
                onChangePassword={handleChangePassword}
                canEdit={true}
                canDelete={true}
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
          if (!open) setUserToDelete(null);
        }}
        title="מחיקת משתמש"
        description={
          <>
            האם אתה בטוח שברצונך למחוק את המשתמש{" "}
            <strong>
              {userToDelete?.firstName} {userToDelete?.lastName}
            </strong>
            ? פעולה זו אינה הפיכה.
          </>
        }
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="מחק"
      />
    </div>
  );
}
