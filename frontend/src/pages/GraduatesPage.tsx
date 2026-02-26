import { useEffect, useReducer, useCallback, useRef } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { graduatesService } from "@/services/graduatesService";
import type { Graduate } from "@shared/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GraduatesImportDialog } from "@/components/graduates/GraduatesImportDialog";
import { GraduatesHeader } from "@/components/graduates/GraduatesHeader";
import { GraduatesFilters } from "@/components/graduates/GraduatesFilters";
import { GraduatesTable } from "@/components/graduates/GraduatesTable";
import { useNavigate, Navigate } from "react-router";

// --- State & Reducer ---

interface GraduatesPageState {
  // Data
  graduates: Graduate[];
  total: number;
  loading: boolean;
  refreshKey: number;
  // Filters
  page: number;
  pageSize: number;
  search: string;
  debouncedSearch: string;
  shiurYearFilter: string[];
  availableYears: { shiur_year: string; count: number }[];
  // Dialogs
  graduateToDelete: Graduate | null;
  isDeleteDialogOpen: boolean;
  isImportDialogOpen: boolean;
}

type GraduatesPageAction =
  | { type: "SET_DATA"; payload: { graduates: Graduate[]; total: number } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_DEBOUNCED_SEARCH"; payload: string }
  | { type: "SET_SHIUR_YEAR_FILTER"; payload: string[] }
  | {
      type: "SET_AVAILABLE_YEARS";
      payload: { shiur_year: string; count: number }[];
    }
  | { type: "OPEN_DELETE_DIALOG"; payload: Graduate }
  | { type: "CLOSE_DELETE_DIALOG" }
  | { type: "OPEN_IMPORT_DIALOG" }
  | { type: "CLOSE_IMPORT_DIALOG" }
  | { type: "REFRESH_DATA" };

const initialState: GraduatesPageState = {
  graduates: [],
  total: 0,
  loading: false,
  refreshKey: 0,
  page: 1,
  pageSize: 20,
  search: "",
  debouncedSearch: "",
  shiurYearFilter: [],
  availableYears: [],
  graduateToDelete: null,
  isDeleteDialogOpen: false,
  isImportDialogOpen: false,
};

function reducer(
  state: GraduatesPageState,
  action: GraduatesPageAction,
): GraduatesPageState {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        graduates: action.payload.graduates,
        total: action.payload.total,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload, page: 1 };
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "SET_DEBOUNCED_SEARCH":
      return { ...state, debouncedSearch: action.payload, page: 1 };
    case "SET_SHIUR_YEAR_FILTER":
      return { ...state, shiurYearFilter: action.payload, page: 1 };
    case "SET_AVAILABLE_YEARS":
      return { ...state, availableYears: action.payload };
    case "OPEN_DELETE_DIALOG":
      return {
        ...state,
        graduateToDelete: action.payload,
        isDeleteDialogOpen: true,
      };
    case "CLOSE_DELETE_DIALOG":
      return { ...state, graduateToDelete: null, isDeleteDialogOpen: false };
    case "OPEN_IMPORT_DIALOG":
      return { ...state, isImportDialogOpen: true };
    case "CLOSE_IMPORT_DIALOG":
      return { ...state, isImportDialogOpen: false };
    case "REFRESH_DATA":
      return { ...state, refreshKey: state.refreshKey + 1 };
    default:
      return state;
  }
}

export default function GraduatesPage() {
  const { can, user, isShiurManager } = usePermissions();
  const navigate = useNavigate();
  useDocumentTitle("ניהול בוגרים");

  // Redirect logic moved to bottom

  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch available years on mount/refresh
  useEffect(() => {
    graduatesService
      .getGraduateYears()
      .then((years) => {
        dispatch({ type: "SET_AVAILABLE_YEARS", payload: years });
      })
      .catch(console.error);
  }, [state.refreshKey]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fetch data with robust cancellation handling
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const response = await graduatesService.getGraduates({
          page: state.page,
          pageSize: state.pageSize,
          search: state.debouncedSearch,
          shiurYear:
            state.shiurYearFilter.length > 0
              ? state.shiurYearFilter
              : undefined,
          myShiurs: isShiurManager ? user?.shiurs : undefined,
        });
        if (!ignore) {
          dispatch({
            type: "SET_DATA",
            payload: { graduates: response.data, total: response.total },
          });
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [
    state.page,
    state.pageSize,
    state.debouncedSearch,
    state.shiurYearFilter,
    isShiurManager,
    state.refreshKey,
    user,
  ]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: "SET_SEARCH", payload: value });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      dispatch({ type: "SET_DEBOUNCED_SEARCH", payload: value });
    }, 500);
  }, []);

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
    dispatch({ type: "OPEN_DELETE_DIALOG", payload: graduate });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (state.graduateToDelete) {
      await graduatesService.deleteGraduate(state.graduateToDelete.id);
      dispatch({ type: "CLOSE_DELETE_DIALOG" });
      dispatch({ type: "REFRESH_DATA" });
    }
  }, [state.graduateToDelete]);

  if (!can("read", "graduates")) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="space-y-6">
      <GraduatesHeader
        canCreate={can("create", "graduates")}
        canImport={can("import", "graduates")}
        onAdd={handleAdd}
        onImport={() => dispatch({ type: "OPEN_IMPORT_DIALOG" })}
      />

      <GraduatesFilters
        search={state.search}
        onSearchChange={handleSearchChange}
        shiurYearFilter={state.shiurYearFilter}
        onYearFilterChange={(value) =>
          dispatch({ type: "SET_SHIUR_YEAR_FILTER", payload: value })
        }
        availableYears={state.availableYears}
      />

      <GraduatesTable
        graduates={state.graduates}
        total={state.total}
        page={state.page}
        pageSize={state.pageSize}
        loading={state.loading}
        onPageChange={(p) => dispatch({ type: "SET_PAGE", payload: p })}
        onPageSizeChange={(s) =>
          dispatch({ type: "SET_PAGE_SIZE", payload: s })
        }
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <ConfirmDialog
        open={state.isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_DELETE_DIALOG" });
        }}
        title="מחיקת בוגר"
        description={
          <>
            האם אתה בטוח שברצונך למחוק את הבוגר{" "}
            <strong>
              {state.graduateToDelete?.first_name}{" "}
              {state.graduateToDelete?.last_name}
            </strong>
            ? פעולה זו אינה הפיכה.
          </>
        }
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="מחק"
      />

      <GraduatesImportDialog
        open={state.isImportDialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_IMPORT_DIALOG" });
        }}
        onImportComplete={() => dispatch({ type: "REFRESH_DATA" })}
      />
    </div>
  );
}
