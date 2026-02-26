import { useReducer } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { ImportPreviewResponse } from "@shared/types";
import { importService } from "@/services/importService";
import { GraduatesImportUpload } from "./import/GraduatesImportUpload";
import { GraduatesImportPreview } from "./import/GraduatesImportPreview";
import { GraduatesImportResults } from "./import/GraduatesImportResults";

interface GraduatesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type DialogStep = "upload" | "preview" | "results";

interface State {
  step: DialogStep;
  isLoading: boolean;
  error: string | null;
  selectedFile: File | null;
  previewData: ImportPreviewResponse | null;
  rowsToImport: Array<{ row: number; data: any }>;
  importResults: any;
}

type Action =
  | { type: "SELECT_FILE"; payload: File }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "START_AXION" } // Generic start loading
  | {
      type: "PREVIEW_SUCCESS";
      payload: {
        previewData: ImportPreviewResponse;
        rowsToImport: Array<{ row: number; data: any }>;
      };
    }
  | { type: "IMPORT_SUCCESS"; payload: any }
  | { type: "AXION_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "SET_STEP"; payload: DialogStep }
  | { type: "UPDATE_ROWS"; payload: Array<{ row: number; data: any }> };

const initialState: State = {
  step: "upload",
  isLoading: false,
  error: null,
  selectedFile: null,
  previewData: null,
  rowsToImport: [],
  importResults: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SELECT_FILE":
      return { ...state, selectedFile: action.payload, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "START_AXION":
      return { ...state, isLoading: true, error: null };
    case "PREVIEW_SUCCESS":
      return {
        ...state,
        isLoading: false,
        previewData: action.payload.previewData,
        rowsToImport: action.payload.rowsToImport,
        step: "preview",
      };
    case "IMPORT_SUCCESS":
      return {
        ...state,
        isLoading: false,
        importResults: action.payload,
        step: "results",
      };
    case "AXION_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "RESET":
      return initialState;
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "UPDATE_ROWS":
      return { ...state, rowsToImport: action.payload };
    default:
      return state;
  }
}

export function GraduatesImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: GraduatesImportDialogProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    step,
    isLoading,
    error,
    selectedFile,
    previewData,
    rowsToImport,
    importResults,
  } = state;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        dispatch({
          type: "SET_ERROR",
          payload: "רק קבצי CSV ו-Excel (.xlsx, .xls) מותרים",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        dispatch({ type: "SET_ERROR", payload: "גודל הקובץ חורג מ-50MB" });
        return;
      }

      dispatch({ type: "SELECT_FILE", payload: file });
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    dispatch({ type: "START_AXION" });

    try {
      const response = await importService.previewImport(selectedFile);
      dispatch({
        type: "PREVIEW_SUCCESS",
        payload: {
          previewData: response,
          rowsToImport: response.validRows,
        },
      });
    } catch (err) {
      dispatch({
        type: "AXION_ERROR",
        payload: (err as Error).message || "שגיאה בטעינת הקובץ",
      });
    }
  };

  const handleConfirmImport = async () => {
    if (rowsToImport.length === 0) {
      dispatch({ type: "SET_ERROR", payload: "אין שורות לייבוא" });
      return;
    }

    dispatch({ type: "START_AXION" });

    try {
      const response = await importService.confirmImport({
        rowsToImport,
      });
      dispatch({ type: "IMPORT_SUCCESS", payload: response });
      onImportComplete?.();
    } catch (err) {
      dispatch({
        type: "AXION_ERROR",
        payload: (err as Error).message || "שגיאה בייבוא הנתונים",
      });
    }
  };

  const handleClose = () => {
    dispatch({ type: "RESET" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>ייבוא בוגרים מקובץ</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <IconAlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {step === "upload" && (
          <GraduatesImportUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        )}

        {step === "preview" && previewData && (
          <GraduatesImportPreview
            previewData={previewData}
            rowsToImport={rowsToImport}
            setRowsToImport={(rows) =>
              dispatch({ type: "UPDATE_ROWS", payload: rows })
            }
          />
        )}

        {step === "results" && importResults && (
          <GraduatesImportResults importResults={importResults} />
        )}

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? "טוען..." : "תצוגה מקדימה"}
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  dispatch({ type: "SET_STEP", payload: "upload" })
                }
                disabled={isLoading}
              >
                חזור
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  dispatch({ type: "SET_STEP", payload: "upload" })
                }
                disabled={isLoading}
              >
                בחר קובץ אחר
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={rowsToImport.length === 0 || isLoading}
              >
                {isLoading ? "מייבא..." : "אישור ייבוא"}
              </Button>
            </>
          )}

          {step === "results" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                סגור
              </Button>
              <Button onClick={handleClose}>חזור לדף בוגרים</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
