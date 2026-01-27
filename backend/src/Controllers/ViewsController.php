<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use PDO;

class ViewsController
{
  private $db;

  public function __construct()
  {
    $this->db = Database::getConnection();
  }

  public function home()
  {
    $user = AuthMiddleware::authenticate();
    $role = $user['role'] ?? 'user';
    $isSuperAdmin = $role === 'super_admin';

    $stats = [
      'totalGraduates' => 0,
      'newGraduatesLastMonth' => 0,
      'totalUsers' => 0,
      'adminsCount' => 0,
      'coordinatorsCount' => 0,
      'myGraduates' => 0
    ];

    // 1. Total Graduates (Visible to everyone)
    $stmt = $this->db->query("SELECT COUNT(*) FROM graduates WHERE deleted_at IS NULL");
    $stats['totalGraduates'] = (int) $stmt->fetchColumn();

    // 2. New Graduates in the last month
    $stmt = $this->db->query("SELECT COUNT(*) FROM graduates WHERE deleted_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)");
    $stats['newGraduatesLastMonth'] = (int) $stmt->fetchColumn();

    // 3. User Stats (Visible to Super Admin)
    if ($isSuperAdmin) {
      $stmt = $this->db->query("SELECT COUNT(*) FROM users");
      $stats['totalUsers'] = (int) $stmt->fetchColumn();

      $stmt = $this->db->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
      $roles = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // 'super_admin' => 5, 'shiur_manager' => 10

      $stats['adminsCount'] = (int) ($roles['super_admin'] ?? 0);
      $stats['coordinatorsCount'] = (int) ($roles['shiur_manager'] ?? 0);
    }

    // 4. My Graduates (Visible to everyone with shiurs)
    $shiurs = $user['shiurs'] ?? [];

    if (!empty($shiurs)) {
      // sanitize integers
      $shiurSafe = [];
      foreach ($shiurs as $s) {
        if (is_numeric($s))
          $shiurSafe[] = (int) $s;
      }

      if (!empty($shiurSafe)) {
        $inQuery = implode(',', $shiurSafe);
        $stmt = $this->db->query("SELECT COUNT(*) FROM graduates WHERE shiur_year IN ($inQuery) AND deleted_at IS NULL");
        $stats['myGraduates'] = (int) $stmt->fetchColumn();
      }
    }

    echo json_encode([
      'stats' => $stats
    ]);
  }
}
