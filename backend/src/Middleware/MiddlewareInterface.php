<?php

namespace App\Middleware;

interface MiddlewareInterface
{
  /**
   * Handle the middleware logic
   * Should call Response methods to halt execution if necessary
   */
  public static function handle(): void;
}
