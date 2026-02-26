<?php

namespace App\Controllers;

use App\Config\Permissions;
use App\Core\Response;
use Firebase\JWT\JWT;
use PDO;

class AuthController extends BaseController
{

  public function login()
  {
    $data = $this->getJsonInput();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
      Response::error('Email and password are required');
    }

    $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // For MVP, if no users exist and credentials match hardcoded admin, let them in OR seed via script.
    // Assuming database is seeded.

    if (!$user || !password_verify($password, $user['password_hash'])) {
      // Setup fallback for initial super admin if the table is empty (Dev helper)
      // Remove this in production!
      // if ($email === 'admin@example.com' && $password === 'admin123' && !$user) {
      //   // Return a fake admin token for bootstrapping
      //   $this->issueToken([
      //     'id' => 0,
      //     'email' => 'admin@example.com',
      //     'role' => 'super_admin'
      //   ]);
      //   return;
      // }

      Response::unauthorized('Invalid credentials');
    }

    $payload = [
      'id' => $user['id'],
      'email' => $user['email'],
      'firstName' => $user['first_name'],
      'lastName' => $user['last_name'],
      'role' => $user['role'],
      'passwordChanged' => (bool) $user['password_changed'],
      'shiurs' => json_decode($user['shiurs_managed'] ?? '[]'),
      'permissions' => \App\Config\Permissions::getPermissionsForRole($user['role']),
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

    Response::json([
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
    Response::json(['user' => $user]);
  }
}
