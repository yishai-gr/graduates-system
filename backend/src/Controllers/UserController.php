<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;

class UserController
{
  private $db;

  public function __construct()
  {
    $this->db = Database::getConnection();
  }

  public function getAll()
  {
    $sql = "SELECT id, email, first_name as firstName, last_name as lastName, role, shiurs_managed FROM users ORDER BY first_name ASC";
    $stmt = $this->db->query($sql);
    $users = $stmt->fetchAll();

    // Decode shiurs_managed for each user
    foreach ($users as &$user) {
      $user['shiurs'] = json_decode($user['shiurs_managed'] ?? '[]');
      unset($user['shiurs_managed']);
    }

    // Return in format expected by PaginatedResponse
    // For now, assuming no server-side pagination for MVP or small user counts
    // If we want pagination, we can parse $_GET['page'] etc. 
    // But for simplicity let's return all and let frontend paginate or implement simple slicing here.
    // The frontend expects { data: [], total: N, ... }

    // Let's implement basic search/filter if needed, OR just return all for CLIENT-SIDE pagination for now 
    // as the MockService was doing robust client-side filtering.
    // Ideally we do it server side. Let's do a simple GetAll for now.

    echo json_encode([
      'data' => $users,
      'total' => count($users),
      'page' => 1,
      'pageSize' => count($users)
    ]);
  }

  public function getById($id)
  {
    $stmt = $this->db->prepare("SELECT id, email, first_name as firstName, last_name as lastName, role, shiurs_managed FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
      header('HTTP/1.1 404 Not Found');
      echo json_encode(['error' => ['message' => 'User not found']]);
      return;
    }

    $user['shiurs'] = json_decode($user['shiurs_managed'] ?? '[]');
    unset($user['shiurs_managed']);

    echo json_encode($user);
  }

  public function create()
  {
    $data = json_decode(file_get_contents("php://input"), true);

    $email = $data['email'] ?? '';
    $firstName = $data['firstName'] ?? '';
    $lastName = $data['lastName'] ?? '';
    $role = $data['role'] ?? 'shiur_manager';
    $shiurs = $data['shiurs'] ?? [];

    if (!$email || !$firstName || !$lastName) {
      header('HTTP/1.1 400 Bad Request');
      echo json_encode(['error' => ['message' => 'Missing required fields']]);
      return;
    }

    // Check if email exists
    $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
      header('HTTP/1.1 400 Bad Request');
      // frontend expects this structure for "Email already exists"
      echo json_encode(['error' => ['message' => 'Email already exists']]);
      return;
    }

    // Default password for new users
    $defaultPassword = password_hash("123456", PASSWORD_DEFAULT);
    $shiursJson = json_encode($shiurs);

    $sql = "INSERT INTO users (email, password_hash, first_name, last_name, role, shiurs_managed) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $this->db->prepare($sql);

    try {
      $stmt->execute([$email, $defaultPassword, $firstName, $lastName, $role, $shiursJson]);
      $id = $this->db->lastInsertId();

      echo json_encode([
        'id' => $id,
        'email' => $email,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'role' => $role,
        'shiurs' => $shiurs
      ]);
    } catch (\PDOException $e) {
      header('HTTP/1.1 500 Internal Server Error');
      echo json_encode(['error' => ['message' => 'Database error: ' . $e->getMessage()]]);
    }
  }

  public function update($id)
  {
    $data = json_decode(file_get_contents("php://input"), true);

    // Fetch existing
    $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
      header('HTTP/1.1 404 Not Found');
      echo json_encode(['error' => ['message' => 'User not found']]);
      return;
    }

    // Prepare updates
    // Note: keeping current values if not provided is usually good practice, 
    // but typically PUT sends whole object. Let's assume partial updates support or fallbacks.
    $firstName = $data['firstName'] ?? $user['first_name'];
    $lastName = $data['lastName'] ?? $user['last_name'];
    $email = $data['email'] ?? $user['email'];
    $role = $data['role'] ?? $user['role'];
    $shiurs = isset($data['shiurs']) ? json_encode($data['shiurs']) : $user['shiurs_managed'];

    // Check email uniqueness if changed
    if ($email !== $user['email']) {
      $check = $this->db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
      $check->execute([$email, $id]);
      if ($check->fetch()) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => ['message' => 'Email already exists']]);
        return;
      }
    }

    $sql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, role = ?, shiurs_managed = ? WHERE id = ?";
    $stmt = $this->db->prepare($sql);

    try {
      $stmt->execute([$firstName, $lastName, $email, $role, $shiurs, $id]);

      // Return updated
      echo json_encode([
        'id' => $id,
        'email' => $email,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'role' => $role,
        'shiurs' => json_decode($shiurs)
      ]);
    } catch (\PDOException $e) {
      header('HTTP/1.1 500 Internal Server Error');
      echo json_encode(['error' => ['message' => 'Database error']]);
    }
  }

  public function delete($id)
  {
    $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
    try {
      $stmt->execute([$id]);
      http_response_code(204);
    } catch (\PDOException $e) {
      header('HTTP/1.1 500 Internal Server Error');
      echo json_encode(['error' => ['message' => 'Could not delete user']]);
    }
  }
}
