# Contributing to Graduates System

Thank you for your interest in contributing to the Graduates System project!

## ✅ Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **Node.js** (v18 or higher)
- **PHP** (v8.1 or higher)
- **Composer** (Dependency Manager for PHP)
- **MySQL** (Database)
- **Git**

## 🚀 Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/yishai-gr/graduates-system.git
cd graduates-system
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

**Configuration:**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # Or on Windows: copy .env.example .env
   ```
2. Update `.env` with your local database credentials.

**Database:**

- Create a new MySQL database.
- Import the initial schema (if provided in `database/`) or run migrations.

Start the PHP built-in server (or use XAMPP/WAMP):

```bash
# Serves the public API at http://localhost:8000
php -S localhost:8000 -t public
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install Node.js dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173` (or the port shown in your terminal).

## 🤝 Workflow

1. **Branch**: Create a new branch for your feature or fix.
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Commit**: Make your changes and commit them with descriptive messages.
   ```bash
   git commit -m "feat: Add new search filter"
   ```
3. **Push**: Push your branch to GitHub.
   ```bash
   git push origin feature/my-new-feature
   ```
4. **Pull Request**: Open a Pull Request (PR) against the `master` branch.

## 📝 Coding Standards

- **Frontend**: Follow React best practices. Use functional components and hooks. Ensure types are properly defined in TypeScript.
- **Backend**: Adhere to PSR-12 coding standards for PHP.

Thank you for contributing!
