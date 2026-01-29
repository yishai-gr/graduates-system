import { useAuth } from "@/context/AuthContext";

type Action = "create" | "read" | "update" | "delete" | "import";
type Resource = "users" | "graduates";

export function usePermissions() {
  const { user } = useAuth();

  const can = (action: Action, resource: Resource, data?: any): boolean => {
    if (!user) return false;

    // Super admin override
    if (user.role === "super_admin") return true;

    // Import is only for super_admin, so if not super_admin and action is import, return false
    if (action === "import") return false;

    // Construct permission key, e.g., "graduate:read"
    // Handle singular/plural mismatch if needed. Resource is "graduates" or "users".
    // PHP keys are "graduate:..." and "user:..." (singular)
    const resourceMap: Record<string, string> = {
      graduates: "graduate",
      users: "user",
    };

    const resourceKey = resourceMap[resource] || resource;
    const permissionKey = `${resourceKey}:${action}`;

    // Check if user has the basic permission
    if (!user.permissions?.includes(permissionKey)) {
      return false;
    }

    // Role-specific/Data-specific refinements
    if (
      user.role === "shiur_manager" &&
      resource === "graduates" &&
      action === "update"
    ) {
      // Extra check for shiur manager updating graduates: only their shiur or orphans
      if (!data?.shiurYear && !data?.id) return true; // Allow if creating/unknown? Or strict?
      // Original logic: "if (!data?.shiurYear) return true;" (Orphan)
      if (!data?.shiurYear) return true;
      return user.shiurs?.includes(data.shiurYear) || false;
    }

    return true;
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isShiurManager = user?.role === "shiur_manager";

  return { can, isSuperAdmin, isShiurManager, user };
}
