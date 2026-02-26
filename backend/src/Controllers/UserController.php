<?php

namespace App\Controllers;

use App\Core\Response;
use PDO;

class UserController extends BaseController
{

  public function getAll()
  {
    // Params
    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $search = $_GET['search'] ?? '';

    $sort = $_GET['sort'] ?? 'first_name';
    $order = strtolower($_GET['order'] ?? 'asc');
    if (!in_array($order, ['asc', 'desc'])) {
      $order = 'asc';
    }

    $sortMap = [
      'fullName' => 'first_name',
      'email' => 'email',
      'role' => 'role',
      'shiurs' => 'shiurs_managed'
    ];
    $sortField = $sortMap[$sort] ?? 'first_name';

    $offset = ($page - 1) * $limit;

    // Base Query
    $sql = "SELECT id, email, first_name as firstName, last_name as lastName, role, shiurs_managed, password_changed as passwordChanged, shiurs_managed FROM users WHERE 1=1";
    $params = [];

    // Search Filter
    if ($search) {
      $words = array_filter(explode(" ", trim($search)));
      foreach ($words as $index => $word) {
        $paramKey = "search" . $index;
        $sql .= " AND (first_name LIKE :search_a_$index OR last_name LIKE :search_b_$index OR email LIKE :search_c_$index)";
        $params["search_a_$index"] = "%$word%";
        $params["search_b_$index"] = "%$word%";
        $params["search_c_$index"] = "%$word%";
      }
    }

    // New API Filters
    $filtersParam = $_GET['filters'] ?? '';
    if ($filtersParam) {
      $filters = json_decode($filtersParam, true);
      if (is_array($filters)) {
        foreach ($filters as $index => $filter) {
          $id = $filter['id'] ?? '';
          $value = $filter['value'] ?? '';
          $paramKey = "filter_" . $index;

          // Normalize value to array for uniform handling
          $valueArr = is_array($value) ? $value : [$value];
          $valueArr = array_filter($valueArr, fn($v) => $v !== '' && $v !== null);

          if (empty($valueArr))
            continue;

          if ($id === 'role') {
            $inParams = [];
            foreach ($valueArr as $rIndex => $role) {
              $rKey = "role_{$index}_{$rIndex}";
              $inParams[] = ":$rKey";
              $params[$rKey] = $role;
            }
            $sql .= " AND role IN (" . implode(',', $inParams) . ")";
          } else if ($id === 'fullName') {
            if (in_array('isEmpty', $valueArr)) {
              $sql .= " AND (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '')";
            } else if (in_array('isNotEmpty', $valueArr)) {
              $sql .= " AND (first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '')";
            } else {
              $v = reset($valueArr);
              $sql .= " AND (first_name LIKE :$paramKey OR last_name LIKE :$paramKey)";
              $params[$paramKey] = "%$v%";
            }
          } else if ($id === 'email') {
            if (in_array('isEmpty', $valueArr)) {
              $sql .= " AND (email IS NULL OR email = '')";
            } else if (in_array('isNotEmpty', $valueArr)) {
              $sql .= " AND (email IS NOT NULL AND email != '')";
            } else {
              $v = reset($valueArr);
              $sql .= " AND email LIKE :$paramKey";
              $params[$paramKey] = "%$v%";
            }
          } else if ($id === 'shiurs') {
            if (in_array('isEmpty', $valueArr)) {
              $sql .= " AND (shiurs_managed IS NULL OR shiurs_managed = '[]' OR shiurs_managed = '')";
            } else if (in_array('isNotEmpty', $valueArr)) {
              $sql .= " AND (shiurs_managed IS NOT NULL AND shiurs_managed != '[]' AND shiurs_managed != '')";
            }
          }
        }
      }
    }

    // Count Total
    $countSql = str_replace(
      "SELECT id, email, first_name as firstName, last_name as lastName, role, shiurs_managed, password_changed as passwordChanged, shiurs_managed",
      "SELECT COUNT(*)",
      $sql
    );
    $stmt = $this->db->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    // Order & Limit
    $sql .= " ORDER BY $sortField $order LIMIT :limit OFFSET :offset";

    $stmt = $this->db->prepare($sql);
    foreach ($params as $key => $val) {
      $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $users = $stmt->fetchAll();

    // Decode shiurs_managed for each user
    foreach ($users as &$user) {
      $user['shiurs'] = json_decode($user['shiurs_managed'] ?? '[]');
      unset($user['shiurs_managed']);
    }

    Response::json([
      'data' => $users,
      'total' => (int) $total,
      'page' => $page,
      'pageSize' => $limit
    ]);
  }

  public function getById($id)
  {
    $stmt = $this->db->prepare("SELECT id, email, first_name as firstName, last_name as lastName, role, shiurs_managed, password_changed as passwordChanged FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
      Response::notFound('User not found');
    }

    $user['shiurs'] = json_decode($user['shiurs_managed'] ?? '[]');
    unset($user['shiurs_managed']);

    Response::json($user);
  }

  public function create()
  {
    $data = $this->getJsonInput();

    $email = $data['email'] ?? '';
    $firstName = $data['firstName'] ?? '';
    $lastName = $data['lastName'] ?? '';
    $role = $data['role'] ?? 'shiur_manager';
    $shiurs = $data['shiurs'] ?? [];

    if ($role === 'shiur_manager' && !empty($shiurs)) {
      foreach ($shiurs as $shiur) {
        if (!$this->validateHebrewYear($shiur)) {
          Response::validationError('shiurs', 'One or more years are invalid Hebrew years');
        }
      }
    }

    if (!$email || !$firstName || !$lastName) {
      Response::error('Missing required fields');
    }

    // Check if email exists
    $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
      Response::error('Email already exists');
    }

    // Default password for new users
    $defaultPassword = password_hash("123456", PASSWORD_DEFAULT);
    $shiursJson = json_encode($shiurs);

    $sql = "INSERT INTO users (email, password_hash, first_name, last_name, role, shiurs_managed) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $this->db->prepare($sql);

    try {
      $stmt->execute([$email, $defaultPassword, $firstName, $lastName, $role, $shiursJson]);
      $id = $this->db->lastInsertId();

      Response::json([
        'id' => $id,
        'email' => $email,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'role' => $role,
        'shiurs' => $shiurs,
        'passwordChanged' => false
      ]);
    } catch (\PDOException $e) {
      Response::serverError('Database error: ' . $e->getMessage());
    }
  }

  public function update($id)
  {
    $data = $this->getJsonInput();

    // Fetch existing
    $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
      Response::notFound('User not found');
    }

    // Prepare updates
    // Note: keeping current values if not provided is usually good practice, 
    // but typically PUT sends whole object. Let's assume partial updates support or fallbacks.
    $firstName = $data['firstName'] ?? $user['first_name'];
    $lastName = $data['lastName'] ?? $user['last_name'];
    $email = $data['email'] ?? $user['email'];
    $role = $data['role'] ?? $user['role'];
    $role = $data['role'] ?? $user['role'];

    $shiurs = null;
    if (isset($data['shiurs'])) {
      $shiursArray = $data['shiurs'];
      if ($role === 'shiur_manager' && !empty($shiursArray)) {
        foreach ($shiursArray as $s) {
          if (!$this->validateHebrewYear($s)) {
            Response::validationError('shiurs', 'One or more years are invalid Hebrew years');
          }
        }
      }
      $shiurs = json_encode($shiursArray);
    } else {
      $shiurs = $user['shiurs_managed'];
    }

    // Check email uniqueness if changed
    if ($email !== $user['email']) {
      $check = $this->db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
      $check->execute([$email, $id]);
      if ($check->fetch()) {
        Response::error('Email already exists');
      }
    }

    $password = $data['password'] ?? null;

    $sql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, role = ?, shiurs_managed = ?";
    $params = [$firstName, $lastName, $email, $role, $shiurs];

    if ($password) {
      $sql .= ", password_hash = ?, password_changed = 1";
      $params[] = password_hash($password, PASSWORD_DEFAULT);
    }

    $sql .= " WHERE id = ?";
    $params[] = $id;

    $stmt = $this->db->prepare($sql);

    try {
      $stmt->execute($params);

      // Return updated
      Response::json([
        'id' => $id,
        'email' => $email,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'role' => $role,
        'shiurs' => json_decode($shiurs),
        'passwordChanged' => $password ? true : (bool) ($user['password_changed'] ?? false)
      ]);
    } catch (\PDOException $e) {
      Response::serverError('Database error');
    }
  }

  public function delete($id)
  {
    $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
    try {
      $stmt->execute([$id]);
      http_response_code(204);
    } catch (\PDOException $e) {
      Response::serverError('Could not delete user');
    }
  }
}
