# מדריך הגדרת תהליך עדכון אוטומטי (через Hostinger Git)

מדריך זה מסביר כיצד לחבר את GitHub ל-Hostinger כך שכל שינוי בקוד יתעדכן בשרת באופן אוטומטי, תוך שימוש בכלי ה-Git המובנה של Hostinger.

## צד שרת: הגדרה ב-Hostinger

1.  **הכנת התיקייה**:
    - הכלי של Hostinger דורש שהתיקייה אליה מתקינים תהיה **ריקה לחלוטין**.
    - היכנס ל-File Manager ומחוק/הזז קבצים מתיקיית `public_html` (או התיקייה שבה תרצה שהאתר ישב).

2.  **הגדרת המאגר (Repository)**:
    - בלוח הבקרה של Hostinger, חפש את הכלי **Git** (תחת הקטגוריה _Advanced_ או _Deployment_).
    - **Repository**: הזן את הכתובת:
      `https://github.com/yishai-gr/graduates-system.git`
      _(הערה: אם המאגר שלך פרטי, תצטרך להשתמש בכתובת ה-SSH ולהגדיר "Deploy Key" ב-GitHub, אך אם הוא ציבורי הכתובת הנ"ל מספיקה)._
    - **Branch**: כתוב `master` (או `main` - וודא מהו הענף הראשי שלך ב-GitHub).
    - **Directory**: השאר ריק כדי להתקין ישירות ל-`public_html`, או כתוב שם של תיקייה חדשה.
    - לחץ על **Create**.

3.  **העתקת ה-Webhook**:
    - לאחר היצירה, תראה את המאגר ברשימה למטה.
    - לחץ על כפתור **Auto Deployment** או חפש קישור שנקרא **Webhook URL**.
    - הקישור יראה בערך כך: `https://api.hostinger.com/git/webhook...`
    - העתק את הקישור הזה.

## צד GitHub: חיבור הטריגר

כעת נגדיר ל-GitHub "ללחוץ" על הקישור הזה בכל פעם שיש עדכון.

1.  היכנס ל-GitHub למאגר שלך.
2.  לך ל-**Settings** (הגדרות) > **Secrets and variables** > **Actions**.
3.  אם קיים כבר סוד בשם `HOSTINGER_WEBHOOK_URL`, עדכן אותו. אם לא, צור חדש:
    - לחץ **New repository secret**.
    - **Name**: `HOSTINGER_WEBHOOK_URL`
    - **Value**: הדבק כאן את הקישור שהעתקת מ-Hostinger.
    - לחץ **Add secret**.

## וזהו!

מעכשיו התהליך הוא כזה:

1.  אתה דוחף קוד (Push) ל-GitHub.
2.  GitHub מזהה שינוי ומפעיל את הפעולה `Deploy Backend`.
3.  הפעולה שולחת בקשה ל-Hostinger.
4.  Hostinger מושך (Pull) את הקוד החדש מהמאגר לשרת שלך באופן מיידי.

### הערה חשובה לגבי מבנה התיקיות

מכיוון שהמאגר שלך מכיל גם `backend` וגם `frontend`, בשרת שלך תראה כעת את המבנה המלא:

```
public_html/
├── backend/
├── frontend/
├── .github/
└── ...
```

וודא שהדומיין שלך מכוון לתיקייה הנכונה (למשל, אם ה-API שלך יושב ב-`backend`, הכתובת אליו תהיה `yourdomain.com/backend`).
