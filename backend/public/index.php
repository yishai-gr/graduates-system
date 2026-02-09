<?php
// Deployment Trigger: Force Update

// CORS - Robust Handling - Moved to Top
if (isset($_SERVER['HTTP_ORIGIN'])) {
  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Max-Age: 86400'); // Cache preflight for 1 day
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  }
  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
    // Allow whatever headers the client is asking for
    header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
  }
  exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

require __DIR__ . '/../vendor/autoload.php';

// Load Environment Variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Detect Base Path automatically to support subfolder deployment (e.g. /test)
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);
$basePath = $scriptDir === '/' ? '' : $scriptDir; // "/backend/public" or "" or "/subfolder/backend/public"
// If the server points directly to backend/public, basePath might be "" or close to it. 
// If we are deploying where index.php is in root, logic changes. 
// Let's assume standard "api" prefix check for now, independent of base path if possible, 
// OR simply strip the known base path.

// Simple strategy: Check if URI contains "/api/". 
// If it does, treat as API. If not, serve Frontend.

if (strpos($uri, '/api/') !== false) {
  // API Request Handling - Use Router
  $router = require __DIR__ . '/../src/routes.php';
  $router->dispatch();
} else {
  // SPA Fallback: Serve frontend/dist/index.html
  // Adjust path relative to this file: ./index.php -> ../../frontend/dist/index.html
  $frontendIndex = __DIR__ . '/../../frontend/dist/index.html';

  if (file_exists($frontendIndex)) {
    // Serve the file with correct mime type is usually handled by server, but here we output content.
    header("Content-Type: text/html");
    readfile($frontendIndex);
  } else {
    // If frontend not built or found
    echo "Backend is running. Frontend build not found at $frontendIndex";
  }
}
