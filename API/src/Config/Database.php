<?php

namespace App\Config;

require_once __DIR__ . '/../../vendor/autoload.php';

// Load Environment Variables
$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->safeLoad();


use PDO;
use PDOException;


class Database
{
    private static $instance = null;
    private $pdo;

    private function __construct()
    {
        // Load env if not already loaded (depending on entry point)
        // Assuming Dotenv is loaded in index.php commonly, but safe to check

        $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
        $db = $_ENV['DB_NAME'] ?? 'graduates_db';
        $user = $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASS'] ?? '';
        $charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            header('HTTP/1.1 500 Internal Server Error');
            // For debugging: showing the actual SQL error
            echo json_encode(['error' => ['message' => 'Database connection failed: ' . $e->getMessage()]]);
            exit;
        }
    }

    public static function getConnection()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->pdo;
    }
}
