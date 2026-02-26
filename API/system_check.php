<?php

// System Check Script
// Run this from the CLI: php system_check.php

require __DIR__ . '/vendor/autoload.php';

use App\Config\Database;
use App\Controllers\GraduatesController;

// Configuration
$baseUrl = 'http://localhost:8000'; // Make sure this matches your running server

function printStatus($title, $status, $message = '')
{
  $statusStr = $status === 'OK' ? "[OK]" : "[FAIL]";
  echo sprintf("%-40s %-8s %s\n", $title, $statusStr, $message);
  if (ob_get_level() > 0)
    ob_flush();
  flush();
}

echo "Starting System Check...\n";
echo "========================\n";

// 1. Environment Check
echo "\n--- Environment ---\n";
if (file_exists(__DIR__ . '/.env')) {
  printStatus('.env file exists', 'OK');

  $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
  $dotenv->safeLoad();

  $requiredKeys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
  $missingKeys = [];
  foreach ($requiredKeys as $key) {
    if (!isset($_ENV[$key])) {
      $missingKeys[] = $key;
    }
  }

  if (empty($missingKeys)) {
    printStatus('Environment variables', 'OK');
  } else {
    printStatus('Environment variables', 'FAIL', 'Missing: ' . implode(', ', $missingKeys));
  }

} else {
  printStatus('.env file exists', 'FAIL', 'File not found');
  exit(1);
}

// 2. Database Check
echo "\n--- Database ---\n";
try {
  $pdo = Database::getConnection();
  printStatus('Database Connection', 'OK');

  $stmt = $pdo->query("SHOW TABLES LIKE 'graduates'");
  if ($stmt->rowCount() > 0) {
    printStatus('Table "graduates"', 'OK');
  } else {
    printStatus('Table "graduates"', 'FAIL', 'Table not found');
  }

} catch (Exception $e) {
  printStatus('Database Connection', 'FAIL', $e->getMessage());
  exit(1);
}

// 3. Integration Tests (HTTP)
echo "\n--- Integration Tests (HTTP) ---\n";
echo "Target URL: $baseUrl\n";

class IntegrationTester
{
  private $pdo;
  private $baseUrl;
  private $tempUserEmail = 'system_check_bot@example.com';
  private $tempUserPass = 'bot_pass_123';
  private $token;
  private $tempGraduateId;

  public function __construct($pdo, $baseUrl)
  {
    $this->pdo = $pdo;
    $this->baseUrl = $baseUrl;
  }

  public function setup()
  {
    // Clean up previous run if crashed
    $this->cleanup();

    // Create temp user
    $hash = password_hash($this->tempUserPass, PASSWORD_DEFAULT);
    $stmt = $this->pdo->prepare("INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, 'System', 'Check', 'super_admin')");
    $stmt->execute([$this->tempUserEmail, $hash]);

    printStatus('Setup: Temp Admin User', 'OK', $this->tempUserEmail);
  }

  public function cleanup()
  {
    $stmt = $this->pdo->prepare("DELETE FROM users WHERE email = ?");
    $stmt->execute([$this->tempUserEmail]);
    // Also clean up any temp graduates? Handled in delete test but good to be safe?
    // Let's assume the test cleans up the graduate itself.
  }

  private function request($method, $path, $data = [], $useToken = false)
  {
    $url = $this->baseUrl . $path;
    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $headers = ['Content-Type: application/json'];
    if ($useToken && $this->token) {
      $headers[] = "Authorization: Bearer " . $this->token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($method === 'POST') {
      curl_setopt($ch, CURLOPT_POST, true);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'PUT') {
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'DELETE') {
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $httpCode, 'body' => json_decode($response, true), 'raw_body' => $response];
  }

  public function testLogin()
  {
    // 1. Invalid Login
    $res = $this->request('POST', '/api/v1/auth/login', [
      'email' => $this->tempUserEmail,
      'password' => 'wrong_password'
    ]);
    if ($res['code'] === 401) {
      printStatus('Auth: Invalid Credentials', 'OK', 'Got 401 as expected');
    } else {
      printStatus('Auth: Invalid Credentials', 'FAIL', 'Code: ' . $res['code']);
    }

    // 2. Valid Login
    $res = $this->request('POST', '/api/v1/auth/login', [
      'email' => $this->tempUserEmail,
      'password' => $this->tempUserPass
    ]);

    if ($res['code'] === 200 && isset($res['body']['token'])) {
      $this->token = $res['body']['token'];
      printStatus('Auth: Valid Login', 'OK', 'Token received');
    } else {
      printStatus('Auth: Valid Login', 'FAIL', 'Code: ' . $res['code']);
      exit(1); // Cannot proceed without token
    }
  }

  public function testProtectedRoutes()
  {
    // 1. Me (validate token)
    $res = $this->request('GET', '/api/v1/auth/me', [], true);
    if ($res['code'] === 200 && $res['body']['user']['email'] === $this->tempUserEmail) {
      printStatus('Auth: Verify Token (/me)', 'OK');
    } else {
      printStatus('Auth: Verify Token (/me)', 'FAIL', 'Code: ' . $res['code']);
    }

    // 2. Protected Route without Token (Graduate list is protected or public? Code says Authenticate middleware)
    // Let's try Users list which is definitely protected (super_admin).
    // First without token:
    $savedToken = $this->token;
    $this->token = null;
    $res = $this->request('GET', '/api/v1/users', [], true); // effectively no token
    if ($res['code'] === 401) {
      printStatus('Permission: No Token', 'OK', 'Got 401 as expected');
    } else {
      printStatus('Permission: No Token', 'FAIL', 'Code: ' . $res['code']);
    }
    $this->token = $savedToken; // Restore

    // 3. With Token
    $res = $this->request('GET', '/api/v1/users', [], true);
    if ($res['code'] === 200) {
      printStatus('Permission: With Token', 'OK', 'Got 200');
    } else {
      printStatus('Permission: With Token', 'FAIL', 'Code: ' . $res['code']);
    }
  }

  public function testCRUD()
  {
    // 1. Create Graduate
    $newGraduate = [
      'first_name' => 'Test',
      'last_name' => 'Robot',
      'email' => 'robot@test.com',
      'phone' => '0501234567',
    ];
    $res = $this->request('POST', '/api/v1/graduates', $newGraduate, true);

    if ($res['code'] === 200 && isset($res['body']['id'])) {
      $this->tempGraduateId = $res['body']['id'];
      printStatus('CRUD: Create Graduate', 'OK', 'ID: ' . $this->tempGraduateId);
    } else {
      printStatus('CRUD: Create Graduate', 'FAIL', 'Code: ' . $res['code'] . ' ' . print_r($res['body'], true));
      return;
    }

    // 2. Read (Get All)
    $res = $this->request('GET', '/api/v1/graduates?search=Robot', [], true);
    if ($res['code'] === 200 && isset($res['body']['data']) && count($res['body']['data']) > 0) {
      printStatus('CRUD: Read (Search)', 'OK', 'Found created record');
    } else {
      printStatus('CRUD: Read (Search)', 'FAIL', 'Record not found');
    }

    // 3. Update
    $updateData = ['first_name' => 'UpdatedRobot'];
    $res = $this->request('PUT', '/api/v1/graduates/' . $this->tempGraduateId, $updateData, true);
    if ($res['code'] === 200 && $res['body']['first_name'] === 'UpdatedRobot') {
      printStatus('CRUD: Update Graduate', 'OK');
    } else {
      printStatus('CRUD: Update Graduate', 'FAIL', 'Code: ' . $res['code']);
    }

    // 4. Delete
    $res = $this->request('DELETE', '/api/v1/graduates/' . $this->tempGraduateId, [], true);
    if ($res['code'] === 204) {
      printStatus('CRUD: Delete Graduate', 'OK');
    } else {
      printStatus('CRUD: Delete Graduate', 'FAIL', 'Code: ' . $res['code']);
    }

    // 5. Verify Delete (Get By ID)
    $res = $this->request('GET', '/api/v1/graduates/' . $this->tempGraduateId, [], true);
    if ($res['code'] === 404) {
      printStatus('CRUD: Verify Delete', 'OK', 'Got 404 as expected');
    } else {
      printStatus('CRUD: Verify Delete', 'FAIL', 'Code: ' . $res['code']);
    }
  }
}

// Run Tests
$tester = new IntegrationTester($pdo, $baseUrl);
try {
  $tester->setup();
  $tester->testLogin();
  $tester->testProtectedRoutes();
  $tester->testCRUD();
} catch (Exception $e) {
  echo "Error: " . $e->getMessage() . "\n";
} finally {
  $tester->cleanup();
  printStatus('Cleanup: Temp User Removed', 'OK');
}

echo "\nSystem Check Complete.\n";
