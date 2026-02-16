<?php

namespace App\Core;

class Router
{
  private array $routes = [];
  private array $groupStack = [];

  /**
   * Middleware class registry
   */
  private array $middlewareRegistry = [
    'auth' => \App\Middleware\AuthMiddleware::class,
    'admin' => \App\Middleware\AdminMiddleware::class,
  ];

  /**
   * Register a GET route
   */
  public function get(string $path, string $action_or_controller, ?string $action = null): self
  {
    return $this->addRoute('GET', $path, $action_or_controller, $action);
  }

  /**
   * Register a POST route
   */
  public function post(string $path, string $action_or_controller, ?string $action = null): self
  {
    return $this->addRoute('POST', $path, $action_or_controller, $action);
  }

  /**
   * Register a PUT route
   */
  public function put(string $path, string $action_or_controller, ?string $action = null): self
  {
    return $this->addRoute('PUT', $path, $action_or_controller, $action);
  }

  /**
   * Register a DELETE route
   */
  public function delete(string $path, string $action_or_controller, ?string $action = null): self
  {
    return $this->addRoute('DELETE', $path, $action_or_controller, $action);
  }

  /**
   * Add middleware to the last registered route
   */
  public function middleware(string $middleware): self
  {
    $lastIndex = count($this->routes) - 1;
    if ($lastIndex >= 0) {
      $this->routes[$lastIndex]['middleware'][] = $middleware;
    }
    return $this;
  }

  /**
   * Create a route group with shared attributes
   */
  public function group(string $prefix = '', array|string $middleware = [], ?string $controller = null, ?callable $callback = null): self
  {
    $options = [
      'prefix' => $prefix,
      'middleware' => $middleware,
      'controller' => $controller,
    ];
    $this->groupStack[] = $options;

    if ($callback) {
      $callback($this);
    }

    array_pop($this->groupStack);
    return $this;
  }

  /**
   * Internal method to add a route
   */
  private function addRoute(string $method, string $path, string $action_or_controller, ?string $action = null): self
  {
    $prefix = '';
    $middleware = [];
    $controller = null;

    // Resolve controller and action
    if ($action === null) {
      $action = $action_or_controller;
    } else {
      $controller = $action_or_controller;
    }

    // Apply group attributes
    foreach ($this->groupStack as $group) {
      if (isset($group['prefix'])) {
        $prefix .= $group['prefix'];
      }
      if (isset($group['middleware'])) {
        // Support both single middleware and array of middlewares
        $groupMiddleware = $group['middleware'];
        if (is_array($groupMiddleware)) {
          $middleware = array_merge($middleware, $groupMiddleware);
        } else {
          $middleware[] = $groupMiddleware;
        }
      }
      // If controller wasn't explicitly provided, look for it in the group
      if ($controller === null && isset($group['controller'])) {
        $controller = $group['controller'];
      }
    }

    if ($controller === null) {
      throw new \Exception("Controller not defined for route: $method $path");
    }

    $this->routes[] = [
      'method' => $method,
      'path' => $prefix . $path,
      'controller' => $controller,
      'action' => $action,
      'middleware' => $middleware,
    ];

    return $this;
  }

  /**
   * Dispatch the current request to the appropriate controller
   */
  public function dispatch(): void
  {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];

    // Extract API path (everything from /api/ onwards)
    if (strpos($uri, '/api/') !== false) {
      $uri = substr($uri, strpos($uri, '/api/'));
    }

    // Find matching route
    foreach ($this->routes as $route) {
      $params = $this->matchRoute($route['path'], $uri);

      if ($params !== false && $route['method'] === $method) {
        // Run middleware
        foreach ($route['middleware'] as $middleware) {
          $this->runMiddleware($middleware);
        }

        // Instantiate controller and call action
        $controllerClass = "App\\Controllers\\" . $route['controller'];
        $controller = new $controllerClass();
        $action = $route['action'];

        // Call action with or without params
        if (!empty($params)) {
          $controller->$action(...array_values($params));
        } else {
          $controller->$action();
        }
        return;
      }
    }

    // Check if any route matches the path but with different method
    foreach ($this->routes as $route) {
      if ($this->matchRoute($route['path'], $uri) !== false) {
        header('HTTP/1.1 405 Method Not Allowed');
        echo json_encode(['error' => ['message' => 'Method not allowed']]);
        return;
      }
    }

    // No route found
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => ['message' => 'Endpoint not found']]);
  }

  /**
   * Match a route pattern against a URI
   * Returns false if no match, or array of parameters if match
   */
  private function matchRoute(string $pattern, string $uri): array|false
  {
    // Normalize paths
    $pattern = rtrim($pattern, '/');
    $uri = rtrim($uri, '/');

    // Convert route pattern to regex
    // {param} becomes a named capture group
    $regex = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';

    if (preg_match($regex, $uri, $matches)) {
      // Extract only named parameters
      $params = [];
      foreach ($matches as $key => $value) {
        if (is_string($key)) {
          $params[$key] = $value;
        }
      }
      return $params;
    }

    return false;
  }

  /**
   * Run a middleware
   */
  private function runMiddleware(string $middleware): void
  {
    if (isset($this->middlewareRegistry[$middleware])) {
      $middlewareClass = $this->middlewareRegistry[$middleware];
      $middlewareClass::handle();
    }
  }

  /**
   * Register a custom middleware
   */
  public function registerMiddleware(string $name, string $class): self
  {
    $this->middlewareRegistry[$name] = $class;
    return $this;
  }
}
