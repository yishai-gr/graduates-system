import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { graduatesService } from "@/services/graduatesService";
import type { Graduate } from "@shared/types";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
  IconLoader,
  IconAlertCircle,
} from "@tabler/icons-react";
import { normalizePhone } from "@/lib/validation";
import {
  GraduateForm,
  type GraduateFormValues,
} from "@/components/graduates/GraduateForm";

export default function GraduateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isShiurManager, user } = usePermissions();

  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState<GraduateFormValues>({
    firstName: "",
    lastName: "",
    phone: "",
    homePhone: "",
    email: "",
    city: "",
    address: "",
    shiurYear: "",
    teudatZehut: "",
    birthDate: "",
    notes: "",
    studentCode: "",
  });

  useDocumentTitle(id ? "עריכת בוגר" : "רישום בוגר");

  useEffect(() => {
    if (id) {
      graduatesService
        .getGraduateById(id)
        .then((graduate) => {
          setInitialValues({
            firstName: graduate.first_name || "",
            lastName: graduate.last_name || "",
            phone: graduate.phone || "",
            homePhone: graduate.home_phone || "",
            email: graduate.email || "",
            city: graduate.city || "",
            address: graduate.address || "",
            shiurYear: graduate.shiur_year?.toString() || "",
            teudatZehut: graduate.teudat_zehut || "",
            birthDate: graduate.birth_date || "",
            notes: graduate.notes || "",
            studentCode: graduate.student_code || "",
          });
        })
        .catch((err) => {
          console.error(err);
          setError("לא ניתן לטעון את פרטי הבוגר");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Create mode default values
      if (isShiurManager && user?.shiurs?.length === 1) {
        setInitialValues((prev) => ({
          ...prev,
          shiurYear: user.shiurs?.[0] || "",
        }));
      }
    }
  }, [id, isShiurManager, user]);

  const handleSubmit = async (values: GraduateFormValues) => {
    if (isShiurManager && values.shiurYear) {
      if (!user?.shiurs?.includes(values.shiurYear)) {
        throw new Error("אין לך הרשאה לשייך בוגר למחזור שאינו בניהולך");
      }
    }

    const graduateData: Omit<Graduate, "id"> = {
      first_name: values.firstName,
      last_name: values.lastName,
      phone: normalizePhone(values.phone),
      home_phone: normalizePhone(values.homePhone),
      email: values.email,
      city: values.city,
      address: values.address,
      shiur_year: values.shiurYear || undefined,
      teudat_zehut: values.teudatZehut,
      birth_date: values.birthDate,
      notes: values.notes,
      student_code: isSuperAdmin ? values.studentCode : undefined,
    };

    if (id) {
      await graduatesService.updateGraduate(
        id,
        graduateData as Partial<Graduate>,
      );
    } else {
      await graduatesService.createGraduate(graduateData);
    }
    navigate("/graduates");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/graduates")}
        >
          <IconArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {id ? "עריכת פרטי בוגר" : "רישום בוגר חדש"}
        </h1>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <IconAlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : (
        <GraduateForm
          defaultValues={initialValues}
          onSubmit={handleSubmit}
          isEditMode={!!id}
        />
      )}
    </div>
  );
}
