<?php
require __DIR__ . '/../src/Config/Database.php';

use App\Config\Database;

$db = Database::getConnection();

// Find users with empty password_hash
$stmt = $db->query("SELECT id, email FROM users WHERE password_hash = '' OR password_hash IS NULL");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($users)) {
  echo "No users found with empty password hash.\n";
  exit;
}

echo "Found " . count($users) . " users with empty password hash. Fixing...\n";

$defaultPass = password_hash("123456", PASSWORD_DEFAULT);

$updateStmt = $db->prepare("UPDATE users SET password_hash = ?, password_changed = 0 WHERE id = ?");

foreach ($users as $u) {
  echo "Fixing user: " . $u['email'] . " (ID: " . $u['id'] . ")\n";
  $updateStmt->execute([$defaultPass, $u['id']]);
}

echo "Done.\n";
