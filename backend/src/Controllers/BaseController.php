<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;

abstract class BaseController
{
  protected PDO $db;

  public function __construct()
  {
    $this->db = Database::getConnection();
  }

  /**
   * Get JSON input from request body
   */
  protected function getJsonInput(): array
  {
    $input = file_get_contents("php://input");
    return json_decode($input, true) ?? [];
  }

  protected function validateHebrewYear($year)
  {
    return preg_match('/^[\x{0590}-\x{05FF}\'"\s]+$/u', $year);
  }
}
