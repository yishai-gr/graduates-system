import { useMemo } from "react";
import type { Graduate } from "@shared/types";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { GraduateMobileCard } from "@/components/graduates/GraduateMobileCard";
import { ProfileCompletion } from "@/components/graduates/ProfileCompletion";
import {
  IconPencil,
  IconTrash,
  IconEye,
  IconDotsVertical,
} from "@tabler/icons-react";
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

interface GraduatesTableProps {
  graduates: Graduate[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (graduate: Graduate) => void;
  onEdit: (graduate: Graduate) => void;
  onDelete: (graduate: Graduate) => void;
}

export function GraduatesTable({
  graduates,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
}: GraduatesTableProps) {
  const { can } = usePermissions();

  const mobileRenderer = (graduate: Graduate) => (
    <GraduateMobileCard
      graduate={graduate}
      onEdit={onEdit}
      onView={onView}
      onDelete={can("delete", "graduates") ? onDelete : undefined}
      canEdit={can("update", "graduates", graduate)}
      canDelete={can("delete", "graduates")}
    />
  );

  const columns = useMemo(
    () => [
      {
        header: "שם מלא",
        cell: (g: Graduate) => (
          <div className="font-medium">
            {g.first_name} {g.last_name}
          </div>
        ),
      },
      {
        header: "פלאפון",
        accessorKey: "phone" as keyof Graduate,
      },
      {
        header: "עיר",
        accessorKey: "city" as keyof Graduate,
      },
      {
        header: "מחזור",
        accessorKey: "shiur_year" as keyof Graduate,
        cell: (g: Graduate) => g.shiur_year || "ללא מחזור",
      },
      {
        header: "סטטוס",
        cell: (g: Graduate) => <ProfileCompletion graduate={g} />,
      },
      {
        header: "פעולות",
        cell: (g: Graduate) => {
          const canEdit = can("update", "graduates", g);
          const canDelete = can("delete", "graduates");

          return (
            <>
              {/* Desktop View */}
              <div className="hidden md:flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(g)}
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>צפייה</p>
                  </TooltipContent>
                </Tooltip>

                {canEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(g)}
                      >
                        <IconPencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>עריכה</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {canDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(g)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>מחיקה</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Mobile View */}
              <div className="flex md:hidden justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <IconDotsVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(g)}>
                      <IconEye className="mr-2 h-4 w-4" /> צפייה
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEdit(g)}>
                        <IconPencil className="mr-2 h-4 w-4" /> עריכה
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(g)}
                        className="text-destructive focus:text-destructive"
                      >
                        <IconTrash className="mr-2 h-4 w-4" /> מחיקה
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          );
        },
      },
    ],
    [onView, onEdit, onDelete, can],
  );

  return (
    <DataTable
      data={graduates}
      columns={columns}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      isLoading={loading}
      mobileRenderer={mobileRenderer}
      totalLabel="בוגרים"
    />
  );
}
