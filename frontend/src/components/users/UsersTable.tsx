import { useMemo } from "react";
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
  IconPencil,
  IconTrash,
  IconShieldLock,
  IconEye,
  IconDotsVertical,
  IconKey,
  IconUserEdit,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { UserMobileCard } from "@/components/users/UserMobileCard";

interface UsersTableProps {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangePassword: (user: User) => void;
}

export function UsersTable({
  users,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onChangePassword,
}: UsersTableProps) {
  const mobileRenderer = (user: User) => (
    <UserMobileCard
      user={user}
      onEdit={onEdit}
      onView={onView}
      onDelete={onDelete}
      onChangePassword={onChangePassword}
      canEdit={true}
      canDelete={true}
    />
  );

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
                    onClick={() => onView(user)}
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
                    onClick={() => onChangePassword(user)}
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
                    onClick={() => onEdit(user)}
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
                    onClick={() => onDelete(user)}
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
                  <DropdownMenuItem onClick={() => onView(user)}>
                    <IconEye className="mr-2 h-4 w-4" /> צפייה
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onChangePassword(user)}
                    className={
                      user.passwordChanged
                        ? "text-destructive focus:text-destructive"
                        : "text-accent focus:text-accent"
                    }
                  >
                    <IconKey className="mr-2 h-4 w-4" />{" "}
                    {!user.passwordChanged ? "הגדרת" : "שינוי"} סיסמה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <IconPencil className="mr-2 h-4 w-4" /> עריכה
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onDelete(user)}
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
    [onView, onEdit, onDelete, onChangePassword],
  );

  return (
    <DataTable
      data={users}
      columns={columns}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      isLoading={loading}
      mobileRenderer={mobileRenderer}
      totalLabel="משתמשים"
    />
  );
}
