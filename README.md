# Properties Project

This workspace contains both the **NestJS Backend** and **Next.js Frontend**.

## Quick Start

### 1. Run Backend & Frontend Together
From the root directory:
```bash
npm run dev
```
This runs both applications concurrently:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001) (API documentation: [http://localhost:3001/docs](http://localhost:3001/docs))

### 2. Individual Commands
- Run Frontend only:
  ```bash
  npm run dev:frontend
  ```
- Run Backend only:
  ```bash
  npm run dev:backend
  ```
- Build both:
  ```bash
  npm run build
  ```
- Install dependencies for all packages:
  ```bash
  npm run install:all
  ```

## Database Note (Backend)
The backend requires a running PostgreSQL database configured in [Backend/.env](file:///Users/ritika/Desktop/Work/Binny/Properties%20Project/Backend/.env):
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=root
DATABASE_PASSWORD=secret
DATABASE_NAME=api
```
If using a cloud database (e.g. Supabase, Neon) or custom local PostgreSQL service, ensure these values match your database credentials.
