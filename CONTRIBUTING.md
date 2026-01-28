# תרומה למערכת הבוגרים

תודה על ההתעניינות בתרומה לפרויקט מערכת הבוגרים!

## ✅ דרישות קדם (Prerequisites)

לפני שתתחילו, וודאו שמותקנים אצלכם הכלים הבאים:

- **Node.js** (גרסה 18 ומעלה)
- **PHP** (גרסה 8.1 ומעלה)
- **Composer** (מנהל חבילות ל-PHP)
- **MySQL** (מסד נתונים)
- **Git**

## 🚀 הגדרת סביבת פיתוח

### 1. שכפול המאגר (Clone)

```bash
git clone https://github.com/yishai-gr/graduates-system.git
cd graduates-system
```

### 2. הגדרת צד שרת (Backend)

היכנסו לתיקיית ה-backend:

```bash
cd backend
```

התקנת תלויות PHP:

```bash
composer install
```

**הגדרות:**

1. העתיקו את קובץ `.env.example` ל-`.env`:
   ```bash
   cp .env.example .env
   # או ב-Windows: copy .env.example .env
   ```
2. עדכנו את קובץ ה-`.env` עם פרטי התחברות למסד הנתונים המקומי שלכם.

**מסד נתונים (Database):**

- צרו מסד נתונים חדש ב-MySQL.
- ייבאו את הסכמה הראשונית (אם קיימת ב-`database/`) או הריצו מיגרציות.

הפעלת שרת פיתוח מקומי של PHP (או השתמשו ב-XAMPP/WAMP):

```bash
# מפעיל את ה-API בכתובת http://localhost:8000
php -S localhost:8000 -t public
```

### 3. הגדרת צד לקוח (Frontend)

פתחו טרמינל חדש והיכנסו לתיקיית ה-frontend:

```bash
cd frontend
```

התקנת תלויות Node.js:

```bash
npm install
```

הפעלת שרת הפיתוח:

```bash
npm run dev
```

האפליקציה אמורה לרוץ כעת בכתובת `http://localhost:5173` (או בפורט שמוצג בטרמינל).

## 🤝 תהליך העבודה

1. **Branch**: צרו ענף חדש עבור הפיצ'ר או התיקון שלכם.
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Commit**: בצעו שינויים ושמרו אותם עם הודעות ברורות.
   ```bash
   git commit -m "feat: Add new search filter"
   ```
3. **Push**: דחפו את הענף ל-GitHub.
   ```bash
   git push origin feature/my-new-feature
   ```
4. **Pull Request**: פתחו Pull Request (PR) מול ענף ה-`master`.

## 📝 סטנדרטים לכתיבת קוד

- **Frontend**: עקבו אחר ה-Best Practices של React. השתמשו ב-Functional Components ו-Hooks. הקפידו על הגדרת טיפוסים (Types) ב-TypeScript.
- **Backend**: הקפידו על כתיבת קוד לפי תקן PSR-12 של PHP.

תודה על תרומתכם!
