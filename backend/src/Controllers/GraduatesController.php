<?php

namespace App\Controllers;

use App\Core\Response;
use PDO;

class GraduatesController extends BaseController
{

  public function getAll()
  {
    // Params
    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $search = $_GET['search'] ?? '';
    $shiurYear = $_GET['shiur_year'] ?? '';
    $sortBy = $_GET['sort_by'] ?? 'last_name';
    $order = isset($_GET['order']) && strtolower($_GET['order']) === 'desc' ? 'DESC' : 'ASC';

    $offset = ($page - 1) * $limit;

    // Base Query
    $sql = "SELECT * FROM graduates WHERE deleted_at IS NULL";
    $params = [];

    // Filters
    if ($search) {
      $sql .= " AND (first_name LIKE :search1 OR last_name LIKE :search2 OR email LIKE :search3)";
      $params['search1'] = "%$search%";
      $params['search2'] = "%$search%";
      $params['search3'] = "%$search%";
    }

    if ($shiurYear) {
      $sql .= " AND shiur_year = :shiur_year";
      $params['shiur_year'] = $shiurYear;
    }

    // Count Total
    $countSql = str_replace("SELECT *", "SELECT COUNT(*)", $sql);
    $stmt = $this->db->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    // Sorting & Pagination
    // Whitelist sort columns to prevent SQL injection
    $allowedSorts = ['first_name', 'last_name', 'shiur_year', 'created_at', 'city'];
    if (!in_array($sortBy, $allowedSorts))
      $sortBy = 'last_name';

    $sql .= " ORDER BY $sortBy $order LIMIT :limit OFFSET :offset";

    // PDO limit/offset need integers binding dependent on driver mode, 
    // safe way with some drivers is binding as INT.
    $stmt = $this->db->prepare($sql);
    foreach ($params as $key => $val) {
      $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $graduates = $stmt->fetchAll();

    $json = json_encode([
      'data' => $graduates,
      'meta' => [
        'total' => (int) $total,
        'page' => $page,
        'limit' => $limit
      ]
    ]);

    if ($json === false) {
      Response::serverError('JSON Encode Error: ' . json_last_error_msg());
    }
    echo $json;
  }

  public function getById($id)
  {
    $stmt = $this->db->prepare("SELECT * FROM graduates WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);
    $graduate = $stmt->fetch();

    if (!$graduate) {
      Response::notFound('Graduate not found');
    }

    Response::json($graduate);
  }

  public function create()
  {
    $data = $this->getJsonInput();

    // Basic Validation (Enhance as needed)
    // Spec says: "חייבים נתון אחד לפחות"
    $fillable = ['first_name', 'last_name', 'phone', 'home_phone', 'email', 'shiur_year', 'city', 'address', 'teudat_zehut', 'birth_date', 'student_code', 'notes'];

    $hasData = false;
    foreach ($fillable as $field) {
      if (!empty($data[$field])) {
        $hasData = true;
        break;
      }
    }

    if (!$hasData) {
      Response::error('Must provide at least one field');
    }

    // Strict Validations
    if (!empty($data['teudat_zehut'])) {
      if (!$this->validateIsraeliID($data['teudat_zehut'])) {
        Response::validationError('teudat_zehut', 'Invalid Israeli ID checksum');
      }
    }

    if (!empty($data['email'])) {
      if (!$this->validateEmail($data['email'])) {
        Response::validationError('email', 'Invalid email address');
      }
    }

    // Phone Normalization & Validation
    if (!empty($data['phone'])) {
      $data['phone'] = $this->normalizePhone($data['phone']);
      if (!$this->validatePhone($data['phone'])) {
        Response::validationError('phone', 'Phone number must be 9 or 10 digits');
      }
    }

    if (!empty($data['home_phone'])) {
      $data['home_phone'] = $this->normalizePhone($data['home_phone']);
      if (!$this->validatePhone($data['home_phone'])) {
        Response::validationError('home_phone', 'Phone number must be 9 or 10 digits');
      }
    }

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
    try {
      $stmt->execute($params);
      $id = $this->db->lastInsertId();
      $this->getById($id); // Return the created object
    } catch (\PDOException $e) {
      // Check for duplicate entry on unique keys if any (e.g. teudat_zehut or email if unique)
      if ($e->errorInfo[1] == 1062) {
        Response::validationError('general', 'Duplicate entry found');
      } else {
        throw $e;
      }
    }
  }

  public function update($id)
  {
    $data = $this->getJsonInput();

    $fillable = ['first_name', 'last_name', 'phone', 'home_phone', 'email', 'shiur_year', 'city', 'address', 'teudat_zehut', 'birth_date', 'student_code', 'notes'];

    // Strict Validations
    if (isset($data['teudat_zehut']) && $data['teudat_zehut'] !== '') {
      if (!$this->validateIsraeliID($data['teudat_zehut'])) {
        Response::validationError('teudat_zehut', 'Invalid Israeli ID checksum');
      }
    }

    if (isset($data['email']) && $data['email'] !== '') {
      if (!$this->validateEmail($data['email'])) {
        Response::validationError('email', 'Invalid email address');
      }
    }

    // Phone Normalization & Validation
    if (isset($data['phone']) && $data['phone'] !== '') {
      $data['phone'] = $this->normalizePhone($data['phone']);
      if (!$this->validatePhone($data['phone'])) {
        Response::validationError('phone', 'Phone number must be 9 or 10 digits');
      }
    }

    if (isset($data['home_phone']) && $data['home_phone'] !== '') {
      $data['home_phone'] = $this->normalizePhone($data['home_phone']);
      if (!$this->validatePhone($data['home_phone'])) {
        Response::validationError('home_phone', 'Phone number must be 9 or 10 digits');
      }
    }

    $sets = [];
    $params = ['id' => $id];

    foreach ($fillable as $field) {
      if (isset($data[$field])) {
        $sets[] = "$field = :$field";
        $params[$field] = $data[$field];
      }
    }

    if (empty($sets)) {
      Response::error('No fields to update');
    }

    $sql = "UPDATE graduates SET " . implode(', ', $sets) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $this->db->prepare($sql);
    try {
      $stmt->execute($params);

      if ($stmt->rowCount() === 0) {
        // Check if exists
        $check = $this->db->prepare("SELECT id FROM graduates WHERE id = :id AND deleted_at IS NULL");
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
          Response::notFound('Graduate not found');
        }
        // If exists but no changes, that's fine, just return object
      }

      $this->getById($id);
    } catch (\PDOException $e) {
      if ($e->errorInfo[1] == 1062) {
        Response::validationError('general', 'Duplicate entry found');
      } else {
        throw $e;
      }
    }
  }

  public function delete($id)
  {
    // Soft Delete
    $stmt = $this->db->prepare("UPDATE graduates SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
      Response::notFound('Graduate not found');
    }

    Response::noContent();
  }

  // Israeli ID validation using Luhn checksum
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

  // Normalize phone to digits only
  private function normalizePhone($phone)
  {
    return preg_replace('/\D/', '', $phone);
  }

  // specific Israeli phone validation (9 or 10 digits)
  private function validatePhone($phone)
  {
    $len = strlen($phone);
    // Israeli numbers are 9 or 10 digits (after normalization, including leading zero)
    // Mobile: 05X-XXXXXXX (10)
    // Landline: 0X-XXXXXXX (9)
    return $len === 9 || $len === 10;
  }

  // Standard email validation
  private function validateEmail($email)
  {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
  }

  // validationError moved to Response::validationError()
}
