import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { IconLock } from "@tabler/icons-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  useDocumentTitle("אין הרשאה");

  return (
    <div className="flex h-[80dvh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <IconLock className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">אין לך הרשאה לצפות בעמוד זה</h1>
      <p className="text-muted-foreground max-w-sm">
        אנא פנה למנהל המערכת אם אתה סבור שמדובר בטעות, או חזור לעמוד הבית.
      </p>
      <Button onClick={() => navigate("/")} variant="default">
        חזרה לדף הבית
      </Button>
    </div>
  );
}
