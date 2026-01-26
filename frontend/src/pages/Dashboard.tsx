import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconSchool, IconUserCheck } from "@tabler/icons-react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function Dashboard() {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();

  // Mock Stats
  const [stats, setStats] = useState({
    totalGraduates: 0,
    totalUsers: 0,
    myGraduates: 0,
  });

  useEffect(() => {
    // In real app, fetch from stats service.
    // Simulating here:
    setTimeout(() => {
      setStats({
        totalGraduates: 1250, // Mock number
        totalUsers: 5,
        myGraduates: 45, // Mock for shiur manager
      });
    }, 500);
  }, []);

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                הבוגרים שלי (בטיפול)
              </CardTitle>
              <IconUserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myGraduates}</div>
              <p className="text-xs text-muted-foreground">
                במחזורים המשויכים לך
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              סה"כ בוגרים במערכת
            </CardTitle>
            <IconSchool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGraduates}</div>
            <p className="text-xs text-muted-foreground">+20 בחודש האחרון</p>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                סה"כ משתמשים
              </CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                מנהלים ואחראי שיעור
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
