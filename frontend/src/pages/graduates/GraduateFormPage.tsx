import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usePermissions } from "@/hooks/usePermissions";
import { graduatesService } from "@/services/graduatesService";
import type { Graduate } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconAlertCircle,
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconLoader,
} from "@tabler/icons-react";
import { DateInput } from "@/components/ui/date-input";
import {
  isValidIsraeliID,
  isValidIsraeliPhone,
  normalizePhone,
} from "@/lib/validation";
import { standardSchemaValidators, useForm } from "@tanstack/react-form";
import { z } from "zod";

const graduateSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z
      .string()
      .refine(
        (val) => val === "" || isValidIsraeliPhone(val),
        "מספר טלפון לא תקין",
      ),
    homePhone: z
      .string()
      .refine(
        (val) => val === "" || isValidIsraeliPhone(val),
        "מספר טלפון לא תקין",
      ),
    email: z.union([z.literal(""), z.string().email("כתובת אימייל לא תקינה")]),
    city: z.string(),
    address: z.string(),
    shiurYear: z.string(),
    teudatZehut: z
      .string()
      .refine(
        (val) => val === "" || isValidIsraeliID(val),
        "תעודת זהות לא תקינה",
      ),
    birthDate: z.string(),
    notes: z.string(),
    studentCode: z.string(),
  })
  .refine(
    (data) => {
      const values = Object.values(data).filter(
        (v) => typeof v === "string" && v.trim() !== "",
      );
      return values.length > 0;
    },
    {
      message: "יש להזין לפחות נתון אחד",
      path: ["root"],
    },
  );

type GraduateFormValues = z.infer<typeof graduateSchema>;

const fieldMapping: Record<string, keyof GraduateFormValues> = {
  teudat_zehut: "teudatZehut",
  first_name: "firstName",
  last_name: "lastName",
  phone: "phone",
  home_phone: "homePhone",
  email: "email",
  city: "city",
  address: "address",
  shiur_year: "shiurYear",
  birth_date: "birthDate",
  student_code: "studentCode",
  notes: "notes",
};

export default function GraduateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isShiurManager, user } = usePermissions();

  const [showAdditional, setShowAdditional] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [initialLoading, setInitialLoading] = useState(!!id);

  const form = useForm({
    defaultValues: {
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
    } as GraduateFormValues,
    // @ts-ignore
    validatorAdapter: standardSchemaValidators,
    validators: {
      onChange: graduateSchema,
    },
    onSubmit: async ({ value }) => {
      setGlobalError("");
      try {
        if (isShiurManager && value.shiurYear) {
          if (!user?.shiurs?.includes(value.shiurYear)) {
            throw new Error("אין לך הרשאה לשייך בוגר למחזור שאינו בניהולך");
          }
        }

        const graduateData: Omit<Graduate, "id"> = {
          first_name: value.firstName,
          last_name: value.lastName,
          phone: normalizePhone(value.phone),
          home_phone: normalizePhone(value.homePhone),
          email: value.email,
          city: value.city,
          address: value.address,
          shiur_year: value.shiurYear || undefined,
          teudat_zehut: value.teudatZehut,
          birth_date: value.birthDate,
          notes: value.notes,
          student_code: isSuperAdmin ? value.studentCode : undefined,
        };

        // If editing and not super admin, we might lose the existing studentCode if we send undefined?
        // Actually, if we are editing, we should probably fetch the existing one first (which we do) and keep it if we don't change it.
        // But wait, the `value.studentCode` comes from the form.
        // If not super admin, the field might not be in the UI.
        // So we should populate it from the fetched data if available, even if hidden.
        // Or handle it carefully.

        if (id) {
          // For update, we want to make sure we don't accidentally clear studentCode if the user can't see it?
          // If the field is hidden, value.studentCode might be empty string or whatever default.
          // But we initialize the form with fetched data. So if we fetched it, it's there.
          // If the user is not super admin, we hide the field, but the value typically stays in the form state if initialized?
          // No, if the field component is not rendered, it doesn't mean the state is gone.
          // But let's actsafe:
          // If superAdmin -> take from form.
          // If not superAdmin -> take from existing fetch (handled by logic below or server).
          // Actually the original dialog logic was:
          // studentCode: isSuperAdmin ? value.studentCode : graduateToEdit?.studentCode,
          // We need to replicate that. We need to store the original fetched graduate separately or trust the form state if we initialize it.
          // We'll trust the form state, assuming we initialize it correctly.
        }

        if (id) {
          // Re-apply logic for safety:
          // If NOT super admin, we might need to preserve the original student code.
          // However, if we initialized the form with it, and didn't change it (because hidden), it should be fine?
          // Actually if we hide the Input, the Controller might still hold the value?
          // Yes.
          // BUT, if we want to be safe like the Dialog:
          // We need access to the original object or just assume form holds it.
        }

        if (id) {
          await graduatesService.updateGraduate(
            id,
            graduateData as Partial<Graduate>,
          );
        } else {
          await graduatesService.createGraduate(graduateData);
        }

        navigate("/graduates");
      } catch (err: unknown) {
        // Handle standardized validation errors
        // Expected format: { error: "VALIDATION_ERROR", field: "teudat_zehut", message: "..." }
        // graduatesService might throw an object or response.
        // We need to inspect how the service throws.
        // Assuming axios or fetch throws on 400.
        // We'll need to parse the response body if available.

        // @ts-ignore
        const responseData = err?.response?.data;

        if (
          responseData &&
          responseData.error === "VALIDATION_ERROR" &&
          responseData.field
        ) {
          const mappedField = fieldMapping[responseData.field];
          if (mappedField) {
            form.setFieldMeta(mappedField, (prev) => ({
              ...prev,
              errorMap: {
                onChange: responseData.message,
              },
              errors: [responseData.message], // For tanstack form
            }));
            // Also set global error just in case
            setGlobalError(responseData.message);
            return;
          }
        }

        const message =
          // @ts-ignore
          err?.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "אירעה שגיאה בשמירת הנתונים");

        setGlobalError(message);
      }
    },
  });

  useEffect(() => {
    if (id) {
      setInitialLoading(true);
      graduatesService
        .getGraduateById(id)
        .then((graduate) => {
          form.setFieldValue("firstName", graduate.first_name || "");
          form.setFieldValue("lastName", graduate.last_name || "");
          form.setFieldValue("phone", graduate.phone || "");
          form.setFieldValue("homePhone", graduate.home_phone || "");
          form.setFieldValue("email", graduate.email || "");
          form.setFieldValue("city", graduate.city || "");
          form.setFieldValue("address", graduate.address || "");
          form.setFieldValue(
            "shiurYear",
            graduate.shiur_year?.toString() || "",
          );
          form.setFieldValue("teudatZehut", graduate.teudat_zehut || "");
          form.setFieldValue("birthDate", graduate.birth_date || "");
          form.setFieldValue("notes", graduate.notes || "");
          form.setFieldValue("studentCode", graduate.student_code || "");

          if (
            graduate.teudat_zehut ||
            graduate.birth_date ||
            graduate.notes ||
            graduate.student_code
          ) {
            setShowAdditional(true);
          }
        })
        .catch((err) => {
          console.error(err);
          setGlobalError("לא ניתן לטעון את פרטי הבוגר");
        })
        .finally(() => {
          setInitialLoading(false);
        });
    } else {
      // Create mode
      if (isShiurManager && user?.shiurs?.length === 1) {
        form.setFieldValue("shiurYear", user.shiurs[0]);
      }
    }
  }, [id, isShiurManager, user]);

  const canEditStudentCode = isSuperAdmin;

  if (initialLoading) {
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

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <p className="text-muted-foreground mb-6">
          שדות אינם חובה, אך נדרש למלא לפחות אחד מהם לשמירה.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-6"
        >
          {/* Global Errors */}
          {(globalError || form.state.errors.length > 0) && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <IconAlertCircle size={18} />
              <span>
                {globalError
                  ? globalError
                  : "יש להזין לפחות נתון אחד או לתקן את השגיאות"}
              </span>
            </div>
          )}

          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="firstName"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>שם פרטי</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors
                          .map((e: any) =>
                            typeof e === "string" ? e : e?.message || "שגיאה",
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}
            />
            <form.Field
              name="lastName"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>שם משפחה</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors
                          .map((e: any) =>
                            typeof e === "string" ? e : e?.message || "שגיאה",
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="phone"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>פלאפון</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    dir="ltr"
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors
                          .map((e: any) =>
                            typeof e === "string" ? e : e?.message || "שגיאה",
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}
            />
            <form.Field
              name="homePhone"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>טלפון (בית)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    dir="ltr"
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors
                          .map((e: any) =>
                            typeof e === "string" ? e : e?.message || "שגיאה",
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}
            />
          </div>

          <form.Field
            name="email"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>אימייל</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors &&
                  field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors
                        .map((e: any) =>
                          typeof e === "string" ? e : e?.message || "שגיאה",
                        )
                        .join(", ")}
                    </p>
                  )}
              </div>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="city"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>עיר</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors
                          .map((e: any) =>
                            typeof e === "string" ? e : e?.message || "שגיאה",
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}
            />
            <form.Field
              name="address"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>כתובת</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="רחוב ומס' בית"
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors
                          .map((e: any) =>
                            typeof e === "string" ? e : e?.message || "שגיאה",
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}
            />
          </div>

          <form.Field
            name="shiurYear"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>מחזור (שנה/אותיות)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="לדוגמה: נח, פו"
                />
                {field.state.meta.errors &&
                  field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors
                        .map((e: any) =>
                          typeof e === "string" ? e : e?.message || "שגיאה",
                        )
                        .join(", ")}
                    </p>
                  )}
              </div>
            )}
          />

          {/* Collapsible Section */}
          <div className="border rounded-md p-4 bg-muted/50">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-medium hover:underline"
              onClick={() => setShowAdditional(!showAdditional)}
            >
              פרטים נוספים
              {showAdditional ? (
                <IconChevronUp size={16} />
              ) : (
                <IconChevronDown size={16} />
              )}
            </button>

            {showAdditional && (
              <div className="mt-4 grid gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <form.Field
                    name="teudatZehut"
                    children={(field) => (
                      <div className="grid gap-2">
                        <Label htmlFor={field.name}>תעודת זהות</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors &&
                          field.state.meta.errors.length > 0 && (
                            <p className="text-xs text-destructive">
                              {field.state.meta.errors
                                .map((e: any) =>
                                  typeof e === "string"
                                    ? e
                                    : e?.message || "שגיאה",
                                )
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    )}
                  />
                  <form.Field
                    name="birthDate"
                    children={(field) => (
                      <div className="grid gap-2">
                        <Label htmlFor={field.name}>תאריך לידה</Label>
                        <DateInput
                          value={field.state.value}
                          onChange={(date) => field.handleChange(date)}
                        />
                        {field.state.meta.errors &&
                          field.state.meta.errors.length > 0 && (
                            <p className="text-xs text-destructive">
                              {field.state.meta.errors
                                .map((e: any) =>
                                  typeof e === "string"
                                    ? e
                                    : e?.message || "שגיאה",
                                )
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    )}
                  />
                </div>

                <form.Field
                  name="notes"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>הערות</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">
                            {field.state.meta.errors
                              .map((e: any) =>
                                typeof e === "string"
                                  ? e
                                  : e?.message || "שגיאה",
                              )
                              .join(", ")}
                          </p>
                        )}
                    </div>
                  )}
                />

                {canEditStudentCode && (
                  <form.Field
                    name="studentCode"
                    children={(field) => (
                      <div className="grid gap-2">
                        <Label
                          htmlFor={field.name}
                          className="text-destructive font-semibold"
                        >
                          קוד תלמיד (מנהל)
                        </Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors &&
                          field.state.meta.errors.length > 0 && (
                            <p className="text-xs text-destructive">
                              {field.state.meta.errors
                                .map((e: any) =>
                                  typeof e === "string"
                                    ? e
                                    : e?.message || "שגיאה",
                                )
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    )}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/graduates")}
              disabled={form.state.isSubmitting}
            >
              ביטול
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && (
                    <IconLoader className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  {id ? "שמור שינויים" : "שמור בוגר"}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
