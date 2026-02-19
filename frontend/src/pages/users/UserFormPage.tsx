import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("shiur_manager");
  const [shiurs, setShiurs] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if not admin
    if (!isSuperAdmin) {
      navigate("/unauthorized"); // or back
      return;
    }

    if (id) {
      setInitialLoading(true);
      usersService
        .getUserById(id)
        .then((user) => {
          setFirstName(user.firstName);
          setLastName(user.lastName);
          setEmail(user.email);
          setRole(user.role);
          setShiurs(user.shiurs || []);
        })
        .catch((err) => {
          console.error(err);
          setError("לא ניתן לטעון את פרטי המשתמש");
        })
        .finally(() => {
          setInitialLoading(false);
        });
    } else {
      setInitialLoading(false);
    }
  }, [id, isSuperAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
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
      setError(err.message || "אירעה שגיאה בשמירת הנתונים");
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <IconAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">תפקיד</Label>
            <Select value={role} onValueChange={(val) => setRole(val as Role)}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shiur_manager">אחראי שיעור</SelectItem>
                <SelectItem value="super_admin">מנהל ראשי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "shiur_manager" && (
            <div className="grid gap-2 animate-in fade-in duration-300">
              <Label htmlFor="shiurs">מחזורים (שנים עבריות)</Label>
              <HebrewYearCombobox
                value={shiurs}
                onChange={setShiurs}
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
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
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
