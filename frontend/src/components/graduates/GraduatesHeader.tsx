import { Button } from "@/components/ui/button";
import { IconPlus, IconFileImport } from "@tabler/icons-react";

interface GraduatesHeaderProps {
  canCreate: boolean;
  canImport: boolean;
  onAdd: () => void;
  onImport: () => void;
}

export function GraduatesHeader({
  canCreate,
  canImport,
  onAdd,
  onImport,
}: GraduatesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        ניהול בוגרים
      </h1>
      <div className="flex gap-2 w-full sm:w-auto">
        {canCreate && (
          <Button onClick={onAdd} className="flex-1 sm:flex-none">
            <IconPlus className="h-4 w-4" />
            רישום בוגר חדש
          </Button>
        )}
        {canImport && (
          <Button
            variant="outline"
            onClick={onImport}
            className="flex-1 sm:flex-none"
          >
            <IconFileImport className="h-4 w-4" />
            ייבוא מקובץ
          </Button>
        )}
      </div>
    </div>
  );
}
