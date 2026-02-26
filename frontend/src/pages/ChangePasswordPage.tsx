import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usersService } from "@/services/usersService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconAlertCircle, IconCheck, IconLoader } from "@tabler/icons-react";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ChangePasswordPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  useDocumentTitle("שינוי סיסמה");

  const [state, setState] = useState({
    password: "",
    confirmPassword: "",
    isLoading: false,
    error: "",
    success: false,
  });

  // If no ID provided, assume current user
  const targetId = id || currentUser?.id;

  const updateState = (updates: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    updateState({ error: "", success: false });

    if (state.password !== state.confirmPassword) {
      updateState({ error: "הסיסמאות אינן תואמות" });
      return;
    }

    if (state.password.length < 6) {
      updateState({ error: "הסיסמה חייבת להיות באורך של לפחות 6 תווים" });
      return;
    }

    updateState({ isLoading: true });

    try {
      await usersService.updateUser(targetId, {
        password: state.password,
      });
      updateState({ success: true });

      // If it was a new user setup (logic from previous page redirect), maybe offer to go back?
      // For now, show success and button to go back.
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err: any) {
      updateState({ error: err.message || "שגיאה בשינוי הסיסמה" });
    } finally {
      updateState({ isLoading: false });
    }
  };

  if (!targetId) return null;

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">שינוי סיסמה</h1>
        <p className="text-muted-foreground mb-6">
          {id
            ? "הגדר סיסמה חדשה עבור המשתמש"
            : "הגדר סיסמה חדשה עבור החשבון שלך"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {state.error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 dark:bg-destructive/25 p-3 text-sm text-destructive dark:text-destructive-foreground">
              <IconAlertCircle size={18} />
              <span>{state.error}</span>
            </div>
          )}

          {state.success && (
            <div className="flex items-center gap-2 rounded-md bg-green-500/15 dark:bg-green-500/25 p-3 text-sm text-green-600 dark:text-green-400">
              <IconCheck size={18} />
              <span>הסיסמה שונתה בהצלחה! חוזר...</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <Input
              id="password"
              type="password"
              value={state.password}
              onChange={(e) => updateState({ password: e.target.value })}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">אימות סיסמה</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={state.confirmPassword}
              onChange={(e) => updateState({ confirmPassword: e.target.value })}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={state.isLoading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={state.isLoading || state.success}>
              {state.isLoading && (
                <IconLoader className="ml-2 h-4 w-4 animate-spin" />
              )}
              שנה סיסמה
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
