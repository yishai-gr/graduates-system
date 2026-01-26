import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { usersService } from "@/services/usersService";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserMobileCard } from "@/components/users/UserMobileCard";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconShieldLock,
  IconEye,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";

export default function UsersPage() {
  const { isSuperAdmin } = usePermissions();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
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
        pageSize: 10,
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
  }, [page, debouncedSearch, isSuperAdmin]);

  // Handlers
  const handleEdit = (user: User) => {
    navigate(`/users/${user.id}/edit`);
  };

  const handleView = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await usersService.deleteUser(userToDelete.id);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData();
    }
  };

  if (!isSuperAdmin) return null;

  const columns = [
    {
      header: "שם מלא",
      cell: (user: User) => (
        <div className="font-medium">
          {user.firstName} {user.lastName}
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
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {user.role === "super_admin" ? (
            <>
              <IconShieldLock className="ml-1 h-3 w-3" /> מנהל ראשי
            </>
          ) : (
            "אחראי שיעור"
          )}
        </span>
      ),
    },
    {
      header: "מחזורים",
      cell: (user: User) =>
        user.role === "shiur_manager" && user.shiurs?.length
          ? user.shiurs.join(", ")
          : "-",
    },
    {
      header: "פעולות",
      cell: (user: User) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleView(user)}>
            <IconEye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
            <IconPencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDeleteClick(user)}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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
        pageSize={10}
        onPageChange={setPage}
        isLoading={loading}
        mobileRenderer={(user) => (
          <UserMobileCard
            user={user}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDeleteClick}
            canEdit={true}
            canDelete={true}
          />
        )}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="מחיקת משתמש"
        description={`האם אתה בטוח שברצונך למחוק את המשתמש ${userToDelete?.firstName} ${userToDelete?.lastName}? פעולה זו אינה הפיכה.`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="מחק"
      />
    </div>
  );
}
