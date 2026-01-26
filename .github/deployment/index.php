<?php
/**
 * PRODUCTION ENTRY POINT
 * This file is executed when valid requests hit the document root on the server.
 * It is copied to the root directory by the GitHub Action.
 */

require __DIR__ . '/backend/vendor/autoload.php';

// Load Environment Variables from Root
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Simple Base Path Detection
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);
// If script is at /index.php, scriptDir is / (or \ on windows)
// If script is at /subfolder/index.php, it's /subfolder

// We don't need complex replacements if we just look for /api/
if (strpos($uri, '/api/') !== false) {
  // API Request Handling
  $apiPath = substr($uri, strpos($uri, '/api/'));
  $parts = explode('/', trim($apiPath, '/'));

  if (count($parts) < 2 || $parts[0] !== 'api' || $parts[1] !== 'v1') {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'Invalid API version']);
    exit;
  }

  $resource = $parts[2] ?? null;
  $id = $parts[3] ?? null;
  $method = $_SERVER['REQUEST_METHOD'];

  // Routing Logic
  if ($resource === 'auth' && $parts[3] === 'login' && $method === 'POST') {
    (new \App\Controllers\AuthController())->login();
  } elseif ($resource === 'auth' && $parts[3] === 'me' && $method === 'GET') {
    (new \App\Controllers\AuthController())->me();
  } elseif ($resource === 'users') {
    \App\Middleware\AuthMiddleware::authenticate();
    $controller = new \App\Controllers\UserController();
    if ($method === 'GET') {
      $id ? $controller->getById($id) : $controller->getAll();
    } elseif ($method === 'POST') {
      $controller->create();
    } elseif ($method === 'PUT' && $id) {
      $controller->update($id);
    } elseif ($method === 'DELETE' && $id) {
      $controller->delete($id);
    } else {
      header('HTTP/1.1 405 Method Not Allowed');
    }
  } elseif ($resource === 'graduates') {
    \App\Middleware\AuthMiddleware::authenticate();
    $controller = new \App\Controllers\GraduatesController();
    if ($method === 'GET') {
      $id ? $controller->getById($id) : $controller->getAll();
    } elseif ($method === 'POST') {
      $controller->create();
    } elseif ($method === 'PUT' && $id) {
      $controller->update($id);
    } elseif ($method === 'DELETE' && $id) {
      $controller->delete($id);
    } else {
      header('HTTP/1.1 405 Method Not Allowed');
    }
  } else {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => ['message' => 'Endpoint not found']]);
  }
} else {
  // SPA Fallback: Serve frontend/dist/index.html
  // Assuming structure: /index.php, /frontend/dist/index.html
  $frontendIndex = __DIR__ . '/frontend/dist/index.html';

  if (file_exists($frontendIndex)) {
    header("Content-Type: text/html");
    readfile($frontendIndex);
  } else {
    echo "Backend is running. Frontend build not found at $frontendIndex";
  }
}
