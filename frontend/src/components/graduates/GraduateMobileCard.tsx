import { useRef } from "react";
import type { Graduate } from "@shared/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
  IconSchool,
  IconPhone,
  IconMapPin,
} from "@tabler/icons-react";
import { ProfileCompletion } from "./ProfileCompletion";
import { motion } from "framer-motion";
import type { PanInfo } from "framer-motion";

interface GraduateMobileCardProps {
  graduate: Graduate;
  onEdit: (graduate: Graduate) => void;
  onView: (graduate: Graduate) => void;
  onDelete?: (graduate: Graduate) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function GraduateMobileCard({
  graduate,
  onEdit,
  onView,
  onDelete,
  canEdit,
  canDelete,
}: GraduateMobileCardProps) {
  /* Double-tap logic */
  const lastTap = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onView(graduate);
    }
    lastTap.current = now;
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Swipe left (negative x) -> Edit
    if (info.offset.x < -200 && canEdit) {
      onEdit(graduate);
    }
    // Swipe right (positive x) -> Delete
    if (info.offset.x > 200 && canDelete && onDelete) {
      onDelete(graduate);
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

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: canEdit ? 0.2 : 0, right: canDelete ? 0.2 : 0 }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="touch-pan-y relative z-10 bg-card rounded-lg" // z-10 to sit above background
        whileTap={{ scale: 0.98 }}
        style={{ x: 0 }} // Ensure it starts at 0
      >
        <Card className="px-4 py-2 flex-row justify-between items-center select-none border-0 shadow-none">
          {/* border-0 shadow-none because parent motion.div or container should handle border/shadow if we want the background to look "internal" 
              OR we keep Card style and background is strictly behind.
              If Card is opaque (bg-card), it covers the background.
              We need to ensure Card background is set.
              Shadcn Card has bg-card.
          */}
          <div className="flex flex-col gap-1 pointer-events-none w-full overflow-hidden">
            <div className="font-bold text-base truncate">
              {graduate.first_name} {graduate.last_name}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground w-full">
              {graduate.shiur_year && (
                <div className="flex items-center gap-1 shrink-0">
                  <IconSchool size={12} />
                  <span>{graduate.shiur_year}</span>
                </div>
              )}
              {graduate.city && (
                <div className="flex items-center gap-1 shrink-0 truncate max-w-[80px]">
                  <IconMapPin size={12} />
                  <span className="truncate">{graduate.city}</span>
                </div>
              )}
              {graduate.phone && (
                <div className="flex items-center gap-1 shrink-0">
                  <IconPhone size={12} />
                  <span dir="ltr">{graduate.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProfileCompletion graduate={graduate} />
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
                  onClick={() => onView(graduate)}
                  className="flex flex-col items-center justify-center gap-1 rounded-md bg-secondary/10 p-2 aspect-square focus:bg-secondary/20"
                >
                  <IconEye className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">צפייה</span>
                </DropdownMenuItem>

                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(graduate)}
                    className="flex flex-col items-center justify-center gap-1 rounded-md bg-orange-50 dark:bg-orange-900/20 p-2 aspect-square focus:bg-orange-100 dark:focus:bg-orange-900/40"
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
                    onClick={() => onDelete(graduate)}
                  >
                    <IconTrash className="h-6 w-6" />
                    <span className="text-xs font-medium">מחיקה</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
