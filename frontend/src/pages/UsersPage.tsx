import { useEffect, useReducer, useCallback, useRef } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usersService } from "@/services/usersService";
import type { User } from "@shared/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UsersHeader } from "@/components/users/UsersHeader";
import { UsersFilters } from "@/components/users/UsersFilters";
import { UsersTable } from "@/components/users/UsersTable";
import { useNavigate, Navigate } from "react-router";

// --- State & Reducer ---

interface UsersPageState {
  // Data
  users: User[];
  total: number;
  loading: boolean;
  // Filters
  page: number;
  pageSize: number;
  search: string;
  debouncedSearch: string;
  // Dialogs
  userToDelete: User | null;
  isDeleteDialogOpen: boolean;
}

type UsersPageAction =
  | { type: "SET_DATA"; payload: { users: User[]; total: number } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_DEBOUNCED_SEARCH"; payload: string }
  | { type: "OPEN_DELETE_DIALOG"; payload: User }
  | { type: "CLOSE_DELETE_DIALOG" };

const initialState: UsersPageState = {
  users: [],
  total: 0,
  loading: false,
  page: 1,
  pageSize: 10,
  search: "",
  debouncedSearch: "",
  userToDelete: null,
  isDeleteDialogOpen: false,
};

function reducer(
  state: UsersPageState,
  action: UsersPageAction,
): UsersPageState {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        users: action.payload.users,
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
    case "OPEN_DELETE_DIALOG":
      return {
        ...state,
        userToDelete: action.payload,
        isDeleteDialogOpen: true,
      };
    case "CLOSE_DELETE_DIALOG":
      return { ...state, userToDelete: null, isDeleteDialogOpen: false };
    default:
      return state;
  }
}

export default function UsersPage() {
  const { isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  useDocumentTitle("ניהול משתמשים");

  const [state, dispatch] = useReducer(reducer, initialState);

  // Redirect logic moved to bottom

  // Timer ref for debounce
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await usersService.getUsers({
        page: state.page,
        pageSize: state.pageSize,
        search: state.debouncedSearch,
      });
      dispatch({
        type: "SET_DATA",
        payload: { users: response.data, total: response.total },
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.page, state.pageSize, state.debouncedSearch]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [fetchData, isSuperAdmin]);

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
    (user: User) => {
      navigate(`/users/${user.id}/edit`);
    },
    [navigate],
  );

  const handleAdd = useCallback(() => {
    navigate("/users/new");
  }, [navigate]);

  const handleView = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}`);
    },
    [navigate],
  );

  const handleChangePassword = useCallback(
    (user: User) => {
      navigate(`/users/${user.id}/password`);
    },
    [navigate],
  );

  const handleDeleteClick = useCallback((user: User) => {
    dispatch({ type: "OPEN_DELETE_DIALOG", payload: user });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (state.userToDelete) {
      await usersService.deleteUser(state.userToDelete.id);
      dispatch({ type: "CLOSE_DELETE_DIALOG" });
      fetchData();
    }
  }, [state.userToDelete, fetchData]);

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="space-y-6">
      <UsersHeader onAdd={handleAdd} />

      <UsersFilters search={state.search} onSearchChange={handleSearchChange} />

      <UsersTable
        users={state.users}
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
        onChangePassword={handleChangePassword}
      />

      <ConfirmDialog
        open={state.isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_DELETE_DIALOG" });
        }}
        title="מחיקת משתמש"
        description={
          <>
            האם אתה בטוח שברצונך למחוק את המשתמש{" "}
            <strong>
              {state.userToDelete?.firstName} {state.userToDelete?.lastName}
            </strong>
            ? פעולה זו אינה הפיכה.
          </>
        }
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="מחק"
      />
    </div>
  );
}
