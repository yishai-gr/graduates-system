# CSV/Excel Import Feature - Implementation Guide

## Overview
A comprehensive bulk import feature has been implemented allowing super_admin users to import graduate records from Excel (.xlsx, .xls) or CSV files with complete validation, duplicate detection, and error reporting.

## Features

### ✅ Core Features Implemented

1. **File Upload & Parsing**
   - Support for Excel (.xlsx, .xls) and CSV formats
   - Drag-and-drop interface with file size validation (5MB max)
   - Automatic header mapping with intelligent field recognition

2. **Data Validation**
   - Israeli ID validation using Luhn checksum algorithm
   - Email format validation
   - Phone number validation (9-10 digits after normalization)
   - Required field checking (at least one field per row)

3. **Duplicate Detection**
   - Checks for duplicates by Israeli ID
   - Checks for duplicates by email
   - Checks for duplicates by first_name + last_name combination
   - Clear reporting of which field caused the duplicate detection

4. **Import Preview & Confirmation**
   - Visual preview of all rows before importing
   - Separate categorization of valid, error, and duplicate rows
   - Summary statistics showing counts
   - Option to review and skip problematic rows

5. **Transactional Import**
   - All-or-nothing import behavior using database transactions
   - Rollback on any database errors
   - Clear failure reporting with specific row numbers and errors

6. **Admin-Only Access**
   - Feature restricted to super_admin role
   - Permission checks at both frontend and backend

## Architecture

### Backend (PHP)

**File:** `backend/src/Controllers/ImportController.php`

Endpoints:
- `POST /api/v1/graduates/import/preview` - Preview file contents and validation
- `POST /api/v1/graduates/import/confirm` - Confirm and import data

Key Methods:
- `preview()` - Parse file, validate data, return preview
- `confirm()` - Insert validated data using transactions
- `validateFile()` - Check MIME type and file size
- `mapHeaders()` - Intelligent header to database field mapping
- `validateGraduateRow()` - Validate individual row data
- `checkDuplicates()` - Detect duplicate entries
- `insertGraduate()` - Insert graduate into database

### Frontend (TypeScript/React)

**Service:** `frontend/src/services/importService.ts`
- `previewImport(file)` - Upload and preview
- `confirmImport(request)` - Confirm import

**Page:** `frontend/src/pages/ImportPage.tsx`
- Complete UI for file upload
- Preview display with error/duplicate handling
- Confirmation dialog before final import
- Success/failure result page

### Shared Types

**File:** `shared/types/index.ts`

Types:
- `ImportPreviewResponse` - Preview result structure
- `ImportValidationError` - Error row data
- `ImportDuplicate` - Duplicate detection result
- `ImportConfirmRequest` - Confirmation payload
- `ImportConfirmResponse` - Import result

## How to Use

### For Administrators

1. **Navigate to Import Page**
   - Click "ייבוא בוגרים" (Import Graduates) in the sidebar
   - Only visible to super_admin users

2. **Upload File**
   - Drag and drop a CSV or Excel file
   - Or click to browse and select file
   - Supported formats: .csv, .xlsx, .xls
   - Maximum file size: 5MB

3. **Review Preview**
   - System analyzes file and displays:
     - Summary of valid/invalid/duplicate rows
     - Detailed error messages for problematic rows
     - List of duplicates with matching criteria
   - Review and identify issues

4. **Confirm Import**
   - Click "Confirm Import" to proceed with valid rows
   - Duplicates are excluded by default
   - Errors are excluded (must be fixed manually)

5. **View Results**
   - See final report with import statistics
   - Navigate back to graduates list or import another file

### File Format

#### CSV Format
```csv
First Name,Last Name,Email,Phone,City,Shiur Year,...
יוחנן,כהן,yohanan@example.com,0501234567,ירושלים,תש"פ,...
```

#### Header Mapping
The system intelligently recognizes multiple variations:

| Database Field | Recognized Headers |
|---|---|
| first_name | first_name, firstname, first name, שם פרטי |
| last_name | last_name, lastname, last name, שם משפחה |
| email | email, email_address, e-mail, דוא"ל |
| phone | phone, phone_number, phone number, טלפון |
| home_phone | home_phone, home phone, home_number, טלפון בית |
| teudat_zehut | teudat_zehut, id, id_number, id number, תעודת זהות, מספר זהות |
| shiur_year | shiur_year, shiur year, year, שיעור, כיתה |
| city | city, עיר |
| address | address, כתובת |
| birth_date | birth_date, birthdate, birth date, date_of_birth, תאריך לידה |
| student_code | student_code, studentcode, student code, code, קוד |
| notes | notes, comments, הערות |

#### Required Fields
At least ONE field must be provided per row.

#### Optional Fields
All fields are optional except:
- At least one field must have a value

#### Validation Rules
- **Israeli ID (teudat_zehut)**: Must pass Luhn checksum validation
- **Email**: Must be valid email format
- **Phone/Home Phone**: Must be 9-10 digits (after normalization, removing non-numeric characters)

## Example Test File

A test file is included: `test-import.csv`

```csv
First Name,Last Name,Email,Phone,Shiur Year,City,Address,Birth Date,Teudat Zehut
יוחנן,כהן,yohanan@example.com,0501234567,תש"פ,ירושלים,רחוב בן יהודה 5,01/01/2000,123456789
מרים,לוי,miryam@example.com,0512345678,תש"פ,תל אביב,דיזנגוף 10,05/06/1999,987654321
דוד,רחמן,david.r@example.com,0523456789,,קיסריה,השרון 3,10/03/2001,456789123
שרה,ביטון,sarah.b@example.com,,תש"א,בית שמש,,25/07/1998,234567891
```

**Note**: The Israeli IDs in this file are for testing only and should be replaced with real valid IDs.

## Security Features

1. **Permission Checks**
   - Frontend: Role-based access control
   - Backend: `super_admin` check in AuthMiddleware
   - Route requires authentication

2. **File Validation**
   - MIME type checking
   - File size limits (5MB)
   - Extension whitelist (.csv, .xlsx, .xls)

3. **Input Sanitization**
   - All imported data validated against same rules as manual entry
   - Phone normalization removes special characters
   - Email validation

4. **Data Integrity**
   - Database transactions ensure consistency
   - Rollback on any error
   - Duplicate detection prevents data duplication
   - Soft delete mechanism preserved

5. **Error Handling**
   - Detailed validation errors reported to user
   - Row numbers clearly indicated
   - No partial imports on transaction failure

## Error Handling

### Common Error Scenarios

1. **Invalid Israeli ID**
   ```
   "Invalid Israeli ID (failed checksum validation): 123456789"
   ```
   - Solution: Verify the Israeli ID number uses correct Luhn checksum

2. **Invalid Email**
   ```
   "Invalid email format: not-an-email"
   ```
   - Solution: Use valid email format (user@example.com)

3. **Invalid Phone**
   ```
   "Invalid phone number (must be 9-10 digits): 123"
   ```
   - Solution: Ensure phone has 9-10 digits

4. **Duplicate Entry**
   - Row excluded from import
   - Shows which existing graduate matches (by ID, email, or name)
   - Solution: Update existing record instead or remove duplicate

5. **Empty File**
   ```
   "File is empty"
   ```
   - Solution: Ensure file has content

## Technical Details

### Dependencies Added
- `phpoffice/phpspreadsheet` - Excel/CSV parsing library

### Database Operations
- Uses prepared statements to prevent SQL injection
- Transactions with BEGIN, COMMIT, ROLLBACK
- Soft delete preservation (deleted_at field)

### Field Validation
Reuses existing validation methods from GraduatesController:
- `validateIsraeliID()` - Luhn algorithm
- `normalizePhone()` - Remove non-numeric characters
- `validatePhone()` - Check digit count
- `validateEmail()` - PHP filter_var

## Future Enhancements

Potential improvements:
1. **Batch Processing** - Handle very large files (>10k rows) with chunking
2. **Merge Options** - Allow updating existing records instead of skipping duplicates
3. **Template Download** - Provide Excel template with field definitions
4. **Import History** - Track all imports with timestamps and user info
5. **Rollback Capability** - Undo imports within time window
6. **Field Mapping UI** - Allow custom mapping if headers don't match
7. **Advanced Filtering** - Filter which rows to import in preview
8. **API Enhancements** - Return download-able error reports

## Testing the Feature

### Manual Testing Steps

1. **Access Check**
   - Log in as super_admin
   - Navigate to "ייבוא בוגרים"
   - Verify page loads without errors

2. **File Upload**
   - Drag and drop test-import.csv
   - Verify file name and size displayed
   - Click "Preview File"

3. **Preview Validation**
   - Confirm summary shows correct counts
   - Review any validation errors
   - Check duplicate detection works

4. **Import Confirmation**
   - Click "Confirm Import"
   - Verify success message
   - Check graduates list for new entries

5. **Error Handling**
   - Upload file with invalid data
   - Verify error messages are clear
   - Test file size limit

6. **Permission Checks**
   - Log in as non-admin user
   - Verify import page is inaccessible
   - Confirm proper error message

## Troubleshooting

### File Won't Parse
- Ensure file extension is .csv, .xlsx, or .xls
- Check file isn't corrupted
- Verify UTF-8 encoding for text files

### Validation Errors
- Check Israeli ID checksum (use online validator to test)
- Verify email format is valid
- Ensure phone has 9-10 digits

### Duplicates Not Being Detected
- Import may have been previously attempted
- Check graduates list for existing records
- Use search to find matching records

### Import Seems Stuck
- Check browser console for errors
- Verify file size is under 5MB
- Try refreshing page and retry
