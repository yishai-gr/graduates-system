<?php

namespace App\Controllers;

use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class GraduatesController extends BaseController
{

  public function getAll()
  {
    $user = AuthMiddleware::authenticate();
    $role = $user['role'] ?? 'user';
    $isShiurManager = $role === 'shiur_manager';
    $managerShiurs = $user['shiurs'] ?? [];

    // Params
    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $search = $_GET['search'] ?? '';

    $sortByRaw = $_GET['sort'] ?? $_GET['sort_by'] ?? 'last_name';
    $order = isset($_GET['order']) && strtolower($_GET['order']) === 'desc' ? 'DESC' : 'ASC';

    // Map frontend 'sort' to db columns
    $sortMap = [
      'fullName' => 'first_name',
      'last_name' => 'last_name',
      'city' => 'city',
      'phone' => 'phone',
      'shiur_year' => 'shiur_year'
    ];
    $sortBy = $sortMap[$sortByRaw] ?? 'last_name';

    $offset = ($page - 1) * $limit;

    // Base Query
    $sql = "SELECT * FROM graduates WHERE deleted_at IS NULL";
    $params = [];

    // Apply Shiur restrictions for managers
    if ($isShiurManager) {
      if (empty($managerShiurs)) {
        // Manager with no assigned shiurs sees nothing
        echo json_encode([
          'data' => [],
          'meta' => ['total' => 0, 'page' => $page, 'limit' => $limit]
        ]);
        return;
      }

      // Create named placeholders for IN clause: :m_shiur_0, :m_shiur_1...
      $inParams = [];
      foreach ($managerShiurs as $index => $year) {
        $key = "m_shiur_$index";
        $inParams[] = ":$key";
        $params[$key] = $year;
      }
      $inClause = implode(',', $inParams);
      $sql .= " AND shiur_year IN ($inClause)";
    }

    // Search Filter
    if ($search) {
      $words = array_filter(explode(" ", trim($search)));
      foreach ($words as $index => $word) {
        $sql .= " AND (first_name LIKE :search_a_$index OR last_name LIKE :search_b_$index OR email LIKE :search_c_$index)";
        $params["search_a_$index"] = "%$word%";
        $params["search_b_$index"] = "%$word%";
        $params["search_c_$index"] = "%$word%";
      }
    }

    // New API Filters (JSON)
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

          if ($id === 'fullName') {
            // text search – use first value only
            $v = reset($valueArr);
            $sql .= " AND (first_name LIKE :$paramKey OR last_name LIKE :$paramKey)";
            $params[$paramKey] = "%$v%";
          } else if ($id === 'phone') {
            if (in_array('isEmpty', $valueArr)) {
              $sql .= " AND (phone IS NULL OR phone = '')";
            } else if (in_array('isNotEmpty', $valueArr)) {
              $sql .= " AND (phone IS NOT NULL AND phone != '')";
            } else {
              $v = reset($valueArr);
              $sql .= " AND phone LIKE :$paramKey";
              $params[$paramKey] = "%$v%";
            }
          } else if ($id === 'city') {
            if (in_array('isEmpty', $valueArr)) {
              $sql .= " AND (city IS NULL OR city = '')";
            } else {
              $inParams = [];
              foreach ($valueArr as $cIndex => $city) {
                $cKey = "city_{$index}_{$cIndex}";
                $inParams[] = ":$cKey";
                $params[$cKey] = $city;
              }
              $sql .= " AND city IN (" . implode(',', $inParams) . ")";
            }
          } else if ($id === 'shiur_year') {
            if (in_array('empty', $valueArr)) {
              $sql .= " AND (shiur_year IS NULL OR shiur_year = '')";
            } else {
              $inParams = [];
              foreach ($valueArr as $yIndex => $year) {
                $yKey = "shiur_year_{$index}_{$yIndex}";
                $inParams[] = ":$yKey";
                $params[$yKey] = trim($year);
              }
              $sql .= " AND shiur_year IN (" . implode(',', $inParams) . ")";
            }
          }
        }
      }
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
      'total' => (int) $total,
      'page' => $page,
      'pageSize' => $limit
    ]);

    if ($json === false) {
      Response::serverError('JSON Encode Error: ' . json_last_error_msg());
    }
    echo $json;
  }

  public function getYears()
  {
    $user = AuthMiddleware::authenticate();
    $role = $user['role'] ?? 'user';
    $isShiurManager = $role === 'shiur_manager';
    $managerShiurs = $user['shiurs'] ?? [];

    $sql = "SELECT shiur_year, COUNT(*) as count FROM graduates WHERE deleted_at IS NULL";
    $params = [];

    if ($isShiurManager) {
      if (empty($managerShiurs)) {
        Response::json([]);
        return;
      }
      $inParams = [];
      foreach ($managerShiurs as $index => $year) {
        $key = "m_shiur_$index";
        $inParams[] = ":$key";
        $params[$key] = $year;
      }
      $sql .= " AND shiur_year IN (" . implode(',', $inParams) . ")";
    }

    // Apply active filters (except shiur_year itself) for faceted counts
    $filtersParam = $_GET['filters'] ?? '';
    $search = $_GET['search'] ?? '';
    if ($filtersParam) {
      $filters = json_decode($filtersParam, true);
      if (is_array($filters)) {
        foreach ($filters as $index => $filter) {
          $id = $filter['id'] ?? '';
          $value = $filter['value'] ?? '';
          if ($id === 'shiur_year')
            continue; // skip own filter
          $valueArr = is_array($value) ? $value : [$value];
          $valueArr = array_filter($valueArr, fn($v) => $v !== '' && $v !== null);
          if (empty($valueArr))
            continue;

          if ($id === 'city') {
            if (in_array('isEmpty', $valueArr)) {
              $sql .= " AND (city IS NULL OR city = '')";
            } else {
              $inP = [];
              foreach ($valueArr as $ci => $city) {
                $k = "fc_city_{$index}_{$ci}";
                $inP[] = ":$k";
                $params[$k] = $city;
              }
              $sql .= " AND city IN (" . implode(',', $inP) . ")";
            }
          } else if ($id === 'phone') {
            if (in_array('isEmpty', $valueArr))
              $sql .= " AND (phone IS NULL OR phone = '')";
            else if (in_array('isNotEmpty', $valueArr))
              $sql .= " AND (phone IS NOT NULL AND phone != '')";
          }
        }
      }
    }
    if ($search) {
      $words = array_filter(explode(" ", trim($search)));
      foreach ($words as $wi => $word) {
        $sql .= " AND (first_name LIKE :sy_sa_$wi OR last_name LIKE :sy_sb_$wi)";
        $params["sy_sa_$wi"] = "%$word%";
        $params["sy_sb_$wi"] = "%$word%";
      }
    }

    $sql .= " GROUP BY shiur_year ORDER BY shiur_year DESC";

    $stmt = $this->db->prepare($sql);
    $stmt->execute($params);
    $years = $stmt->fetchAll();

    Response::json($years);
  }

  public function getCities()
  {
    $user = AuthMiddleware::authenticate();
    $role = $user['role'] ?? 'user';
    $isShiurManager = $role === 'shiur_manager';
    $managerShiurs = $user['shiurs'] ?? [];

    $sql = "SELECT city, COUNT(*) as count FROM graduates WHERE deleted_at IS NULL AND city IS NOT NULL AND city != ''";
    $params = [];

    if ($isShiurManager) {
      if (empty($managerShiurs)) {
        Response::json([]);
        return;
      }
      $inParams = [];
      foreach ($managerShiurs as $index => $year) {
        $key = "m_shiur_$index";
        $inParams[] = ":$key";
        $params[$key] = $year;
      }
      $sql .= " AND shiur_year IN (" . implode(',', $inParams) . ")";
    }

    // Apply active filters (except city itself) for faceted counts
    $filtersParam = $_GET['filters'] ?? '';
    $search = $_GET['search'] ?? '';
    if ($filtersParam) {
      $filters = json_decode($filtersParam, true);
      if (is_array($filters)) {
        foreach ($filters as $index => $filter) {
          $id = $filter['id'] ?? '';
          $value = $filter['value'] ?? '';
          if ($id === 'city')
            continue; // skip own filter
          $valueArr = is_array($value) ? $value : [$value];
          $valueArr = array_filter($valueArr, fn($v) => $v !== '' && $v !== null);
          if (empty($valueArr))
            continue;

          if ($id === 'shiur_year') {
            if (in_array('empty', $valueArr)) {
              $sql .= " AND (shiur_year IS NULL OR shiur_year = '')";
            } else {
              $inP = [];
              foreach ($valueArr as $yi => $year) {
                $k = "fc_year_{$index}_{$yi}";
                $inP[] = ":$k";
                $params[$k] = trim($year);
              }
              $sql .= " AND shiur_year IN (" . implode(',', $inP) . ")";
            }
          } else if ($id === 'phone') {
            if (in_array('isEmpty', $valueArr))
              $sql .= " AND (phone IS NULL OR phone = '')";
            else if (in_array('isNotEmpty', $valueArr))
              $sql .= " AND (phone IS NOT NULL AND phone != '')";
          }
        }
      }
    }
    if ($search) {
      $words = array_filter(explode(" ", trim($search)));
      foreach ($words as $wi => $word) {
        $sql .= " AND (first_name LIKE :ci_sa_$wi OR last_name LIKE :ci_sb_$wi)";
        $params["ci_sa_$wi"] = "%$word%";
        $params["ci_sb_$wi"] = "%$word%";
      }
    }

    $sql .= " GROUP BY city ORDER BY city ASC";

    $stmt = $this->db->prepare($sql);
    $stmt->execute($params);
    $cities = $stmt->fetchAll();

    Response::json($cities);
  }

  public function getFieldCounts()
  {
    $user = AuthMiddleware::authenticate();

    // Which fields to count
    $fields = ['phone', 'city', 'shiur_year'];

    // Parse active filters and search from query
    $filtersParam = $_GET['filters'] ?? '';
    $search = $_GET['search'] ?? '';
    $activeFilters = $filtersParam ? json_decode($filtersParam, true) : [];
    if (!is_array($activeFilters))
      $activeFilters = [];

    $result = [];

    foreach ($fields as $field) {
      $baseParams = [];

      // Base WHERE
      $baseWhere = " WHERE deleted_at IS NULL";

      // Apply all filters EXCEPT this field
      foreach ($activeFilters as $fIndex => $filter) {
        $fId = $filter['id'] ?? '';
        $fVal = $filter['value'] ?? '';
        if ($fId === $field)
          continue;
        $valueArr = is_array($fVal) ? $fVal : [$fVal];
        $valueArr = array_filter($valueArr, fn($v) => $v !== '' && $v !== null);
        if (empty($valueArr))
          continue;

        if ($fId === 'shiur_year') {
          if (in_array('empty', $valueArr)) {
            $baseWhere .= " AND (shiur_year IS NULL OR shiur_year = '')";
          } else {
            $inP = [];
            foreach ($valueArr as $yi => $yr) {
              $k = "fc_{$field}_{$fIndex}_{$yi}";
              $inP[] = ":$k";
              $baseParams[$k] = trim($yr);
            }
            $baseWhere .= " AND shiur_year IN (" . implode(',', $inP) . ")";
          }
        } else if ($fId === 'city') {
          if (in_array('isEmpty', $valueArr)) {
            $baseWhere .= " AND (city IS NULL OR city = '')";
          } else {
            $inP = [];
            foreach ($valueArr as $ci => $city) {
              $k = "fc_{$field}_{$fIndex}_{$ci}";
              $inP[] = ":$k";
              $baseParams[$k] = $city;
            }
            $baseWhere .= " AND city IN (" . implode(',', $inP) . ")";
          }
        } else if ($fId === 'phone') {
          if (in_array('isEmpty', $valueArr))
            $baseWhere .= " AND (phone IS NULL OR phone = '')";
          else if (in_array('isNotEmpty', $valueArr))
            $baseWhere .= " AND (phone IS NOT NULL AND phone != '')";
        }
      }

      // Apply search
      if ($search) {
        $words = array_filter(explode(" ", trim($search)));
        foreach ($words as $wi => $word) {
          $baseWhere .= " AND (first_name LIKE :fcs_a_{$field}_{$wi} OR last_name LIKE :fcs_b_{$field}_{$wi})";
          $baseParams["fcs_a_{$field}_{$wi}"] = "%$word%";
          $baseParams["fcs_b_{$field}_{$wi}"] = "%$word%";
        }
      }

      // Count empty
      $emptyCol = $field === 'shiur_year'
        ? "($field IS NULL OR $field = '')"
        : "($field IS NULL OR $field = '')";
      $stmtE = $this->db->prepare("SELECT COUNT(*) FROM graduates$baseWhere AND $emptyCol");
      $stmtE->execute($baseParams);
      $emptyCount = (int) $stmtE->fetchColumn();

      // Count not empty
      $notEmptyCol = $field === 'shiur_year'
        ? "($field IS NOT NULL AND $field != '')"
        : "($field IS NOT NULL AND $field != '')";
      $stmtN = $this->db->prepare("SELECT COUNT(*) FROM graduates$baseWhere AND $notEmptyCol");
      $stmtN->execute($baseParams);
      $notEmptyCount = (int) $stmtN->fetchColumn();

      $result[$field] = ['empty' => $emptyCount, 'notEmpty' => $notEmptyCount];
    }

    Response::json($result);
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

    if (!empty($data['shiur_year'])) {
      if (!$this->validateHebrewYear($data['shiur_year'])) {
        Response::validationError('shiur_year', 'Invalid Hebrew year format');
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

    if (isset($data['shiur_year']) && $data['shiur_year'] !== '') {
      if (!$this->validateHebrewYear($data['shiur_year'])) {
        Response::validationError('shiur_year', 'Invalid Hebrew year format');
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
