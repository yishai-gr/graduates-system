<?php

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware
{
  public static function authenticate()
  {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
      header('HTTP/1.1 401 Unauthorized');
      echo json_encode(['error' => ['message' => 'Token not provided']]);
      exit;
    }

    $jwt = $matches[1];
    $secretKey = $_ENV['JWT_SECRET'];

    try {
      $decoded = JWT::decode($jwt, new Key($secretKey, 'HS256'));
      $userData = (array) $decoded->data;
      
      // Store user role in $_SERVER for controllers to access
      $_SERVER['user_role'] = $userData['role'] ?? null;
      $_SERVER['user_id'] = $userData['id'] ?? null;
      
      return $userData;
    } catch (\Exception $e) {
      header('HTTP/1.1 401 Unauthorized');
      echo json_encode(['error' => ['message' => 'Invalid token']]);
      exit;
    }
  }
}
