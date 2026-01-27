<?php
require __DIR__ . '/../src/Config/Database.php';

use App\Config\Database;

$db = Database::getConnection();

$email = 'a@a.com';
$newPassword = '123456';

echo "Resetting password for $email to '$newPassword'...\n";

// Hash it
$hash = password_hash($newPassword, PASSWORD_DEFAULT);

// Update
$stmt = $db->prepare("UPDATE users SET password_hash = ?, password_changed = 1 WHERE email = ?");
$stmt->execute([$hash, $email]);

echo "Password updated.\n";

// Verify immediately
$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
  echo "User found. ID: " . $user['id'] . "\n";
  echo "Hash: " . $user['password_hash'] . "\n";

  if (password_verify($newPassword, $user['password_hash'])) {
    echo "SUCCESS: password_verify passed for '$newPassword'.\n";
  } else {
    echo "FAILURE: password_verify failed.\n";
  }
} else {
  echo "User not found!\n";
}
