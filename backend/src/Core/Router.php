<?php

namespace App\Core;

class Router
{
  private array $routes = [];
  private array $groupStack = [];

  /**
   * Register a GET route
   */
  public function get(string $path, string $controller, string $action): self
  {
    return $this->addRoute('GET', $path, $controller, $action);
  }

  /**
   * Register a POST route
   */
  public function post(string $path, string $controller, string $action): self
  {
    return $this->addRoute('POST', $path, $controller, $action);
  }

  /**
   * Register a PUT route
   */
  public function put(string $path, string $controller, string $action): self
  {
    return $this->addRoute('PUT', $path, $controller, $action);
  }

  /**
   * Register a DELETE route
   */
  public function delete(string $path, string $controller, string $action): self
  {
    return $this->addRoute('DELETE', $path, $controller, $action);
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
  public function group(array $options, callable $callback): self
  {
    $this->groupStack[] = $options;
    $callback($this);
    array_pop($this->groupStack);
    return $this;
  }

  /**
   * Internal method to add a route
   */
  private function addRoute(string $method, string $path, string $controller, string $action): self
  {
    $prefix = '';
    $middleware = [];

    // Apply group attributes
    foreach ($this->groupStack as $group) {
      if (isset($group['prefix'])) {
        $prefix .= $group['prefix'];
      }
      if (isset($group['middleware'])) {
        $middleware[] = $group['middleware'];
      }
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
    switch ($middleware) {
      case 'auth':
        \App\Middleware\AuthMiddleware::authenticate();
        break;
      // Add more middleware cases as needed
    }
  }
}
