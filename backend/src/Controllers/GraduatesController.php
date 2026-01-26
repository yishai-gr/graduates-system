<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;

class GraduatesController
{
  private $db;

  public function __construct()
  {
    $this->db = Database::getConnection();
  }

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
      $sql .= " AND (first_name LIKE :search OR last_name LIKE :search OR email LIKE :search)";
      $params['search'] = "%$search%";
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

    echo json_encode([
      'data' => $graduates,
      'meta' => [
        'total' => (int) $total,
        'page' => $page,
        'limit' => $limit
      ]
    ]);
  }

  public function getById($id)
  {
    $stmt = $this->db->prepare("SELECT * FROM graduates WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);
    $graduate = $stmt->fetch();

    if (!$graduate) {
      header('HTTP/1.1 404 Not Found');
      echo json_encode(['error' => ['message' => 'Graduate not found']]);
      return;
    }

    echo json_encode($graduate);
  }

  public function create()
  {
    $data = json_decode(file_get_contents("php://input"), true);

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
      header('HTTP/1.1 400 Bad Request');
      echo json_encode(['error' => ['message' => 'Must provide at least one field']]);
      return;
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
    $stmt->execute($params);

    $id = $this->db->lastInsertId();
    $this->getById($id); // Return the created object
  }

  public function update($id)
  {
    $data = json_decode(file_get_contents("php://input"), true);

    $fillable = ['first_name', 'last_name', 'phone', 'home_phone', 'email', 'shiur_year', 'city', 'address', 'teudat_zehut', 'birth_date', 'student_code', 'notes'];

    $sets = [];
    $params = ['id' => $id];

    foreach ($fillable as $field) {
      if (isset($data[$field])) {
        $sets[] = "$field = :$field";
        $params[$field] = $data[$field];
      }
    }

    if (empty($sets)) {
      header('HTTP/1.1 400 Bad Request');
      echo json_encode(['error' => ['message' => 'No fields to update']]);
      return;
    }

    $sql = "UPDATE graduates SET " . implode(', ', $sets) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $this->db->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
      // Check if exists
      $check = $this->db->prepare("SELECT id FROM graduates WHERE id = :id AND deleted_at IS NULL");
      $check->execute(['id' => $id]);
      if (!$check->fetch()) {
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['error' => ['message' => 'Graduate not found']]);
        return;
      }
      // If exists but no changes, that's fine, just return object
    }

    $this->getById($id);
  }

  public function delete($id)
  {
    // Soft Delete
    $stmt = $this->db->prepare("UPDATE graduates SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
      header('HTTP/1.1 404 Not Found');
      echo json_encode(['error' => ['message' => 'Graduate not found']]);
      return;
    }

    header('HTTP/1.1 204 No Content');
  }
}
