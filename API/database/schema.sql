-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100),
    `last_name` VARCHAR(100),
    `role` ENUM('super_admin', 'shiur_manager') NOT NULL,
    `shiurs_managed` JSON, -- e.g. ["נח", "פ"]
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Graduates Table
CREATE TABLE IF NOT EXISTS `graduates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(100),
    `last_name` VARCHAR(100),
    `phone` VARCHAR(20),
    `home_phone` VARCHAR(20),
    `email` VARCHAR(255),
    `shiur_year` VARCHAR(10), -- e.g. "נח"
    `city` VARCHAR(100),
    `address` VARCHAR(255),
    `teudat_zehut` VARCHAR(20),
    `birth_date` VARCHAR(20), -- Storing as string to support "custom" or hebrew dates if needed, or stick to DATE if strict
    `student_code` VARCHAR(50),
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_graduates_search ON graduates(first_name, last_name, email);
CREATE INDEX idx_graduates_shiur ON graduates(shiur_year);
