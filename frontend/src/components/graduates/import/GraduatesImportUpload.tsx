import { Button } from "@/components/ui/button";
import { IconDownload, IconUpload } from "@tabler/icons-react";

interface GraduatesImportUploadProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

export function GraduatesImportUpload({
  onFileSelect,
  selectedFile,
}: GraduatesImportUploadProps) {
  const handleDownloadSample = (format: "csv" | "xlsx") => {
    const link = document.createElement("a");
    link.href = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/graduates/import/sample/${format}`;
    link.download = `graduates-sample.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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
            onChange={onFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <IconUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">
              {selectedFile ? selectedFile.name : "בחר קובץ או גרור הנה"}
            </p>
            <p className="text-sm text-muted-foreground">
              CSV או Excel (עד 50MB)
            </p>
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
  );
}
