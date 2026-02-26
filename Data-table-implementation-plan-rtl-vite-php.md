# 📊 תוכנית מימוש – מערכת טבלה מתקדמת (RTL)

## Stack

- Vite + React (SPA)
- PHP REST API
- TanStack Table v8
- TanStack Query
- shadcn/ui
- TailwindCSS
- RTL מלא

---

# 1️⃣ מטרות המערכת

מערכת להצגת נתונים עם:

- Server-side Pagination
- Server-side Sorting
- Server-side Filtering (מתקדם)
- בחירת כמות רשומות לעמוד
- הצגת עמוד נוכחי + סה"כ עמודים
- הצגת סה"כ רשומות
- RTL מלא
- התאמה מלאה למובייל

⚠️ במובייל אין תצוגת טבלה.
במסכים קטנים הנתונים יוצגו ככרטיסים (Card View) ולא כטבלה.

---

# 2️⃣ ארכיטקטורה כללית

User Interaction
↓
Table State Update
↓
React Query Refetch
↓
PHP API
↓
JSON Response
↓
Render (Desktop = Table / Mobile = Cards)

---

# 3️⃣ מבנה תיקיות מומלץ

src/
├── components/
│ ├── table/
│ │ ├── DataTable.tsx
│ │ ├── DataTableToolbar.tsx
│ │ ├── DataTablePagination.tsx
│ │ ├── MobileCardsView.tsx
│ │ ├── columns.ts
│ │ └── types.ts
│
├── hooks/
│ └── useTableData.ts
│
├── services/
│ └── usersService.ts (מבוסס על apiClient.ts הקיים)
│
├── pages/
│ └── UsersPage.tsx
│
└── main.tsx

---

# 4️⃣ מבנה API ב-PHP

## Request

GET /api/users
?page=1
&pageSize=20
&sort=name
&order=asc
&filters[name]=avi
&filters[status]=active

## Response

{
"data": [...],
"total": 248,
"page": 1,
"pageSize": 20,
"pages": 13
}

השרת אחראי על:

- LIMIT / OFFSET
- WHERE דינמי לפי filters
- ORDER BY
- חישוב total

---

# 5️⃣ State בטבלה

{
pageIndex,
pageSize,
sorting,
columnFilters,
globalFilter
}

כל שינוי ב-state → גורר refetch אוטומטי דרך React Query.

---

# 6️⃣ useTableData Hook

אחראי על:

- בניית queryKey
- קריאה ל-API
- החזרת data + total + pages
- טיפול ב-loading ו-error
- keepPreviousData לשיפור UX

Debounce של 300ms לחיפוש חופשי.

---

# 7️⃣ DataTable (Desktop בלבד)

במסכים בינוניים ומעלה בלבד.

הגדרות קריטיות:

- manualPagination: true
- manualSorting: true
- manualFiltering: true
- pageCount מחושב מהשרת

הטבלה משתמשת ב-shadcn Table components.

---

# 8️⃣ Mobile View – Card Layout

במסכים קטנים (sm ומטה):

אין Table בכלל.

במקום זאת:

- כל רשומה מוצגת כ-Card
- שימוש ב-shadcn Card
- כפתורי פעולה בתוך הכרטיס
- פריסה אנכית
- ריווח גדול ונוח ללחיצה

מבנה כרטיס:

- שדה ראשי ככותרת
- שדות משניים כ-label/value
- פעולות בתחתית

Pagination נשארת רגילה (Prev / Next בלבד במובייל).

---

# 9️⃣ Toolbar – סינון מתקדם

כולל:

- Input לחיפוש חופשי
- Select לפילטרים
- Date range (אופציונלי)
- כפתור איפוס

במובייל:

- פילטרים בתוך Drawer / Modal
- לא מוצגים בשורה אופקית

---

# 🔟 Pagination

Desktop:

- בחירת pageSize
- כפתורי מספרי עמודים
- עמוד X מתוך Y
- סה"כ רשומות

Mobile:

- Prev
- Next
- תצוגת עמוד נוכחי בלבד
- ללא כפתורי מספרים

---

# 11️⃣ RTL

index.html:

<html dir="rtl">

אין צורך בהתאמות מיוחדות ל-TanStack.

יש לוודא:

- text-right
- יישור כפתורים בהתאם
- אייקונים מותאמים לכיוון

---

# 12️⃣ ביצועים

- תמיד Server-side pagination
- לא לטעון אלפי רשומות לקליינט
- keepPreviousData
- Skeleton rows במקום קפיצות
- Disable כפתורים בזמן טעינה

---

# 13️⃣ הרחבות עתידיות

- Column visibility toggle
- Export ל-CSV
- Bulk selection
- Row actions
- Virtualization (אם pageSize גדול)

---

# 14️⃣ עקרונות קוד

- לוגיקה מופרדת מ-UI
- כל קריאות ה-API דרך שירותים קיימים ב-`src/services/` (כגון `usersService.ts` באמצעות `ApiClient`)
- אין שמירת data ב-global state
- state נשלט דרך table instance בלבד
- רכיבים קטנים ומודולריים

---

# 15️⃣ סיכום

המערכת תעבוד כך:

Desktop → טבלה מלאה
Mobile → כרטיסים

כל הנתונים מנוהלים בשרת.
הקליינט אחראי רק על תצוגה וניהול state.

התוצאה:

- ביצועים גבוהים
- חוויית משתמש מותאמת מכשיר
- קוד נקי וניתן להרחבה
- התאמה מלאה ל-RTL

---

# 16️⃣ דוגמאות קוד מלאות

## services/usersService.ts (התאמות לשירות הקיים)

יש להרחיב את הפונקציה `getUsers` בשירות הקיים כך שתתמוך בפרמטרים הנוספים:

```ts
import type { User, PaginatedResponse, FilterParams } from "@shared/types";
import { ApiClient } from "./apiClient";

export interface TableQueryParams extends FilterParams {
  pageIndex?: number;
  pageSize?: number;
  sorting?: { id: string; desc: boolean }[];
  globalFilter?: string;
}

class UsersService {
  async getUsersForTable(
    params: TableQueryParams,
  ): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams();

    if (params.pageIndex !== undefined)
      query.append("page", String(params.pageIndex + 1));
    if (params.pageSize) query.append("limit", String(params.pageSize));

    if (params.sorting?.length) {
      query.append("sort", params.sorting[0].id);
      query.append("order", params.sorting[0].desc ? "desc" : "asc");
    }

    if (params.globalFilter) {
      query.append("search", params.globalFilter);
    }

    // הוספת פילטרים דינמיים נוספים אם צריך

    return ApiClient.get<PaginatedResponse<User>>(`/users?${query.toString()}`);
  }
}

export const usersService = new UsersService();
```

---

## hooks/useTableData.ts

```ts
import { useQuery } from "@tanstack/react-query";
import { usersService, TableQueryParams } from "@/services/usersService";

export function useTableData(state: TableQueryParams) {
  return useQuery({
    queryKey: ["users", state],
    queryFn: () => usersService.getUsersForTable(state),
    // React Query v5 KeepPreviousData התעדכן ל- placeholderData: keepPreviousData
  });
}
```

---

## components/table/columns.ts

```ts
import { ColumnDef } from "@tanstack/react-table";

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "שם",
  },
  {
    accessorKey: "email",
    header: "אימייל",
  },
  {
    accessorKey: "status",
    header: "סטטוס",
  },
];
```

---

## DataTable.tsx (Desktop)

```tsx
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns } from "./columns";
import { useTableData } from "@/hooks/useTableData";

export function DataTable({ state, setState }: any) {
  const { data, isLoading } = useTableData(state);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.pages ?? -1,
    state,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: (updater) =>
      setState((old: any) => ({ ...old, ...updater(old) })),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.columnDef.header}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length}>טוען...</TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{cell.renderValue()}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## MobileCardsView.tsx

```tsx
import { Card, CardContent } from "@/components/ui/card";

export function MobileCardsView({ data }: any) {
  return (
    <div className="grid gap-4 md:hidden">
      {data.map((user: any) => (
        <Card key={user.id}>
          <CardContent className="space-y-2 p-4">
            <div className="text-lg font-bold">{user.name}</div>
            <div>אימייל: {user.email}</div>
            <div>סטטוס: {user.status}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

# 17️⃣ תרשימי ארכיטקטורה מפורטים

## Flow ל-Server-side Filtering

User types search
↓
Update globalFilter
↓
Debounce (300ms)
↓
React Query refetch
↓
GET /api/users?search=...
↓
PHP builds WHERE clause
↓
Return paginated result
↓
Render Table / Cards

---

## מבנה לוגי של קומפוננטות

UsersPage
├── DataTableToolbar
├── DataTable (Desktop)
├── MobileCardsView (Mobile)
└── DataTablePagination

---

# 18️⃣ שלבי מימוש מסודרים

שלב 1 – התקנת חבילות חסרות (והסתמכות על הקיימות)

- `npm i @tanstack/react-table` (יש להתקין)
- `npm i @tanstack/react-query` (יש להתקין)
- רכיבי `shadcn/ui` (כבר מותקנים בפרויקט ב-`src/components/ui`)
- תלויות נוספות (React, Vite, PHP, Tailwind) כבר קיימות ומקונפגות.

שלב 2 – בניית API PHP תומך pagination + filters

שלב 3 – יצירת useTableData

שלב 4 – יצירת columns

שלב 5 – בניית DataTable Desktop

שלב 6 – בניית MobileCardsView

שלב 7 – בניית Pagination

שלב 8 – חיבור הכל ב-UsersPage

שלב 9 – בדיקות מובייל ו-RTL

שלב 10 – אופטימיזציות ביצועים

---

# 19️⃣ Checklist סופי למפתח

☐ API מחזיר total + pages
☐ manualPagination פעיל
☐ manualSorting פעיל
☐ manualFiltering פעיל
☐ keepPreviousData מופעל
☐ Debounce לחיפוש
☐ Table מוסתרת במובייל
☐ Cards מוצגים רק במובייל
☐ Pagination מותאמת מובייל
☐ dir="rtl" מוגדר
☐ Empty state
☐ Error state
☐ Loading state

---

# 🎯 תוצאה סופית

מערכת טבלה מקצועית ברמת Production:

Desktop → טבלה מלאה מתקדמת
Mobile → כרטיסים רספונסיביים
Server → אחראי על כל הלוגיקה של נתונים
Client → אחראי על תצוגה וניהול state בלבד

קוד מודולרי, קריא, ניתן להרחבה ולתחזוקה לאורך זמן.
