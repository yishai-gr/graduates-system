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
}
