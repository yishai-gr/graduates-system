<?php

use App\Core\Router;

$router = new Router();

// ============================================
// Public Routes (no authentication required)
// ============================================

$router->group(prefix: '/api/v1', callback: function ($router) {

  // Public Routes
  $router->group(callback: function ($router) {
    $router->get('/views/home', 'ViewsController', 'home');

    // Auth Routes
    $router->group(prefix: '/auth', controller: 'AuthController', callback: function ($router) {
      $router->post('/login', 'login');
      $router->get('/me', 'me');
    });

    $router->get('/graduates/import/sample/{format}', 'ImportController', 'downloadSample');
  });

  // Protected Routes
  $router->group(middleware: 'auth', callback: function ($router) {

    // Users Resource
    $router->group(prefix: '/users', controller: 'UserController', callback: function ($router) {
      $router->get('', 'getAll');
      $router->get('/{id}', 'getById');
      $router->post('', 'create');
      $router->put('/{id}', 'update');
      $router->delete('/{id}', 'delete');
    });

    // Graduates Resource
    $router->group(prefix: '/graduates', callback: function ($router) {

      $router->group(controller: 'GraduatesController', callback: function ($router) {
        $router->get('', 'getAll');
        $router->get('/{id}', 'getById');
        $router->post('', 'create');
        $router->put('/{id}', 'update');
        $router->delete('/{id}', 'delete');
      });

      // Import Operations (Admin only)
      $router->group(prefix: '/import', middleware: 'admin', controller: 'ImportController', callback: function ($router) {
        $router->post('/preview', 'preview');
        $router->post('/confirm', 'confirm');
      });
    });

  });

});

return $router;
