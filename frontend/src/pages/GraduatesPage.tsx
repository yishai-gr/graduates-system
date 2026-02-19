import { useEffect, useState, useCallback, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { graduatesService } from "@/services/graduatesService";
import type { Graduate } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GraduateMobileCard } from "@/components/graduates/GraduateMobileCard";
import { GraduatesImportDialog } from "@/components/graduates/GraduatesImportDialog";
import { ProfileCompletion } from "@/components/graduates/ProfileCompletion";
import { HebrewYearCombobox } from "@/components/users/HebrewYearCombobox";
import { useNavigate } from "react-router";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconEye,
  IconDotsVertical,
  IconFileImport,
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

export default function GraduatesPage() {
  const { can, user, isShiurManager } = usePermissions();
  const navigate = useNavigate();
  useDocumentTitle("ניהול בוגרים");

  // State
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [shiurYearFilter, setShiurYearFilter] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<
    { shiur_year: string; count: number }[]
  >([]);

  // Dialogs
  const [graduateToDelete, setGraduateToDelete] = useState<Graduate | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);

  // Fetch available years on mount
  useEffect(() => {
    graduatesService
      .getGraduateYears()
      .then((years) => {
        // API returns { shiur_year: string, count: number }
        // Component expects { shiur_year: string, count: number }
        setAvailableYears(years);
      })
      .catch(console.error);
  }, [refreshKey]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Logic for "My Shiurs" filtering is handled in service mock if we pass params
        const response = await graduatesService.getGraduates({
          page,
          pageSize,
          search: debouncedSearch,
          shiurYear: shiurYearFilter.length > 0 ? shiurYearFilter : undefined,
          myShiurs: isShiurManager ? user?.shiurs : undefined, // Service mock handles this logic
        });
        if (!ignore) {
          setGraduates(response.data);
          setTotal(response.total);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [
    page,
    pageSize,
    debouncedSearch,
    shiurYearFilter,
    isShiurManager,
    refreshKey,
  ]);

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
      // setIsDeleting(true);
      await graduatesService.deleteGraduate(graduateToDelete.id);
      // setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setGraduateToDelete(null);
      setRefreshKey((prev) => prev + 1);
    }
  }, [graduateToDelete]);

  // Permission Checks helpers using hook
  const canCreate = can("create", "graduates");

  const mobileRenderer = useCallback(
    (graduate: Graduate) => (
      <GraduateMobileCard
        graduate={graduate}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={can("delete", "graduates") ? handleDeleteClick : undefined} // Only pass if can delete
        canEdit={can("update", "graduates", graduate)}
        canDelete={can("delete", "graduates")}
      />
    ),
    [handleEdit, handleView, handleDeleteClick, can],
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
          // Permission check for SPECIFIC graduate
          const canEdit = can("update", "graduates", g);
          const canDelete = can("delete", "graduates"); // Usually super_admin only

          return (
            <>
              {/* Desktop View - Buttons with Tooltips */}
              <div className="hidden md:flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(g)}
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
                        onClick={() => handleEdit(g)}
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
                        onClick={() => handleDeleteClick(g)}
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

              {/* Mobile View - Dropdown Menu */}
              <div className="flex md:hidden justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <IconDotsVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleView(g)}>
                      <IconEye className="mr-2 h-4 w-4" /> צפייה
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => handleEdit(g)}>
                        <IconPencil className="mr-2 h-4 w-4" /> עריכה
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(g)}
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
    [handleView, handleEdit, handleDeleteClick, can],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          ניהול בוגרים
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          {canCreate && (
            <Button onClick={handleAdd} className="flex-1 sm:flex-none">
              <IconPlus className="h-4 w-4" />
              רישום בוגר חדש
            </Button>
          )}
          {can("import", "graduates") && (
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <IconFileImport className="h-4 w-4" />
              ייבוא מקובץ
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <HebrewYearCombobox
            value={
              Array.isArray(shiurYearFilter)
                ? shiurYearFilter
                : shiurYearFilter
                  ? [shiurYearFilter]
                  : []
            }
            onChange={(val) => {
              setShiurYearFilter(val as string[]);
              setPage(1);
            }}
            multiple={true}
            items={availableYears}
          />
        </div>
      </div>

      <DataTable
        data={graduates}
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
        totalLabel="בוגרים"
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
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
        onImportComplete={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
