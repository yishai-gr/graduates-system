<?php

namespace App\Config;

class Permissions
{
  // Define all available permissions here
  public const PERMISSION_GRADUATE_CREATE = 'graduate:create';
  public const PERMISSION_GRADUATE_READ = 'graduate:read';
  public const PERMISSION_GRADUATE_UPDATE = 'graduate:update';
  public const PERMISSION_GRADUATE_DELETE = 'graduate:delete';

  public const PERMISSION_USER_READ = 'user:read';
  public const PERMISSION_USER_CREATE = 'user:create';
  public const PERMISSION_USER_UPDATE = 'user:update';
  public const PERMISSION_USER_DELETE = 'user:delete';

  public static function getPermissionsForRole(string $role): array
  {
    switch ($role) {
      case 'super_admin':
        return [
          self::PERMISSION_GRADUATE_CREATE,
          self::PERMISSION_GRADUATE_READ,
          self::PERMISSION_GRADUATE_UPDATE,
          self::PERMISSION_GRADUATE_DELETE,
          self::PERMISSION_USER_READ,
          self::PERMISSION_USER_CREATE,
          self::PERMISSION_USER_UPDATE,
          self::PERMISSION_USER_DELETE,
        ];
      case 'shiur_manager':
        return [
          self::PERMISSION_GRADUATE_CREATE,
          self::PERMISSION_GRADUATE_READ,
          self::PERMISSION_GRADUATE_UPDATE, // Logic for *which* graduate is handled in controller/service
          // No user management permissions
        ];
      default:
        return [];
    }
  }
}
