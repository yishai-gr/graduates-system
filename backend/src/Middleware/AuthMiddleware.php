<?php

namespace App\Middleware;

use App\Core\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware implements MiddlewareInterface
{
  /**
   * Authenticate the request using JWT token
   */
  public static function handle(): void
  {
    self::authenticate();
  }

  /**
   * Authenticate and return user data
   */
  public static function authenticate(): array
  {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
      Response::unauthorized('Token not provided');
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
      Response::unauthorized('Invalid token');
    }

    return []; // Never reached, but keeps static analysis happy
  }
}
