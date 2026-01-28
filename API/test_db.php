<?php

require __DIR__ . '/vendor/autoload.php';

use App\Config\Database;

echo "--- PHP Diagnostic Script ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Loaded Extensions:\n";
$exts = get_loaded_extensions();
if (in_array('pdo_mysql', $exts)) {
  echo "✅ pdo_mysql is loaded\n";
} else {
  echo "❌ pdo_mysql is NOT loaded\n";
}

echo "\n--- Testing Database Connection ---\n";
try {
  // Manually load dotenv to be sure
  $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
  $dotenv->load();

  echo "DB Config from .env:\n";
  echo "HOST: " . $_ENV['DB_HOST'] . "\n";
  echo "DB:   " . $_ENV['DB_NAME'] . "\n";
  echo "USER: " . $_ENV['DB_USER'] . "\n";

  $pdo = Database::getConnection();
  echo "✅ Success! Connected to database.\n";

  $stmt = $pdo->query("SELECT count(*) as count FROM users");
  $row = $stmt->fetch();
  echo "Users count: " . $row['count'] . "\n";

} catch (Exception $e) {
  echo "❌ Error: " . $e->getMessage() . "\n";
  if ($e instanceof PDOException) {
    echo "PDO Code: " . $e->getCode() . "\n";
  }
}
