import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconUpload,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconDownload,
} from "@tabler/icons-react";
import type {
  ImportPreviewResponse,
} from "@shared/types";
import { importService } from "@/services/importService";

interface GraduatesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type DialogStep = "upload" | "preview" | "confirm" | "results";

export function GraduatesImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: GraduatesImportDialogProps) {
  const [step, setStep] = useState<DialogStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [rowsToImport, setRowsToImport] = useState<Array<{row: number; data: any}>>([]);
  const [importResults, setImportResults] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        setError("רק קבצי CSV ו-Excel (.xlsx, .xls) מותרים");
        return;
      }
      
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("גודל הקובץ חורג מ-50MB");
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await importService.previewImport(selectedFile);
      setPreviewData(response);
      setRowsToImport(response.validRows);
      setStep("preview");
    } catch (err) {
      setError((err as Error).message || "שגיאה בטעינת הקובץ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (rowsToImport.length === 0) {
      setError("אין שורות לייבוא");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await importService.confirmImport({
        rowsToImport,
      });
      setImportResults(response);
      setStep("results");
      onImportComplete?.();
    } catch (err) {
      setError((err as Error).message || "שגיאה בייבוא הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = (format: "csv" | "xlsx") => {
    const link = document.createElement("a");
    link.href = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/graduates/import/sample/${format}`;
    link.download = `graduates-sample.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRow = (row: { row: number; data: any }) => {
    setRowsToImport((prev) =>
      prev.some((r) => r.row === row.row)
        ? prev.filter((r) => r.row !== row.row)
        : [...prev, row]
    );
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setError(null);
    setPreviewData(null);
    setRowsToImport([]);
    setImportResults(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ייבוא בוגרים מקובץ</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <IconAlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">הורדת קובץ לדוגמה</h3>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadSample("csv")}
                  className="gap-2"
                >
                  <IconDownload className="h-4 w-4" />
                  הורדת דוגמה CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadSample("xlsx")}
                  className="gap-2"
                >
                  <IconDownload className="h-4 w-4" />
                  הורדת דוגמה Excel
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                הורד קובץ דוגמה כדי לראות את הפורמט הנכון לייבוא
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">העלאת קובץ</h3>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <IconUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">
                    {selectedFile ? selectedFile.name : "בחר קובץ או גרור הנה"}
                  </p>
                  <p className="text-sm text-muted-foreground">CSV או Excel (עד 50MB)</p>
                </label>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">הערות חשובות:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>השורה הראשונה צריכה להיות כותרות העמודות</li>
                <li>ניתן להעלות בפורמטים CSV ו-Excel</li>
                <li>גודל הקובץ המקסימלי הוא 50MB</li>
                <li>כל השדות בתעודת זהות מעובדים לאימות Luhn</li>
                <li>כתובות דוא"ל וטלפונים מאומתים</li>
                <li>זיהוי אוטומטי של כפילויות</li>
              </ul>
            </div>
          </div>
        )}

        {step === "preview" && previewData && (
          <Tabs defaultValue="valid" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="valid">
                טוב ({previewData.summary.validRows})
              </TabsTrigger>
              <TabsTrigger value="errors">
                שגיאות ({previewData.summary.errorRows})
              </TabsTrigger>
              <TabsTrigger value="duplicates">
                כפולות ({previewData.summary.duplicateRows})
              </TabsTrigger>
              <TabsTrigger value="summary">סיכום</TabsTrigger>
            </TabsList>

            <TabsContent value="valid" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {previewData.summary.validRows} שורות תקינות מוכנות לייבוא
              </p>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {rowsToImport.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-right">
                          <input
                            type="checkbox"
                            checked={
                              rowsToImport.length === previewData.validRows.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRowsToImport(previewData.validRows);
                              } else {
                                setRowsToImport([]);
                              }
                            }}
                          />
                        </th>
                        <th className="p-2 text-right">שם</th>
                        <th className="p-2 text-right">דוא"ל</th>
                        <th className="p-2 text-right">שיעור</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.validRows.map((row) => (
                        <tr
                          key={row.row}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={rowsToImport.some(
                                (r) => r.row === row.row
                              )}
                              onChange={() => toggleRow(row)}
                            />
                          </td>
                          <td className="p-2">
                            {row.data.first_name} {row.data.last_name}
                          </td>
                          <td className="p-2">{row.data.email || "-"}</td>
                          <td className="p-2">{row.data.shiur_year || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-center text-muted-foreground">
                    אין שורות תקינות
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {previewData.errorRows.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {previewData.errorRows.map((error) => (
                    <div
                      key={error.row}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex gap-2">
                        <IconX className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">שורה {error.row}</p>
                          <ul className="list-disc list-inside text-sm mt-1 text-red-800">
                            {error.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">אין שגיאות</p>
              )}
            </TabsContent>

            <TabsContent value="duplicates" className="space-y-4">
              {previewData.duplicateRows.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {previewData.duplicateRows.map((dup) => (
                    <div
                      key={dup.row}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex gap-2">
                        <IconAlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900">שורה {dup.row}</p>
                          <p className="text-sm text-yellow-800">
                            כפול עבור: {dup.matchFields.join(", ")}
                          </p>
                          <p className="text-sm text-yellow-700">
                            בוגר קיים עם ID: {dup.duplicateId}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">אין כפילויות</p>
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">סך הכל שורות</p>
                  <p className="text-2xl font-bold">
                    {previewData.summary.totalRows}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50">
                  <p className="text-sm text-muted-foreground">שורות תקינות</p>
                  <p className="text-2xl font-bold text-green-700">
                    {previewData.summary.validRows}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-red-50">
                  <p className="text-sm text-muted-foreground">שורות עם שגיאות</p>
                  <p className="text-2xl font-bold text-red-700">
                    {previewData.summary.errorRows}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <p className="text-sm text-muted-foreground">שורות כפולות</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {previewData.summary.duplicateRows}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === "results" && importResults && (
          <div className="space-y-6">
            <div className="space-y-4">
              {importResults.imported > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-4">
                  <IconCheck className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">
                      בוגרים {importResults.imported} יובאו בהצלחה
                    </p>
                  </div>
                </div>
              )}

              {importResults.failed > 0 && (
                <div className="space-y-2">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-4">
                    <IconX className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">
                        {importResults.failed} שורה(ות) נכשלו
                      </p>
                    </div>
                  </div>

                  {importResults.failedRows.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {importResults.failedRows.map((failed: { row: number; errors: string[] }) => (
                        <div
                          key={failed.row}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <p className="font-medium text-red-900">שורה {failed.row}</p>
                          <ul className="list-disc list-inside text-sm text-red-800 mt-1">
                            {failed.errors.map((err: string, idx: number) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                הייבוא הושלם. {importResults.imported + importResults.failed} שורות עובדו.
              </p>
            </div>
          </div>
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
                onClick={() => setStep("upload")}
                disabled={isLoading}
              >
                חזור
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
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
              <Button onClick={handleClose}>
                חזור לדף בוגרים
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
