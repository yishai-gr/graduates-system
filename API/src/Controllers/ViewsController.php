<?php

namespace App\Controllers;

use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class ViewsController extends BaseController
{

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
      // Create placeholders for the IN clause: ?, ?, ?
      $placeholders = implode(',', array_fill(0, count($shiurs), '?'));

      $stmt = $this->db->prepare("SELECT COUNT(*) FROM graduates WHERE shiur_year IN ($placeholders) AND deleted_at IS NULL");
      $stmt->execute($shiurs);

      $stats['myGraduates'] = (int) $stmt->fetchColumn();
    }

    Response::json(['stats' => $stats]);
  }
}
