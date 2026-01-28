<?php
require __DIR__ . '/../src/Config/Database.php';

use App\Config\Database;

$db = Database::getConnection();

try {
  // Check if column exists
  $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'password_changed'");
  $exists = $stmt->fetch();

  if (!$exists) {
    // Add password_changed column, default to 0 (false)
    // We assume existing users haven't changed it via this new mechanism, or we could set to 1 if we wanted.
    // Requirement says "users without password defined should be marked red", implying we want 0 for defaults.
    $sql = "ALTER TABLE users ADD COLUMN password_changed BOOLEAN NOT NULL DEFAULT 0";
    $db->exec($sql);
    echo "Column 'password_changed' added successfully.\n";
  } else {
    echo "Column 'password_changed' already exists.\n";
  }
} catch (PDOException $e) {
  echo "Error: " . $e->getMessage() . "\n";
}
