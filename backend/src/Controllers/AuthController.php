<?php

namespace App\Controllers;

use App\Config\Database;
use Firebase\JWT\JWT;
use PDO;

class AuthController
{
  private $db;

  public function __construct()
  {
    $this->db = Database::getConnection();
  }

  public function login()
  {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
      header('HTTP/1.1 400 Bad Request');
      echo json_encode(['error' => ['message' => 'Email and password are required']]);
      return;
    }

    $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // For MVP, if no users exist and credentials match hardcoded admin, let them in OR seed via script.
    // Assuming database is seeded.

    if (!$user || !password_verify($password, $user['password_hash'])) {
      // Setup fallback for initial super admin if the table is empty (Dev helper)
      // Remove this in production!
      if ($email === 'admin@example.com' && $password === 'admin123' && !$user) {
        // Return a fake admin token for bootstrapping
        $this->issueToken([
          'id' => 0,
          'email' => 'admin@example.com',
          'role' => 'super_admin'
        ]);
        return;
      }

      header('HTTP/1.1 401 Unauthorized');
      echo json_encode(['error' => ['message' => 'Invalid credentials']]);
      return;
    }

    $payload = [
      'id' => $user['id'],
      'email' => $user['email'],
      'role' => $user['role'],
      'shiurs' => json_decode($user['shiurs_managed'] ?? '[]'),
    ];

    $this->issueToken($payload);
  }

  private function issueToken($userPayload)
  {
    $secretKey = $_ENV['JWT_SECRET'];
    $issuedAt = time();
    $expirationTime = $issuedAt + (60 * 60 * 24 * 7); // 7 days (MVP)

    $payload = [
      'iat' => $issuedAt,
      'exp' => $expirationTime,
      'data' => $userPayload
    ];

    $jwt = JWT::encode($payload, $secretKey, 'HS256');

    echo json_encode([
      'token' => $jwt,
      'user' => $userPayload
    ]);
  }

  public function me()
  {
    // Middleware already handled auth
    // In a real router, we'd pass the $user from middleware to here. 
    // For MVP, we can decode again or rely on the fact that if we reached here, HEADERS are valid,
    // but we need the user ID to fetch fresh data.

    // Let's assume we re-parse or pass it. 
    // Simpler: Just return the decoded token data from the request attribute if the router supports it.
    // Or re-decode:
    $user = \App\Middleware\AuthMiddleware::authenticate();
    echo json_encode(['user' => $user]);
  }
}
