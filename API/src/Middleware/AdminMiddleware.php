<?php

namespace App\Middleware;

use App\Core\Response;

class AdminMiddleware implements MiddlewareInterface
{
  /**
   * Verify that the current user is a super_admin
   * Must be used AFTER AuthMiddleware
   */
  public static function handle(): void
  {
    if (!isset($_SERVER['user_role']) || $_SERVER['user_role'] !== 'super_admin') {
      Response::error('Only administrators can access this resource', 403);
    }
  }
}
