<?php

use App\Core\Router;

$router = new Router();

// ============================================
// Public Routes (no authentication required)
// ============================================

$router->get('/api/v1/views/home', 'ViewsController', 'home');
$router->post('/api/v1/auth/login', 'AuthController', 'login');
$router->get('/api/v1/auth/me', 'AuthController', 'me');
$router->get('/api/v1/graduates/import/sample/{format}', 'ImportController', 'downloadSample');

// ============================================
// Protected Routes (require authentication)
// ============================================

$router->group(['prefix' => '/api/v1', 'middleware' => 'auth'], function ($router) {

  // Users CRUD
  $router->get('/users', 'UserController', 'getAll');
  $router->get('/users/{id}', 'UserController', 'getById');
  $router->post('/users', 'UserController', 'create');
  $router->put('/users/{id}', 'UserController', 'update');
  $router->delete('/users/{id}', 'UserController', 'delete');

  // Graduates CRUD
  $router->get('/graduates', 'GraduatesController', 'getAll');
  $router->get('/graduates/{id}', 'GraduatesController', 'getById');
  $router->post('/graduates', 'GraduatesController', 'create');
  $router->put('/graduates/{id}', 'GraduatesController', 'update');
  $router->delete('/graduates/{id}', 'GraduatesController', 'delete');

  // Import operations (admin only)
  $router->post('/graduates/import/preview', 'ImportController', 'preview')
    ->middleware('admin');
  $router->post('/graduates/import/confirm', 'ImportController', 'confirm')
    ->middleware('admin');
});

return $router;
