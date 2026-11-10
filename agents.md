
# Project Context & Rules for AI Agents

## 1. Tech Stack & Architecture
- **Framework:** NestJS (TypeScript).
- **Database:** PostgreSQL (migrating from MongoDB/Mongoose).
- **Database Access:** Prefer **raw parameterized SQL queries** (`dataSource.query('SELECT ... WHERE id = $1', [id])`) over heavy ORM abstractions, unless explicitly asked to use TypeORM entities/Prisma.
- **Architecture Pattern:** CQRS (`@nestjs/cqrs`) + Clean Architecture separation:
  - `api/` � Controllers, Input DTOs (`class-validator`), View Models.
  - `application/` � Use-cases (Command/Query handlers).
  - `domain/` � Business logic entities.
  - `infrastructure/` � `Repository` (write operations: INSERT/UPDATE/DELETE) and `QueryRepository` (read operations returning View Models directly).

## 2. Strict Coding Rules
- **SQL Injection Prevention:** NEVER concatenate variables in SQL strings (`'WHERE id = ' + id`). Always use positional parameters (`$1, $2, $3`).
- **IDs:** All primary and foreign keys use **UUID v4** (migrated from Mongo `ObjectId`). Validate route params with `ParseUUIDPipe`.
- **Naming Conventions:** Database columns use `snake_case` (e.g., `created_at`, `blog_id`), while TypeScript DTOs and ViewModels use `camelCase` (`createdAt`, `blogId`). Always map rows explicitly in QueryRepositories.
- **Pagination & Sorting:** Sanitize `sortBy` and `sortDirection` (`ASC` | `DESC`) against a strict whitelist of column names before inserting into `ORDER BY`.

## 3. Token-Saving Instructions for Agents
- **Do NOT scan the entire repository.** Only read files inside the specific feature module requested by the user (e.g., `src/features/blogs` or `src/features/users`).
- Skip reading `dist/`, `node_modules/`, and unrelated `.spec.ts` files.
- Before opening a Pull Request, run `npm run build` (or `npx tsc --noEmit`) to verify there are no TypeScript compilation errors.