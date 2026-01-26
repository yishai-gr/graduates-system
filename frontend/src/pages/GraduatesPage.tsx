import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { graduatesService } from "@/services/graduatesService";
import type { Graduate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GraduateMobileCard } from "@/components/graduates/GraduateMobileCard";
import { ProfileCompletion } from "@/components/graduates/ProfileCompletion";
import { useNavigate } from "react-router";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconEye,
  IconFilter,
} from "@tabler/icons-react";

export default function GraduatesPage() {
  const { can, user, isShiurManager } = usePermissions();
  const navigate = useNavigate();

  // State
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [shiurYearFilter, setShiurYearFilter] = useState("");

  // Dialogs
  const [graduateToDelete, setGraduateToDelete] = useState<Graduate | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);

  // Quick Filters for Shiur Manager
  useEffect(() => {
    // If Shiur Manager manages only one year, defaulting filter might be nice,
    // but requirements say they can see all appointed years + orphans.
    // Let's leave filter open but restrict data via service if backend enforces it (service mocks it).
  }, []);

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
          pageSize: 20,
          search: debouncedSearch,
          shiurYear: shiurYearFilter ? shiurYearFilter : undefined,
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
  }, [page, debouncedSearch, shiurYearFilter, isShiurManager, refreshKey]);

  // Handlers
  const handleEdit = (graduate: Graduate) => {
    navigate(`/graduates/${graduate.id}/edit`);
  };

  const handleAdd = () => {
    navigate("/graduates/new");
  };

  const handleView = (graduate: Graduate) => {
    navigate(`/graduates/${graduate.id}`);
  };

  const handleDeleteClick = (graduate: Graduate) => {
    setGraduateToDelete(graduate);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (graduateToDelete) {
      // setIsDeleting(true);
      await graduatesService.deleteGraduate(graduateToDelete.id);
      // setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setGraduateToDelete(null);
      setRefreshKey((prev) => prev + 1);
    }
  };

  // Permission Checks helpers using hook
  const canCreate = can("create", "graduates");

  const columns = [
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
          <div className="flex justify-end gap-2">
            {/* Always show View/Edit button - if only view allowed, dialog handles readonly or we can show "Eye" icon */}
            {/* Requirement: "צפייה, עריכה, מחיקה" */}
            {/* If can edit, show Pencil. If can only view, show Eye? Or Pencil opens dialog in read mode? 
                 Let's assume Pencil is for Edit. If cannot edit, maybe show Eye.
                 For now, simpler: Show Pencil if canEdit.
             */}
            {/* View Button - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleView(g)}
              title="צפייה"
            >
              <IconEye className="h-4 w-4" />
            </Button>

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(g)}
                title="עריכה"
              >
                <IconPencil className="h-4 w-4" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteClick(g)}
                title="מחיקה"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          ניהול בוגרים
        </h1>
        {canCreate && (
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <IconPlus className="h-4 w-4" />
            רישום בוגר חדש
          </Button>
        )}
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
        <div className="w-full sm:w-48">
          <div className="relative">
            <IconFilter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="סינון לפי מחזור (לדוגמה: נח)"
              className="pr-9"
              value={shiurYearFilter}
              onChange={(e) => setShiurYearFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DataTable
        data={graduates}
        columns={columns}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        isLoading={loading}
        mobileRenderer={(graduate) => (
          <GraduateMobileCard
            graduate={graduate}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={
              can("delete", "graduates") ? handleDeleteClick : undefined
            } // Only pass if can delete
            canEdit={can("update", "graduates", graduate)}
            canDelete={can("delete", "graduates")}
          />
        )}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="מחיקת בוגר"
        description={`האם אתה בטוח שברצונך למחוק את הבוגר ${graduateToDelete?.first_name} ${graduateToDelete?.last_name}? פעולה זו אינה הפיכה.`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="מחק"
      />
    </div>
  );
}
