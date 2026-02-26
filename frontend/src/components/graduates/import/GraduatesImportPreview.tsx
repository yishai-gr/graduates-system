import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import type { ImportPreviewResponse } from "@shared/types";

interface GraduatesImportPreviewProps {
  previewData: ImportPreviewResponse;
  rowsToImport: Array<{ row: number; data: any }>;
  setRowsToImport: (rows: Array<{ row: number; data: any }>) => void;
}

export function GraduatesImportPreview({
  previewData,
  rowsToImport,
  setRowsToImport,
}: GraduatesImportPreviewProps) {
  const toggleRow = (row: { row: number; data: any }) => {
    setRowsToImport(
      rowsToImport.some((r) => r.row === row.row)
        ? rowsToImport.filter((r) => r.row !== row.row)
        : [...rowsToImport, row],
    );
  };

  return (
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
          {previewData.validRows.length > 0 ? (
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
                  <tr key={row.row} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={rowsToImport.some((r) => r.row === row.row)}
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
                  <IconX className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
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
                  <IconAlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      שורה {dup.row}
                    </p>
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
  );
}
