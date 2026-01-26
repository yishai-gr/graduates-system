# Shared Directory

This directory contains resources that are **common** to both the Frontend and Backend, or are entirely **framework-agnostic**.

## ✅ Allowed Resources

- **Types/Interfaces**: TypeScript definitions or PHP classes that have no dependencies (e.g., pure DTOs, though rare to share directly across languages without specific tooling).
- **Schemas**: JSON Schemas, Validation rules (if compatible).
- **Documentation**: Project-wide docs, architecture diagrams.
- **Static Assets**: Images, fonts, icons that are used by both or need a central place.

## ❌ Forbidden Resources

- **Component Code**: React components, Vue files, etc.
- **Runtime Dependencies**: Anything that requires `react`, `laravel`, `composer` autoloading (unless strictly isolated).
- **Environment Logic**: Code that depends on specific env vars of one side.

> **Goal**: Keep this directory simple. If you are unsure, put it in the specific project folder.
