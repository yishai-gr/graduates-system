import { useRef, memo } from "react";
import type { User } from "@shared/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  IconUserEdit,
  IconDotsVertical,
  IconEye,
  IconKey,
} from "@tabler/icons-react";
import { m } from "framer-motion";
import type { PanInfo } from "framer-motion";

interface UserMobileCardProps {
  user: User;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete?: (user: User) => void;
  canEdit: boolean;
  canDelete: boolean;
  onChangePassword?: (user: User) => void;
}

export const UserMobileCard = memo(function UserMobileCard({
  user,
  onEdit,
  onView,
  onDelete,
  canEdit,
  canDelete,
  onChangePassword,
}: UserMobileCardProps) {
  /* Double-tap logic */
  const lastTap = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onView(user);
    }
    lastTap.current = now;
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Swipe left (negative x) -> Edit
    if (info.offset.x < -100 && canEdit) {
      onEdit(user);
    }
    // Swipe right (positive x) -> Delete
    if (info.offset.x > 100 && canDelete && onDelete) {
      onDelete(user);
    }
  };

  return (
    <div className="relative">
      {/* Background Action Layers */}
      {canEdit && (
        <div className="absolute inset-0 flex items-center justify-start rounded-lg bg-orange-100 pl-4 z-0 left-1/2 dark:bg-yellow-950">
          <div className="flex flex-col items-center gap-1 text-orange-600 font-bold px-2 text-sm dark:text-yellow-400">
            <IconPencil size={16} />
            <span>עריכה</span>
          </div>
        </div>
      )}

      {canDelete && (
        <div className="absolute inset-0 flex items-center justify-end rounded-lg bg-red-100 pr-4 z-0 right-1/2 dark:bg-red-950">
          <div className="flex flex-col items-center gap-1 text-red-600 font-bold px-2 text-sm dark:text-red-400">
            <IconTrash size={16} />
            <span>מחיקה</span>
          </div>
        </div>
      )}

      <m.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: canEdit ? 0.2 : 0, right: canDelete ? 0.2 : 0 }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="touch-pan-y relative z-10 bg-card rounded-lg"
        style={{ x: 0 }}
      >
        <Card className="p-0 border-0 shadow-none">
          <CardHeader className="p-4 py-3">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg flex items-center gap-2 truncate">
                  <span className="truncate">
                    {user.firstName} {user.lastName}
                  </span>
                  {!user.passwordChanged && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>למשתמש זה לא הוגדרה סיסמה</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  {user.role === "shiur_manager" && (
                    <div className="text-sm truncate">
                      <span className="font-semibold">מחזורים: </span>
                      {Array.isArray(user.shiurs) && user.shiurs.length > 0
                        ? user.shiurs.join(", ")
                        : "-"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium gap-1 whitespace-nowrap ${
                    user.role === "super_admin"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                >
                  {user.role === "super_admin" ? (
                    <>
                      <IconShieldLock className="h-3 w-3" /> מנהל
                    </>
                  ) : (
                    <>
                      <IconUserEdit className="h-3 w-3" /> אחראי
                    </>
                  )}
                </span>

                {/* Stop propagation to prevent drag/tap on menu interaction */}
                <div
                  role="none"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-auto flex flex-row gap-2 p-2"
                    >
                      <DropdownMenuItem
                        onClick={() => onView(user)}
                        className="flex flex-col items-center justify-center gap-1 rounded-md bg-secondary/10 p-2 aspect-square focus:bg-secondary/20"
                      >
                        <IconEye className="h-6 w-6 text-primary" />
                        <span className="text-xs font-medium">צפייה</span>
                      </DropdownMenuItem>

                      {onChangePassword && (
                        <DropdownMenuItem
                          onClick={() => onChangePassword(user)}
                          className="relative flex flex-col items-center justify-center gap-1 rounded-md bg-blue-50 dark:bg-blue-900/20 p-2  aspect-square focus:bg-blue-100 dark:focus:bg-blue-900/40"
                        >
                          {!user.passwordChanged && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                          <IconKey className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            סיסמה
                          </span>
                        </DropdownMenuItem>
                      )}

                      {canEdit && (
                        <DropdownMenuItem
                          onClick={() => onEdit(user)}
                          className="flex flex-col items-center justify-center gap-1 rounded-md bg-orange-50 dark:bg-orange-900/20 p-2  aspect-square focus:bg-orange-100 dark:focus:bg-orange-900/40"
                        >
                          <IconPencil className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                            עריכה
                          </span>
                        </DropdownMenuItem>
                      )}

                      {canDelete && onDelete && (
                        <DropdownMenuItem
                          className="flex flex-col items-center justify-center gap-1 rounded-md bg-red-50 dark:bg-red-900/20 p-2 aspect-square focus:bg-red-100 dark:focus:bg-red-900/40 text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-300"
                          onClick={() => onDelete(user)}
                        >
                          <IconTrash className="h-6 w-6" />
                          <span className="text-xs font-medium">מחיקה</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </m.div>
    </div>
  );
});
