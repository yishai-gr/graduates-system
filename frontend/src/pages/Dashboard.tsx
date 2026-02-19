import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconSchool, IconUserCheck } from "@tabler/icons-react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ViewsService } from "@/services/viewsService";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalGraduates: 0,
    newGraduatesLastMonth: 0,
    totalUsers: 0,
    adminsCount: 0,
    coordinatorsCount: 0,
    myGraduates: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await ViewsService.getHomeView();
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  useDocumentTitle("לוח בקרה");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground">
          ברוך הבא למערכת ניהול הבוגרים, {user?.firstName}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {!isSuperAdmin && (
          <Card className="bg-blue-50/75 dark:bg-blue-950/20 border border-blue-500 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                הבוגרים שלי (בטיפול)
              </CardTitle>
              <IconUserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-[50px] mb-1 bg-blue-200 dark:bg-blue-800" />
              ) : (
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.myGraduates}
                </div>
              )}
              <p className="text-xs text-blue-700 dark:text-blue-300">
                במחזורים המשויכים לך
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-emerald-50/75 dark:bg-emerald-950/20 border border-emerald-500 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              סה"כ בוגרים במערכת
            </CardTitle>
            <IconSchool className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[50px] mb-1 bg-emerald-200 dark:bg-emerald-800" />
            ) : (
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {stats.totalGraduates}
              </div>
            )}
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              +{stats.newGraduatesLastMonth} בחודש האחרון
            </p>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card className="bg-purple-50/75 dark:bg-purple-950/20 border border-purple-500 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                סה"כ משתמשים
              </CardTitle>
              <IconUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-[50px] mb-1 bg-purple-200 dark:bg-purple-800" />
              ) : (
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.totalUsers}
                </div>
              )}
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {stats.adminsCount} מנהלים
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {stats.coordinatorsCount} אחראי שיעור
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>{/* <HebrewDatePickerDemo /> */}</div>

      {/* TODO: Activity Log (Mock) */}
      {false && isSuperAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">פעילות אחרונה במערכת</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        משתמש X עדכן את בוגר Y
                      </p>
                      <p className="text-xs text-muted-foreground">
                        לפני {i * 15} דקות
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
