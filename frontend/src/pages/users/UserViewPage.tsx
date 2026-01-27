import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usersService } from "@/services/usersService";
import type { User } from "@shared/types";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
  IconMail,
  IconShieldLock,
  IconUserEdit,
  IconPencil,
  IconLoader,
} from "@tabler/icons-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function UserViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if not admin
    if (!isSuperAdmin) {
      navigate("/unauthorized");
      return;
    }

    if (id) {
      usersService
        .getUserById(id)
        .then(setUser)
        .catch((err) => {
          console.error(err);
          setError("לא ניתן לטעון את פרטי המשתמש");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 text-center">
        <p className="text-destructive font-medium mb-4">
          {error || "משתמש לא נמצא"}
        </p>
        <Button onClick={() => navigate("/users")}>חזרה לרשימה</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/users")}
          >
            <IconArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              {user.role === "super_admin" ? (
                <>
                  <IconShieldLock className="h-4 w-4" />
                  <span>מנהל ראשי</span>
                </>
              ) : (
                <>
                  <IconUserEdit className="h-4 w-4" />
                  <span>אחראי שיעור</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => navigate(`/users/${user.id}/edit`)}
          >
            <IconPencil className="h-4 w-4 ml-2" />
            עריכה
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">פרטים אישיים</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">אימייל:</span>
              <a href={`mailto:${user.email}`} className="hover:underline">
                {user.email || "-"}
              </a>
            </div>
          </div>
        </div>

        {user.role === "shiur_manager" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              ניהול מחזורים
            </h3>
            <div className="bg-muted/30 p-4 rounded-md">
              {user.shiurs && user.shiurs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.shiurs.map((shiur, idx) => (
                    <span
                      key={idx}
                      className="bg-background border rounded px-2 py-1 text-sm font-medium"
                    >
                      {shiur}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  לא משויך למחזורים
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
