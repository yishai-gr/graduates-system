<?php

namespace App\Controllers;

use App\Core\Response;
use PDO;

class UserController extends BaseController
{

  public function getAll()
  {
    $sql = "SELECT id, email, first_name as firstName, last_name as lastName, role, shiurs_managed, password_changed as passwordChanged FROM users ORDER BY first_name ASC";
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

    Response::json([
      'data' => $users,
      'total' => count($users),
      'page' => 1,
      'pageSize' => count($users)
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
    $shiurs = isset($data['shiurs']) ? json_encode($data['shiurs']) : $user['shiurs_managed'];

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
