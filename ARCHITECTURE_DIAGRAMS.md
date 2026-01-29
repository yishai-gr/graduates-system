# CSV/Excel Import Feature - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/TypeScript)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ImportPage.tsx                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. File Upload Component                                 │   │
│  │    - Drag & Drop                                         │   │
│  │    - Click to Browse                                     │   │
│  │    - File Validation (type, size)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. Preview Display                                       │   │
│  │    - Valid Rows (ready to import)                        │   │
│  │    - Error Rows (validation failures)                    │   │
│  │    - Duplicate Rows (existing matches)                   │   │
│  │    - Summary Stats                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. Confirmation Dialog                                   │   │
│  │    - Review Import Count                                 │   │
│  │    - Confirm Action                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. Results Page                                          │   │
│  │    - Success Message (count imported)                    │   │
│  │    - Failure Details (if any)                            │   │
│  │    - Navigation Options                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  importService.ts (API Client)                                   │
│  └─ previewImport(file) → POST /api/v1/graduates/import/preview│
│  └─ confirmImport(data) → POST /api/v1/graduates/import/confirm│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (PHP)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  index.php (Router)                                              │
│  ├─ Route: POST /graduates/import/preview                        │
│  └─ Route: POST /graduates/import/confirm                        │
│                      │                                            │
│                      ▼                                            │
│  AuthMiddleware.php                                              │
│  ├─ Extract JWT Token                                            │
│  ├─ Decode & Validate                                            │
│  ├─ Set $_SERVER['user_role'] & $_SERVER['user_id']             │
│  └─ Verify super_admin role                                      │
│                      │                                            │
│                      ▼                                            │
│  ImportController.php                                            │
│                                                                   │
│  preview() Method:                                               │
│  ├─ 1. Validate File (type, size)                               │
│  ├─ 2. Parse File (PhpSpreadsheet)                              │
│  ├─ 3. Extract Headers & Map Fields                             │
│  ├─ 4. Validate Each Row                                        │
│  │    ├─ Check Required Fields                                  │
│  │    ├─ Validate Israeli ID (Luhn)                             │
│  │    ├─ Validate Email Format                                  │
│  │    └─ Validate Phone (9-10 digits)                           │
│  ├─ 5. Detect Duplicates (ID, Email, Name)                      │
│  └─ 6. Return Preview JSON                                      │
│                                                                   │
│  confirm() Method:                                               │
│  ├─ 1. Begin Transaction                                        │
│  ├─ 2. For Each Valid Row:                                      │
│  │    ├─ Re-validate Data                                       │
│  │    ├─ Check for Duplicates Again                             │
│  │    └─ Insert into Database                                   │
│  ├─ 3. On Success: COMMIT                                       │
│  ├─ 4. On Error: ROLLBACK                                       │
│  └─ 5. Return Results JSON                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MySQL)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Table: graduates                                                │
│  ├─ id (INT, Primary Key)                                        │
│  ├─ first_name, last_name                                        │
│  ├─ email, phone, home_phone                                     │
│  ├─ teudat_zehut (for duplicate checking)                       │
│  ├─ shiur_year, city, address                                    │
│  ├─ birth_date, student_code, notes                              │
│  ├─ created_at, updated_at                                       │
│  ├─ deleted_at (soft delete, preserved)                          │
│  └─ Indexes: (teudat_zehut), (email), (first_name, last_name)   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
                        ┌─────────────────┐
                        │  Admin Upload   │
                        │  CSV/Excel File │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Frontend Validation   │
                    │  - File Type Check    │
                    │  - File Size Check    │
                    │  - Show Error or OK   │
                    └────────┬───────────────┘
                             │
                             ▼ Preview Request
                    ┌────────────────────────┐
                    │  Backend: Parse File  │
                    │  - Read CSV/Excel    │
                    │  - Extract Headers   │
                    │  - Map Fields        │
                    └────────┬───────────────┘
                             │
                             ▼
                    ┌────────────────────────┐
                    │  Validate Each Row     │
                    │  ├─ Check Fields      │
                    │  ├─ Validate ID       │
                    │  ├─ Validate Email    │
                    │  └─ Validate Phone    │
                    └────────┬───────────────┘
                             │
                    ┌────────┴───────────┐
                    │                    │
                    ▼                    ▼
            ┌──────────────┐      ┌──────────────┐
            │ Check for    │      │   Return    │
            │ Duplicates   │      │  Preview to │
            │ (ID/Email)   │      │  Frontend   │
            └──────┬───────┘      └──────┬───────┘
                   │                     │
                   ▼                     ▼
         ┌─────────────────────────────────────────┐
         │  Frontend: Display Preview              │
         │  ┌──────────────────────────────────┐  │
         │  │ Valid Rows: 3                    │  │
         │  │ - Row 1: يوحنان כהן              │  │
         │  │ - Row 2: מרים לוי               │  │
         │  │ - Row 3: דוד רחמן               │  │
         │  └──────────────────────────────────┘  │
         │  ┌──────────────────────────────────┐  │
         │  │ Duplicates: 1                    │  │
         │  │ - Row 4: שרה ביטון (by email)   │  │
         │  └──────────────────────────────────┘  │
         │  ┌──────────────────────────────────┐  │
         │  │ Errors: 0                        │  │
         │  └──────────────────────────────────┘  │
         └─────────────────────────────────────────┘
                             │
                    (Admin Confirms)
                             │
                             ▼
                    ┌────────────────────────┐
                    │ Confirm Request        │
                    │ {rowsToImport: [...]}  │
                    └────────┬───────────────┘
                             │
                             ▼
                    ┌────────────────────────┐
                    │ Backend: Start Txn     │
                    │ BEGIN TRANSACTION      │
                    └────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │ For Each     │          │   Validate   │
        │ Valid Row:   │          │   Again      │
        │              │          └──────┬───────┘
        │ 1. Validate  │                 │
        │ 2. Check Dup │◄────────────────┘
        │ 3. Insert    │
        └──────┬───────┘
               │
        ┌──────┴──────┐
        │             │
        ▼ Success     ▼ Error
    ┌────────┐  ┌──────────┐
    │ COMMIT │  │ ROLLBACK │
    │        │  │          │
    │ All    │  │ All      │
    │ Rows   │  │ Changes  │
    │ Added  │  │ Undone   │
    └────┬───┘  └────┬─────┘
         │           │
         └────┬──────┘
              │
              ▼
    ┌──────────────────────┐
    │ Return Results JSON  │
    │ {                    │
    │   imported: 3,       │
    │   failed: 0,         │
    │   failedRows: []     │
    │ }                    │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Display Results Page │
    │ ✓ Success!           │
    │ 3 records imported   │
    └──────────────────────┘
```

---

## Validation Flow

```
                    ┌──────────────────┐
                    │   Input Row      │
                    │ From CSV/Excel   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────────────────┐
                    │ 1. At Least One Field?       │
                    └────────┬────────────┬────────┘
                             │ Yes        │ No
                             │            ▼
                             │         ┌────────┐
                             │         │ ERROR: │
                             │         │ Empty  │
                             │         │ Row    │
                             │         └────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │ 2. Validate Israeli ID?        │
            │    (if provided)               │
            │    Luhn Checksum               │
            └────────┬──────────────┬────────┘
                     │ Valid        │ Invalid
                     │              ▼
                     │           ┌────────┐
                     │           │ ERROR: │
                     │           │ Bad ID │
                     │           └────────┘
                     │
                     ▼
            ┌────────────────────────────────┐
            │ 3. Validate Email?             │
            │    (if provided)               │
            │    Format Check                │
            └────────┬──────────────┬────────┘
                     │ Valid        │ Invalid
                     │              ▼
                     │           ┌────────┐
                     │           │ ERROR: │
                     │           │ Bad    │
                     │           │ Email  │
                     │           └────────┘
                     │
                     ▼
            ┌────────────────────────────────┐
            │ 4. Validate Phone?             │
            │    (if provided)               │
            │    Normalize & Check Digits    │
            └────────┬──────────────┬────────┐
                     │ Valid        │ Invalid│
                     │              ▼        │
                     │           ┌────────┐ │
                     │           │ ERROR: │ │
                     │           │ Bad    │ │
                     │           │ Phone  │ │
                     │           └────────┘ │
                     │                      │
                     ├──────────────────────┘
                     │
                     ▼
            ┌────────────────────────────────┐
            │ 5. Check for Duplicates?       │
            │    By: ID / Email / Name       │
            └────────┬──────────────┬────────┘
                     │ Unique       │ Duplicate
                     │              ▼
                     │         ┌──────────────┐
                     │         │ WARNING:     │
                     │         │ Duplicate    │
                     │         │ (Excluded)   │
                     │         └──────────────┘
                     │
                     ▼
         ┌─────────────────────────────┐
         │ ✓ VALID ROW                 │
         │ Ready to Import             │
         └─────────────────────────────┘
```

---

## Error Handling Flow

```
                    ┌─────────────────┐
                    │ Error Detected  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐   ┌──────────────┐
            │ Preview      │   │ During       │
            │ Stage        │   │ Import       │
            └──────┬───────┘   └──────┬───────┘
                   │                  │
                   ▼                  ▼
        ┌─────────────────┐  ┌──────────────────┐
        │ Categorize:     │  │ Is During Txn?   │
        │ - Validation    │  └────────┬─────┬───┘
        │ - Duplicate     │           │ Yes │ No
        │ - File Error    │           │     │
        └────────┬────────┘           │     ▼
                 │                    │  ┌─────────┐
                 ▼                    │  │ Continue│
        ┌──────────────────┐          │  │ Insert  │
        │ Return Preview   │          │  └─────────┘
        │ Response:        │          │
        │ - errorRows[]    │          ▼
        │ - duplicateRows[]│     ┌──────────────┐
        │                 │     │ ROLLBACK     │
        └────────┬────────┘     │ Transaction  │
                 │              └──────┬───────┘
                 ▼                     │
        ┌──────────────────┐           ▼
        │ Frontend Displays│      ┌──────────────┐
        │ - Valid Rows     │      │ Return Error │
        │ - Error Details  │      │ Response     │
        │ - Suggestions    │      └──────┬───────┘
        └────────┬─────────┘             │
                 │                       ▼
                 │              ┌──────────────────┐
                 │              │ Frontend Shows   │
                 │              │ Failed Rows      │
                 │              │ Details          │
                 │              └──────┬───────────┘
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ User Action:     │
                    │ - Fix File       │
                    │ - Retry Upload   │
                    │ - Go Back        │
                    └──────────────────┘
```

---

## File Format Support

```
┌─────────────────────────────────────────────┐
│         Supported File Formats              │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ Excel Files                              │
│    - .xlsx (Office Open XML)                │
│    - .xls (Office 97-2003)                  │
│    Max Size: 5MB                            │
│    Parsed by: PhpSpreadsheet                │
│                                             │
│  ✓ CSV Files                                │
│    - .csv (Comma-Separated Values)          │
│    Max Size: 5MB                            │
│    Parsed by: PhpSpreadsheet                │
│    Supports: UTF-8, Different Delimiters    │
│                                             │
│  ✓ Header Recognition                       │
│    Row 1: Field Names (in any language)     │
│    Row 2+: Data Rows                        │
│                                             │
│  ✓ Field Mapping                            │
│    Intelligent matching of variations       │
│    English, Hebrew, and numeric names       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Permission Model

```
                    ┌──────────────┐
                    │   User Role  │
                    └──────┬───────┘
                           │
           ┌───────────────┴────────────────┐
           │                                │
           ▼                                ▼
    ┌─────────────┐               ┌─────────────┐
    │ super_admin │               │    Other    │
    └──────┬──────┘               │  Roles      │
           │                      └──────┬──────┘
           ▼                             │
    ✓ Can Access Import Page            │
    ✓ Can Upload Files                  ▼
    ✓ Can See Preview                   ✗ Access Denied
    ✓ Can Confirm Import                ✗ Shown Error
    ✓ Can See Navigation Link           ✗ Nav Hidden

    Backend Checks:
    1. Frontend: Permission hook checks role
    2. Backend: AuthMiddleware sets $_SERVER['user_role']
    3. Controller: Verifies $_SERVER['user_role'] === 'super_admin'
```

---

## Component Hierarchy

```
App.tsx
└── Routes
    ├── /login → LoginPage
    ├── /graduates → GraduatesPage
    ├── /graduates/import → ImportPage ◄─── NEW
    │   └── ImportPage.tsx
    │       ├── UploadForm
    │       │   ├── DragDropZone
    │       │   └── FileInput
    │       ├── Preview
    │       │   ├── ValidRowsSection
    │       │   ├── ErrorRowsSection
    │       │   └── DuplicateRowsSection
    │       ├── ConfirmDialog
    │       │   └── AlertDialog
    │       └── ResultsPage
    │           ├── SuccessMessage | FailureMessage
    │           └── ActionButtons
    │
    └── MainLayout
        └── AppSidebar ◄─── MODIFIED
            ├── Navigation Links
            │   └── yyבוא בוגרים ◄─── NEW LINK (super_admin only)
            └── User Menu
```

---

## Summary

This architecture provides:
- **Security**: Multi-level permission checks
- **Reliability**: Transactional database operations
- **Usability**: Intuitive UI with preview and confirmation
- **Validation**: Comprehensive data validation pipeline
- **Error Handling**: Clear error messages and recovery options
- **Scalability**: Efficient processing with proper indexing
