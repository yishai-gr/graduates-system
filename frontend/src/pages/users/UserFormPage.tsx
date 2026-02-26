import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usersService } from "@/services/usersService";
import type { Role } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconAlertCircle,
  IconArrowRight,
  IconLoader,
} from "@tabler/icons-react";
import { HebrewYearCombobox } from "@/components/users/HebrewYearCombobox";

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  useDocumentTitle(id ? "עריכת משתמש" : "הוספת משתמש");

  const [state, setState] = useState({
    formData: {
      firstName: "",
      lastName: "",
      email: "",
      role: "shiur_manager" as Role,
      shiurs: [] as string[],
    },
    isLoading: false,
    initialLoading: !!id,
    error: "",
  });

  const updateState = (updates: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Redirect logic moved to bottom

  useEffect(() => {
    if (id) {
      updateState({ initialLoading: true });
      usersService
        .getUserById(id)
        .then((user) => {
          updateState({
            formData: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              shiurs: user.shiurs || [],
            },
            initialLoading: false,
          });
        })
        .catch((err) => {
          console.error(err);
          updateState({
            error: "לא ניתן לטעון את פרטי המשתמש",
            initialLoading: false,
          });
        });
    } else {
      updateState({ initialLoading: false });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ error: "", isLoading: true });

    try {
      const { firstName, lastName, email, role, shiurs } = state.formData;
      if (!firstName || !lastName || !email) {
        throw new Error("נא למלא את כל השדות החובה");
      }

      const userData = {
        firstName,
        lastName,
        email,
        role,
        shiurs: role === "shiur_manager" ? shiurs : undefined,
      };

      let newId = id;
      if (id) {
        await usersService.updateUser(id, userData);
      } else {
        const created = await usersService.createUser(userData);
        newId = created.id;
      }

      if (id) {
        navigate("/users");
      } else {
        // New user -> Redirect to password setup
        navigate(`/users/${newId}/password`);
      }
    } catch (err: any) {
      updateState({
        error: err.message || "אירעה שגיאה בשמירת הנתונים",
        isLoading: false,
      });
    } finally {
      // If success, we navigated away. If error, we set loading false in catch.
      // But purely for safety:
      if (id) updateState({ isLoading: false });
    }
  };

  if (state.initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin
  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
          <IconArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {id ? "עריכת פרטי משתמש" : "הוספת משתמש חדש"}
        </h1>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-6">
          {state.error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <IconAlertCircle size={18} />
              <span>{state.error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                value={state.formData.firstName}
                onChange={(e) =>
                  updateState({
                    formData: { ...state.formData, firstName: e.target.value },
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                value={state.formData.lastName}
                onChange={(e) =>
                  updateState({
                    formData: { ...state.formData, lastName: e.target.value },
                  })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={state.formData.email}
              onChange={(e) =>
                updateState({
                  formData: { ...state.formData, email: e.target.value },
                })
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">תפקיד</Label>
            <Select
              value={state.formData.role}
              onValueChange={(val) =>
                updateState({
                  formData: { ...state.formData, role: val as Role },
                })
              }
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shiur_manager">אחראי שיעור</SelectItem>
                <SelectItem value="super_admin">מנהל ראשי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.formData.role === "shiur_manager" && (
            <div className="grid gap-2 animate-in fade-in duration-300">
              <Label htmlFor="shiurs">מחזורים (שנים עבריות)</Label>
              <HebrewYearCombobox
                value={state.formData.shiurs}
                onChange={(val) =>
                  updateState({
                    formData: { ...state.formData, shiurs: val },
                  })
                }
                multiple
              />
              <p className="text-[0.8rem] text-muted-foreground">
                ניתן לבחור מספר מחזורים.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              disabled={state.isLoading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={state.isLoading}>
              {state.isLoading && (
                <IconLoader className="ml-2 h-4 w-4 animate-spin" />
              )}
              {id ? "שמור שינויים" : "צור משתמש"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
