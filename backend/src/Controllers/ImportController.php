<?php

namespace App\Controllers;

use App\Core\Response;
use PDO;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ImportController extends BaseController
{

  /**
   * Preview import data from uploaded file
   * POST /api/v1/graduates/import/preview
   */
  public function preview()
  {
    // Check for admin permission
    if (!isset($_SERVER['user_role']) || $_SERVER['user_role'] !== 'super_admin') {
      Response::error('Only administrators can import data', 403);
    }

    // Check if file was uploaded
    if (!isset($_FILES['file'])) {
      Response::error('No file uploaded');
    }

    $file = $_FILES['file'];

    // Validate file
    $this->validateFile($file);

    // Parse file
    try {
      $spreadsheet = IOFactory::load($file['tmp_name']);
      $worksheet = $spreadsheet->getActiveSheet();
      $rows = $worksheet->toArray();
    } catch (\Exception $e) {
      Response::error('Failed to parse file: ' . $e->getMessage());
    }

    if (empty($rows)) {
      Response::error('File is empty');
    }

    // Extract headers from first row
    $headers = array_map('strtolower', $rows[0]);
    $headers = array_map('trim', $headers);

    // Map file headers to database fields
    $fieldMapping = $this->mapHeaders($headers);

    // Validate rows and prepare preview
    $validRows = [];
    $errors = [];
    $duplicates = [];

    for ($i = 1; $i < count($rows); $i++) {
      $row = $rows[$i];

      // Skip empty rows
      if (empty(array_filter($row))) {
        continue;
      }

      $rowNumber = $i + 1; // +1 because row 1 is header
      $graduateData = $this->mapRowToGraduate($row, $fieldMapping, $headers);

      // Validate the graduate data
      $validation = $this->validateGraduateRow($graduateData, $rowNumber);

      if (!empty($validation['errors'])) {
        $errors[] = [
          'row' => $rowNumber,
          'data' => $graduateData,
          'errors' => $validation['errors']
        ];
      } else {
        // Check for duplicates in database
        $duplicateCheck = $this->checkDuplicates($graduateData);

        if ($duplicateCheck['isDuplicate']) {
          $duplicates[] = [
            'row' => $rowNumber,
            'data' => $graduateData,
            'duplicateId' => $duplicateCheck['graduateId'],
            'matchFields' => $duplicateCheck['matchFields']
          ];
        } else {
          $validRows[] = [
            'row' => $rowNumber,
            'data' => $graduateData
          ];
        }
      }
    }

    Response::json([
      'success' => true,
      'summary' => [
        'totalRows' => count($rows) - 1,
        'validRows' => count($validRows),
        'errorRows' => count($errors),
        'duplicateRows' => count($duplicates)
      ],
      'validRows' => $validRows,
      'errorRows' => $errors,
      'duplicateRows' => $duplicates,
      'fieldMapping' => $fieldMapping
    ]);
  }

  /**
   * Confirm and import data
   * POST /api/v1/graduates/import/confirm
   */
  public function confirm()
  {
    // Check for admin permission
    if (!isset($_SERVER['user_role']) || $_SERVER['user_role'] !== 'super_admin') {
      Response::error('Only administrators can import data', 403);
    }

    $data = $this->getJsonInput();

    if (!isset($data['rowsToImport']) || !is_array($data['rowsToImport'])) {
      Response::error('No rows to import');
    }

    // Begin transaction
    $this->db->beginTransaction();

    try {
      $importedCount = 0;
      $failedRows = [];

      foreach ($data['rowsToImport'] as $rowData) {
        $row = $rowData['row'] ?? null;
        $graduateData = $rowData['data'] ?? [];

        if (!$graduateData) {
          continue;
        }

        // Re-validate before inserting
        $validation = $this->validateGraduateRow($graduateData, $row);
        if (!empty($validation['errors'])) {
          $failedRows[] = [
            'row' => $row,
            'errors' => $validation['errors']
          ];
          continue;
        }

        // Check for duplicate again (in case data changed)
        if ($this->checkDuplicates($graduateData)['isDuplicate']) {
          $failedRows[] = [
            'row' => $row,
            'errors' => ['Duplicate entry detected during import']
          ];
          continue;
        }

        // Insert into database
        try {
          $this->insertGraduate($graduateData);
          $importedCount++;
        } catch (\PDOException $e) {
          $failedRows[] = [
            'row' => $row,
            'errors' => ['Database error: ' . $e->getMessage()]
          ];
        }
      }

      // Commit transaction
      $this->db->commit();

      Response::json([
        'success' => true,
        'imported' => $importedCount,
        'failed' => count($failedRows),
        'failedRows' => $failedRows
      ]);
    } catch (\Exception $e) {
      // Rollback on error
      $this->db->rollBack();

      Response::serverError('Import failed: ' . $e->getMessage());
    }
  }

  /**
   * Download sample import file
   * GET /api/v1/graduates/import/sample/:format
   */
  public function downloadSample($format = 'csv')
  {
    $format = strtolower($format);

    if ($format === 'csv') {
      $this->downloadCsvSample();
    } elseif ($format === 'xlsx') {
      $this->downloadExcelSample();
    } else {
      Response::error('Invalid format. Use csv or xlsx');
    }
  }

  /**
   * Download CSV sample file
   */
  private function downloadCsvSample()
  {
    $filename = 'graduates-sample.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=' . $filename);
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');

    // CSV header with Hebrew labels
    fputcsv($output, [
      'שם פרטי',
      'שם משפחה',
      'דוא"ל',
      'טלפון',
      'טלפון בית',
      'תעודת זהות',
      'תאריך לידה',
      'עיר',
      'כתובת',
      'שיעור',
      'קוד סטודנט',
      'הערות'
    ], ',', '"');

    // Sample row
    fputcsv($output, [
      'יוסף',
      'כהן',
      'yosef@example.com',
      '0501234567',
      '0212345678',
      '12345678',
      '15/05/1995',
      'ירושלים',
      'רחוב ההגנה 10',
      'נח',
      'STU001',
      'הערה לדוגמה'
    ], ',', '"');

    fclose($output);
    exit;
  }

  /**
   * Download Excel sample file
   */
  private function downloadExcelSample()
  {
    try {
      // Disable output buffering to avoid header issues
      while (ob_get_level() > 0) {
        ob_end_clean();
      }

      $filename = 'graduates-sample.xlsx';
      header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      header('Content-Disposition: attachment; filename="' . $filename . '"');
      header('Cache-Control: no-cache, no-store, must-revalidate');
      header('Pragma: no-cache');
      header('Expires: 0');

      $spreadsheet = new Spreadsheet();
      $sheet = $spreadsheet->getActiveSheet();

      // Headers
      $headers = [
        'שם פרטי',
        'שם משפחה',
        'דוא"ל',
        'טלפון',
        'טלפון בית',
        'תעודת זהות',
        'תאריך לידה',
        'עיר',
        'כתובת',
        'שיעור',
        'קוד סטודנט',
        'הערות'
      ];

      $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      foreach ($headers as $idx => $header) {
        $sheet->setCellValue($columns[$idx] . '1', $header);
      }

      // Sample data
      $sampleData = [
        ['יוסף', 'כהן', 'yosef@example.com', '0501234567', '0212345678', '12345678', '15/05/1995', 'ירושלים', 'רחוב ההגנה 10', 'נח', 'STU001', 'הערה לדוגמה'],
        ['מרים', 'לבנון', 'miriam@example.com', '0502345678', '0223456789', '87654321', '20/08/1996', 'תל אביב', 'דרך השלום 5', 'פ', 'STU002', ''],
      ];

      foreach ($sampleData as $rowIdx => $row) {
        $rowNum = $rowIdx + 2;
        foreach ($row as $colIdx => $value) {
          $sheet->setCellValue($columns[$colIdx] . $rowNum, $value);
        }
      }

      // Auto-adjust columns
      foreach ($sheet->getColumnIterator() as $column) {
        $sheet->getColumnDimension($column->getColumnIndex())->setAutoSize(true);
      }

      // Set RTL (right-to-left) for Hebrew
      $sheet->setRightToLeft(true);

      $writer = new Xlsx($spreadsheet);
      $writer->save('php://output');
      exit(0);
    } catch (\Exception $e) {
      header('HTTP/1.1 500 Internal Server Error');
      header('Content-Type: application/json');
      echo json_encode(['error' => 'Failed to generate Excel file: ' . $e->getMessage()]);
      exit(1);
    }
  }

  /**
   * Validate file type and size
   */
  private function validateFile($file)
  {
    // Check file size (max 50MB)
    if ($file['size'] > 50 * 1024 * 1024) {
      Response::error('File size exceeds 50MB limit');
    }

    // Check MIME type and extension
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
      Response::error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed');
    }
  }

  /**
   * Map file headers to database field names
   */
  private function mapHeaders($headers)
  {
    $standardFields = [
      'first_name' => ['first_name', 'firstname', 'first name', 'שם פרטי'],
      'last_name' => ['last_name', 'lastname', 'last name', 'שם משפחה'],
      'phone' => ['phone', 'phone_number', 'phone number', 'טלפון'],
      'home_phone' => ['home_phone', 'home phone', 'home_number', 'טלפון בית'],
      'email' => ['email', 'email_address', 'e-mail', 'דוא"ל'],
      'shiur_year' => ['shiur_year', 'shiur year', 'year', 'שיעור', 'כיתה'],
      'city' => ['city', 'עיר'],
      'address' => ['address', 'כתובת'],
      'teudat_zehut' => ['teudat_zehut', 'id', 'id_number', 'id number', 'תעודת זהות', 'מספר זהות'],
      'birth_date' => ['birth_date', 'birthdate', 'birth date', 'date_of_birth', 'תאריך לידה'],
      'student_code' => ['student_code', 'studentcode', 'student code', 'code', 'קוד'],
      'notes' => ['notes', 'comments', 'הערות']
    ];

    $mapping = [];
    foreach ($headers as $index => $header) {
      $header = strtolower(trim($header));
      $mapped = false;

      foreach ($standardFields as $dbField => $aliases) {
        if (in_array($header, $aliases)) {
          $mapping[$index] = $dbField;
          $mapped = true;
          break;
        }
      }

      if (!$mapped) {
        $mapping[$index] = null;
      }
    }

    return $mapping;
  }

  /**
   * Map a row to graduate data using field mapping
   */
  private function mapRowToGraduate($row, $fieldMapping, $headers)
  {
    $graduate = [];

    foreach ($fieldMapping as $columnIndex => $dbField) {
      if ($dbField === null) {
        continue; // Skip unmapped columns
      }

      $value = trim($row[$columnIndex] ?? '');
      if ($value !== '') {
        $graduate[$dbField] = $value;
      }
    }

    return $graduate;
  }

  /**
   * Validate a single graduate row
   */
  private function validateGraduateRow($data, $rowNumber)
  {
    $errors = [];

    // At least one field must be provided
    if (empty($data)) {
      $errors[] = 'At least one field must be provided';
      return ['errors' => $errors];
    }

    // Validate Israeli ID
    if (isset($data['teudat_zehut']) && $data['teudat_zehut'] !== '') {
      if (!$this->validateIsraeliID($data['teudat_zehut'])) {
        $errors[] = 'Invalid Israeli ID (failed checksum validation): ' . $data['teudat_zehut'];
      }
    }

    // Validate email
    if (isset($data['email']) && $data['email'] !== '') {
      if (!$this->validateEmail($data['email'])) {
        $errors[] = 'Invalid email format: ' . $data['email'];
      }
    }

    // Validate and normalize phone
    if (isset($data['phone']) && $data['phone'] !== '') {
      $data['phone'] = $this->normalizePhone($data['phone']);
      if (!$this->validatePhone($data['phone'])) {
        $errors[] = 'Invalid phone number (must be 9-10 digits): ' . $data['phone'];
      }
    }

    // Validate and normalize home_phone
    if (isset($data['home_phone']) && $data['home_phone'] !== '') {
      $data['home_phone'] = $this->normalizePhone($data['home_phone']);
      if (!$this->validatePhone($data['home_phone'])) {
        $errors[] = 'Invalid home phone number (must be 9-10 digits): ' . $data['home_phone'];
      }
    }

    return ['errors' => $errors, 'data' => $data];
  }

  /**
   * Check for duplicates in the database
   */
  private function checkDuplicates($data)
  {
    $matchFields = [];

    // Check by Israeli ID
    if (isset($data['teudat_zehut']) && $data['teudat_zehut'] !== '') {
      $stmt = $this->db->prepare("SELECT id FROM graduates WHERE teudat_zehut = :teudat_zehut AND deleted_at IS NULL");
      $stmt->execute(['teudat_zehut' => $data['teudat_zehut']]);
      if ($row = $stmt->fetch()) {
        return [
          'isDuplicate' => true,
          'graduateId' => $row['id'],
          'matchFields' => ['teudat_zehut']
        ];
      }
    }

    // Check by email
    if (isset($data['email']) && $data['email'] !== '') {
      $stmt = $this->db->prepare("SELECT id FROM graduates WHERE email = :email AND deleted_at IS NULL");
      $stmt->execute(['email' => $data['email']]);
      if ($row = $stmt->fetch()) {
        return [
          'isDuplicate' => true,
          'graduateId' => $row['id'],
          'matchFields' => ['email']
        ];
      }
    }

    // Check by first and last name combination
    if (isset($data['first_name']) && isset($data['last_name']) && $data['first_name'] !== '' && $data['last_name'] !== '') {
      $stmt = $this->db->prepare("SELECT id FROM graduates WHERE first_name = :first_name AND last_name = :last_name AND deleted_at IS NULL");
      $stmt->execute([
        'first_name' => $data['first_name'],
        'last_name' => $data['last_name']
      ]);
      if ($row = $stmt->fetch()) {
        return [
          'isDuplicate' => true,
          'graduateId' => $row['id'],
          'matchFields' => ['first_name', 'last_name']
        ];
      }
    }

    return ['isDuplicate' => false];
  }

  /**
   * Insert a graduate into the database
   */
  private function insertGraduate($data)
  {
    $fillable = ['first_name', 'last_name', 'phone', 'home_phone', 'email', 'shiur_year', 'city', 'address', 'teudat_zehut', 'birth_date', 'student_code', 'notes'];

    $fields = [];
    $placeholders = [];
    $params = [];

    foreach ($fillable as $field) {
      if (isset($data[$field])) {
        $fields[] = $field;
        $placeholders[] = ":$field";
        $params[$field] = $data[$field];
      }
    }

    $sql = "INSERT INTO graduates (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $this->db->prepare($sql);
    $stmt->execute($params);

    return $this->db->lastInsertId();
  }

  // Validation helper methods (same as GraduatesController)
  private function validateIsraeliID($id)
  {
    $id = trim($id);
    if (strlen($id) > 9 || strlen($id) === 0)
      return false;
    $id = str_pad($id, 9, "0", STR_PAD_LEFT);

    $sum = 0;
    for ($i = 0; $i < 9; $i++) {
      $digit = (int) $id[$i];
      $step = $digit * (($i % 2) + 1);
      if ($step > 9)
        $step -= 9;
      $sum += $step;
    }

    return $sum % 10 === 0;
  }

  private function normalizePhone($phone)
  {
    return preg_replace('/\D/', '', $phone);
  }

  private function validatePhone($phone)
  {
    $len = strlen($phone);
    return $len === 9 || $len === 10;
  }

  private function validateEmail($email)
  {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
  }
}
