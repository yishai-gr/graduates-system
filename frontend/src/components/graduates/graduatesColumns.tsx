import { type ColumnDef } from "@tanstack/react-table";
import type { Graduate } from "@shared/types";
import { type ColumnMeta } from "@/components/table/columns";
import { ProfileCompletion } from "@/components/graduates/ProfileCompletion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { IconPencil, IconTrash, IconEye } from "@tabler/icons-react";

export interface GraduatesColumnsHandlers {
  onView: (graduate: Graduate) => void;
  onEdit: (graduate: Graduate) => void;
  onDelete: (graduate: Graduate) => void;
  can: (action: any, resource: any, data?: any) => boolean;
  availableYears: { shiur_year: string; count: number }[];
  availableCities: { city: string; count: number }[];
  fieldCounts: Record<string, { empty: number; notEmpty: number }>;
}

export function getGraduatesColumns({
  onView,
  onEdit,
  onDelete,
  can,
  availableYears,
  availableCities,
  fieldCounts,
}: GraduatesColumnsHandlers): ColumnDef<Graduate, any>[] {
  return [
    {
      accessorKey: "fullName",
      header: "שם מלא",
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.first_name} {row.original.last_name}
        </div>
      ),
      meta: {
        filterVariant: "text",
      } as ColumnMeta,
    },
    {
      accessorKey: "phone",
      header: "פלאפון",
      meta: {
        filterVariant: "presence",
        filterOptions: [
          {
            label: `ריקים בלבד${fieldCounts.phone ? ` (${fieldCounts.phone.empty})` : ""}`,
            value: "isEmpty",
          },
          {
            label: `מלאים בלבד${fieldCounts.phone ? ` (${fieldCounts.phone.notEmpty})` : ""}`,
            value: "isNotEmpty",
          },
        ],
      } as ColumnMeta,
    },
    {
      accessorKey: "city",
      header: "עיר",
      cell: ({ row }) => row.original.city || "",
      meta: {
        filterVariant: "select",
        filterOptions: [
          {
            label: `[ריק]${fieldCounts.city ? ` (${fieldCounts.city.empty})` : ""}`,
            value: "isEmpty",
          },
          ...availableCities.map((c) => ({
            label: `${c.city} (${c.count})`,
            value: c.city,
          })),
        ],
      } as ColumnMeta,
    },
    {
      accessorKey: "shiur_year",
      header: "מחזור",
      cell: ({ row }) => row.original.shiur_year || "",
      meta: {
        filterVariant: "select",
        filterOptions: [
          {
            label: `[ריק]${fieldCounts.shiur_year ? ` (${fieldCounts.shiur_year.empty})` : ""}`,
            value: "empty",
          },
          ...availableYears.map((y) => ({
            label: `${y.shiur_year} (${y.count})`,
            value: y.shiur_year,
          })),
        ],
      } as ColumnMeta,
    },
    {
      id: "status",
      header: "סטטוס",
      cell: ({ row }) => <ProfileCompletion graduate={row.original} />,
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }) => {
        const g = row.original;
        const canEdit = can("update", "graduates", g);
        const canDelete = can("delete", "graduates");

        return (
          <div className="flex justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onView(g)}>
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
                  <Button variant="ghost" size="icon" onClick={() => onEdit(g)}>
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
        );
      },
    },
  ];
}
