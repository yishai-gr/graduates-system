<?php
require __DIR__ . '/../src/Config/Database.php';

use App\Config\Database;

$db = Database::getConnection();

// hardcoded for debugging the user's issue
$email = 'admin@example.com';
// Or accept from CLI args if I could run it interactively easily, but hardcoding common admin email first.
// I'll check ALL users to be safe.

echo "--- Users Dump ---\n";
$stmt = $db->query("SELECT id, email, password_hash, role, password_changed FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $u) {
  echo "ID: " . $u['id'] . "\n";
  echo "Email: " . $u['email'] . "\n";
  echo "Role: " . $u['role'] . "\n";
  echo "Hash: " . $u['password_hash'] . "\n";
  echo "Hash Len: " . strlen($u['password_hash']) . "\n";
  echo "Password Changed: " . $u['password_changed'] . "\n";
  echo "----------------\n";
}

// Check column type
echo "\n--- Column info ---\n";
try {
  $stmt = $db->query("DESCRIBE users");
  $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
  foreach ($columns as $col) {
    if ($col['Field'] === 'password_hash') {
      echo "Field: " . $col['Field'] . ", Type: " . $col['Type'] . "\n";
    }
  }
} catch (Exception $e) {
  echo "Could not describe table: " . $e->getMessage() . "\n";
}
