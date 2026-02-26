import { IconCheck, IconX } from "@tabler/icons-react";

interface GraduatesImportResultsProps {
  importResults: {
    imported: number;
    failed: number;
    failedRows: Array<{ row: number; errors: string[] }>;
  };
}

export function GraduatesImportResults({
  importResults,
}: GraduatesImportResultsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {importResults.imported > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-4">
            <IconCheck className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
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
              <IconX className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  {importResults.failed} שורה(ות) נכשלו
                </p>
              </div>
            </div>

            {importResults.failedRows.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {importResults.failedRows.map((failed) => (
                  <div
                    key={failed.row}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="font-medium text-red-900">
                      שורה {failed.row}
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-800 mt-1">
                      {failed.errors.map((err, idx) => (
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
          הייבוא הושלם. {importResults.imported + importResults.failed} שורות
          עובדו.
        </p>
      </div>
    </div>
  );
}
