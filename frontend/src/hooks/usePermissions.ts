import { useAuth } from "@/context/AuthContext";

type Action = "create" | "read" | "update" | "delete";
type Resource = "users" | "graduates";

export function usePermissions() {
  const { user } = useAuth();

  const can = (action: Action, resource: Resource, data?: any): boolean => {
    if (!user) return false;

    if (user.role === "super_admin") {
      return true;
    }

    if (user.role === "shiur_manager") {
      if (resource === "users") {
        return false; // No access to users management
      }

      if (resource === "graduates") {
        if (action === "read") {
          // Can read all graduates (assigned to them or "orphan" or generally all if defined that way)
          // Based on specs: "צפייה: בכל הבוגרים המשויכים למחזורים שהוגדרו לו, ובבוגרים ללא מחזור"
          // However, simpler implementation might just allow read access to the page, and the list itself is filtered by the service/server.
          // For UI permission (can view the page):
          return true;
        }

        if (action === "create") {
          // Can create new graduate
          return true;
        }

        if (action === "update") {
          // Can update ONLY if graduate belongs to their shiur
          // data should be the Graduate object
          if (!data?.shiurYear && !data?.id) return false; // Safety check

          // Spec: "יכול לערוך את כל הבוגרים במחזור שלו"
          // Also spec: "יכול לשייך בוגר 'יתום'... ואז יהיה לו הרשאת עריכה עליו" (Logic implemented in service usually, but UI button visibility check here)
          if (!data?.shiurYear) return true; // Allow editing orphan to assign it? Or assuming "Assign" is an edit action.

          return user.shiurs?.includes(data.shiurYear) || false;
        }

        if (action === "delete") {
          return false;
        }
      }
    }

    return false;
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isShiurManager = user?.role === "shiur_manager";

  return { can, isSuperAdmin, isShiurManager, user };
}
