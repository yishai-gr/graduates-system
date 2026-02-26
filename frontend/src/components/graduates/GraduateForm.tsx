import { useNavigate } from "react-router";
import { usePermissions } from "@/hooks/usePermissions";
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
import { getHebrewYears } from "@/lib/hebrewYears";
import { HebrewYearCombobox } from "@/components/users/HebrewYearCombobox";
import { useState } from "react";
import { toast } from "sonner";

const validHebrewYears = new Set(getHebrewYears(100, 5).map((y) => y.value));

export const graduateSchema = z
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
    shiurYear: z
      .string()
      .refine(
        (val) => val === "" || validHebrewYears.has(val),
        "יש לבחור שנה עברית תקינה מהרשימה",
      ),
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

export type GraduateFormValues = z.infer<typeof graduateSchema>;

interface GraduateFormProps {
  defaultValues: GraduateFormValues;
  onSubmit: (values: GraduateFormValues) => Promise<void>;
  isEditMode: boolean;
}

export function GraduateForm({
  defaultValues,
  onSubmit,
  isEditMode,
}: GraduateFormProps) {
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();

  const [showAdditional, setShowAdditional] = useState(
    !!(
      defaultValues.teudatZehut ||
      defaultValues.birthDate ||
      defaultValues.notes ||
      defaultValues.studentCode
    ),
  );
  const [globalError, setGlobalError] = useState("");

  const form = useForm({
    defaultValues,
    // @ts-ignore
    validatorAdapter: standardSchemaValidators,
    validators: {
      onChange: graduateSchema,
    },
    onSubmit: async ({ value }) => {
      setGlobalError("");
      try {
        await onSubmit(value);
      } catch (err: any) {
        console.error(err);
        const message =
          err?.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "אירעה שגיאה בשמירת הנתונים");
        setGlobalError(message);
        toast.error(message);
      }
    },
  });

  const canEditStudentCode = isSuperAdmin;

  return (
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
              <Label htmlFor={field.name}>מחזור (שנה עברית)</Label>
              <HebrewYearCombobox
                value={field.state.value}
                onChange={(val) => field.handleChange(val as string)}
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
                              typeof e === "string" ? e : e?.message || "שגיאה",
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
                {isEditMode ? "שמור שינויים" : "שמור בוגר"}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  );
}
