import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

interface UsersHeaderProps {
  onAdd: () => void;
}

export function UsersHeader({ onAdd }: UsersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        ניהול משתמשים
      </h1>
      <Button onClick={onAdd} className="w-full sm:w-auto">
        <IconPlus className="mr-2 h-4 w-4" />
        הוספת משתמש
      </Button>
    </div>
  );
}
