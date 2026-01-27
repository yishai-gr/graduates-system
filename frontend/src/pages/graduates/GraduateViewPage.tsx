import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { graduatesService } from "@/services/graduatesService";
import type { Graduate } from "@shared/types";
import { Button } from "@/components/ui/button";
import { ProfileCompletion } from "@/components/graduates/ProfileCompletion";
import {
  IconArrowRight,
  IconPhone,
  IconMail,
  IconMapPin,
  IconCalendar,
  IconId,
  IconCake,
  IconLoader,
  IconPencil,
} from "@tabler/icons-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function GraduateViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const [graduate, setGraduate] = useState<Graduate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      graduatesService
        .getGraduateById(id)
        .then(setGraduate)
        .catch((err) => {
          console.error(err);
          setError("לא ניתן לטעון את פרטי הבוגר");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !graduate) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <p className="text-destructive font-medium mb-4">
          {error || "בוגר לא נמצא"}
        </p>
        <Button onClick={() => navigate("/graduates")}>חזרה לרשימה</Button>
      </div>
    );
  }

  const canEdit = can("update", "graduates", graduate);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/graduates")}
          >
            <IconArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {graduate.first_name} {graduate.last_name}
            </h1>
            {graduate.student_code && (
              <p className="text-muted-foreground text-sm">
                קוד תלמיד: {graduate.student_code}
              </p>
            )}
          </div>
        </div>
        <div>
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/graduates/${graduate.id}/edit`)}
            >
              <IconPencil className="h-4 w-4 ml-2" />
              עריכה
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-8">
        {/* Header - Profile Completion */}
        <div className="pb-6 border-b">
          <ProfileCompletion graduate={graduate} />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Main Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">פרטי קשר</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">נייד:</span>
                <a
                  href={`tel:${graduate.phone}`}
                  className="hover:underline"
                  dir="ltr"
                >
                  {graduate.phone || "-"}
                </a>
              </div>
              {graduate.home_phone && (
                <div className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">בית:</span>
                  <a
                    href={`tel:${graduate.home_phone}`}
                    className="hover:underline"
                    dir="ltr"
                  >
                    {graduate.home_phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <IconMail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">אימייל:</span>
                <a
                  href={`mailto:${graduate.email}`}
                  className="hover:underline"
                >
                  {graduate.email || "-"}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              כתובת ומגורים
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">עיר:</span>
                <span>{graduate.city || "-"}</span>
              </div>
              <div className="flex items-start gap-2">
                <IconMapPin className="h-4 w-4 text-muted-foreground mt-1 opacity-0" />
                <span className="font-medium">כתובת:</span>
                <span>{graduate.address || "-"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              פרטים אישיים
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">מחזור:</span>
                <span>{graduate.shiur_year || "ללא מחזור"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconId className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ת.ז:</span>
                <span>{graduate.teudat_zehut || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCake className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">תאריך לידה:</span>
                <span>{graduate.birth_date || "-"}</span>
              </div>
            </div>
          </div>

          {graduate.notes && (
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold text-lg border-b pb-2">הערות</h3>
              <p className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md">
                {graduate.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
