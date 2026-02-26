import { type ColumnDef } from "@tanstack/react-table";
import type { User } from "@shared/types";
import { type ColumnMeta } from "@/components/table/columns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  IconPencil,
  IconTrash,
  IconShieldLock,
  IconEye,
  IconKey,
  IconUserEdit,
} from "@tabler/icons-react";

export interface UsersColumnsHandlers {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangePassword: (user: User) => void;
}

export function getUsersColumns({
  onView,
  onEdit,
  onDelete,
  onChangePassword,
}: UsersColumnsHandlers): ColumnDef<User, any>[] {
  return [
    {
      accessorKey: "fullName",
      header: "שם מלא",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="font-medium flex items-center gap-2">
            {user.firstName} {user.lastName}
            {!user.passwordChanged && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>למשתמש זה לא הוגדרה סיסמה</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      meta: {
        filterVariant: "text",
      } as ColumnMeta,
    },
    {
      accessorKey: "email",
      header: "אימייל",
      meta: {
        filterVariant: "text",
      } as ColumnMeta,
    },
    {
      accessorKey: "role",
      header: "תפקיד",
      cell: ({ row }) => {
        const user = row.original;
        return (
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
        );
      },
      meta: {
        filterVariant: "select",
        filterOptions: [
          { label: "מנהל ראשי", value: "super_admin" },
          { label: "אחראי שיעור", value: "shiur_manager" },
        ],
      } as ColumnMeta,
    },
    {
      accessorKey: "shiurs",
      header: "מחזורים",
      cell: ({ row }) => {
        const user = row.original;
        return user.role === "shiur_manager" &&
          Array.isArray(user.shiurs) &&
          user.shiurs.length > 0
          ? user.shiurs.join(", ")
          : "-";
      },
      meta: {
        filterVariant: "presence",
      } as ColumnMeta,
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-2">
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
        );
      },
    },
  ];
}
