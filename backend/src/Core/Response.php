<?php

namespace App\Core;

class Response
{
  /**
   * Send a JSON response
   */
  public static function json($data, int $status = 200): void
  {
    http_response_code($status);
    echo json_encode($data);
    exit;
  }

  /**
   * Send a success response with data
   */
  public static function success($data): void
  {
    self::json($data, 200);
  }

  /**
   * Send an error response
   */
  public static function error(string $message, int $status = 400): void
  {
    http_response_code($status);
    echo json_encode(['error' => ['message' => $message]]);
    exit;
  }

  /**
   * Send a validation error response
   */
  public static function validationError(string $field, string $message): void
  {
    http_response_code(400);
    echo json_encode([
      'error' => 'VALIDATION_ERROR',
      'field' => $field,
      'message' => $message
    ]);
    exit;
  }

  /**
   * Send a 404 Not Found response
   */
  public static function notFound(string $message = 'Not found'): void
  {
    self::error($message, 404);
  }

  /**
   * Send a 401 Unauthorized response
   */
  public static function unauthorized(string $message = 'Unauthorized'): void
  {
    self::error($message, 401);
  }

  /**
   * Send a 204 No Content response
   */
  public static function noContent(): void
  {
    http_response_code(204);
    exit;
  }

  /**
   * Send a 500 Internal Server Error response
   */
  public static function serverError(string $message = 'Internal server error'): void
  {
    self::error($message, 500);
  }

  /**
   * Send a 405 Method Not Allowed response
   */
  public static function methodNotAllowed(): void
  {
    self::error('Method not allowed', 405);
  }
}
