# מדריך לפריסת המערכת המלאה בהוסטינגר (Full Stack)

מדריך זה מסביר כיצד להגדיר את הפריסה של האתר המלא (צד לקוח + צד שרת) להוסטינגר, תוך שימוש ב-GitHub Actions שיצרנו.

## סקירה כללית

ה-Workflow שבנינו (`deploy.yml`) מבצע את הפעולות הבאות בכל דחיפה (Push) ל-`master`:

1. בונה את אפליקציית ה-React ( Frontend).
2. מכין את תיקיית ה-PHP (`API`).
3. מעתיק את קובץ ה-`.htaccess` הראשי שדואג להפניות.
4. דוחף את הכל לענף מיוחד בשם `hostinger-deploy`.

הוסטינגר יוגדר למשוך את הקבצים **רק מהענף הזה**.

## שלב 1: הכנת ה-Webhook בהוסטינגר

1. היכנס לממשק הניהול של Hostinger.
2. עבור לאזור **Advanced** -> **Git**.
3. אם קיים מאגר (Repository) קודם בתיקייה הראשית - **מחק אותו**. אנחנו צריכים להתחיל נקי.
4. הוסף מאגר חדש (Create Repository):
   - **Repository URL**: `https://github.com/yishai-gr/graduates-system.git`
   - **Branch**: `hostinger-deploy`
   - **Directory**: השאר ריק (כדי להתקין ב-`public_html` הראשי).
5. לחץ על **Create**.
   > **שים לב:** הפעם הראשונה עלולה להיכשל אם הענף `hostinger-deploy` עדיין לא קיים. אם זה קורה, בצע Push כלשהו ל-Master בגיטהאב, חכה שה-Action יסתיים וייצור את הענף, ואז נסה שוב.

## שלב 2: הגדרת עדכון אוטומטי (Auto-Deployment)

כדי שהאתר יתעדכן לבד:

1. ב-Hostinger, אחרי שיצרת את המאגר, תראה כפתור בשם **Auto Deployment** או קישור ל-**Webhook**.
2. העתק את כתובת ה-Webhook (URL).
3. לך ל-GitHub למאגר שלך -> **Settings** -> **Webhooks**.
4. לחץ **Add webhook**.
5. ב-Payload URL, הדבק את הכתובת שהעתקת מהוסטינגר.
6. ב-Content type בחר `application/json` (לרוב לא משנה, אבל עדיף).
7. וודא שמסומן **Just the push event**.
8. לחץ **Add webhook**.

## שלב 3: הגדרות צד שרת (Database ו-.env)

מכיוון ששינינו את המבנה, קבצי השרת נמצאים עכשיו בתוך תיקיית `API`.
הוסטינגר לא מעתיק את קבצי ה-`.env` מגיטהאב (הם חסויים). עליך ליצור אותם ידנית בשרת.

1. היכנס ל-File Manager בהוסטינגר.
2. נווט לתיקייה: `public_html/API`.
3. צור שם את קובץ ה-`.env` שלך.
4. הדבק את פרטי ההתחברות למסד הנתונים (Database) וכל המפתחות הסודיים.

## סיכום מבנה הקבצים בשרת

בסיום, השרת שלך ייראה כך:

- `/public_html/index.html` (האפליקציה של הלקוח)
- `/public_html/assets/...`
- `/public_html/.htaccess` (מנהל את ההפניות)
- `/public_html/API/` (ה-Backend שלנו)
- `/public_html/API/public/index.php` (נקודת הכניסה לשרת)
- `/public_html/API/.env` (הגדרות סודיות שהוספת ידנית)
