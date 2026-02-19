import { useEffect, useState, useCallback, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usersService } from "@/services/usersService";
import type { User } from "@shared/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconShieldLock,
  IconEye,
  IconDotsVertical,
  IconKey,
  IconUserEdit,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserMobileCard } from "@/components/users/UserMobileCard";
import { useNavigate } from "react-router";
export default function UsersPage() {
  const { isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  useDocumentTitle("ניהול משתמשים");

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Dialogs
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/unauthorized");
    }
  }, [isSuperAdmin, navigate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await usersService.getUsers({
        page,
        pageSize,
        search: debouncedSearch,
      });
      setUsers(response.data);
      setTotal(response.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [page, pageSize, debouncedSearch, isSuperAdmin]);

  // Handlers
  const handleEdit = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}/edit`);
    },
    [navigate],
  );

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
      fetchData();
    }
  }, [userToDelete]); // Note: fetchData needs to be stable or in dep array.

  const mobileRenderer = useCallback(
    (user: User) => (
      <UserMobileCard
        user={user}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDeleteClick}
        onChangePassword={handleChangePassword}
        canEdit={true}
        canDelete={true}
      />
    ),
    [handleEdit, handleView, handleDeleteClick, handleChangePassword],
  );

  if (!isSuperAdmin) return null;

  const columns = useMemo(
    () => [
      {
        header: "שם מלא",
        cell: (user: User) => (
          <div className="font-medium flex items-center gap-2">
            {user.firstName} {user.lastName}
            {!user.passwordChanged && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>למשתמש זה לא הוגדרה סיסמה</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        header: "אימייל",
        accessorKey: "email" as keyof User,
      },
      {
        header: "תפקיד",
        cell: (user: User) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              user.role === "super_admin"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            }`}
          >
            {user.role === "super_admin" ? (
              <>
                <IconShieldLock className="ml-1 h-3 w-3" /> מנהל ראשי
              </>
            ) : (
              <>
                <IconUserEdit className="ml-1 h-3 w-3" /> אחראי שיעור
              </>
            )}
          </span>
        ),
      },
      {
        header: "מחזורים",
        cell: (user: User) =>
          user.role === "shiur_manager" &&
          Array.isArray(user.shiurs) &&
          user.shiurs.length > 0
            ? user.shiurs.join(", ")
            : "-",
      },
      {
        header: "פעולות",
        cell: (user: User) => (
          <>
            {/* Desktop View - Buttons with Tooltips */}
            <div className="hidden md:flex justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(user)}
                  >
                    <IconEye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>צפייה</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/users/${user.id}/password`)}
                    className={
                      user.passwordChanged
                        ? "text-destructive hover:text-destructive"
                        : "text-accent hover:text-accent"
                    }
                  >
                    <IconKey className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!user.passwordChanged ? "הגדרת" : "שינוי"} סיסמה</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(user)}
                  >
                    <IconPencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>עריכה</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(user)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>מחיקה</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Mobile View - Dropdown Menu */}
            <div className="flex md:hidden justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto">
                  <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleView(user)}>
                    <IconEye className="mr-2 h-4 w-4" /> צפייה
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(`/users/${user.id}/password`)}
                    className={
                      user.passwordChanged
                        ? "text-destructive focus:text-destructive"
                        : "text-accent focus:text-accent"
                    }
                  >
                    <IconKey className="mr-2 h-4 w-4" />{" "}
                    {!user.passwordChanged ? "הגדרת" : "שינוי"} סיסמה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                    <IconPencil className="mr-2 h-4 w-4" /> עריכה
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(user)}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="mr-2 h-4 w-4" /> מחיקה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ),
      },
    ],
    [handleView, handleEdit, handleDeleteClick, navigate],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          ניהול משתמשים
        </h1>
        <Button
          onClick={() => {
            navigate("/users/new");
          }}
          className="w-full sm:w-auto"
        >
          <IconPlus className="mr-2 h-4 w-4" />
          הוספת משתמש
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם או אימייל..."
            className="pr-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        isLoading={loading}
        mobileRenderer={mobileRenderer}
        totalLabel="משתמשים"
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
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
