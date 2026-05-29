# A.L.F.R.E.D. Local Development

A.L.F.R.E.D. is split into a Next.js frontend at the repository root and a NestJS backend in `backend/`.

## Commands

```bash
npm run dev:infra
```

Starts MongoDB and Redis with Docker Compose.

```bash
npm run dev
```

Starts the mock-first Next.js frontend only on `http://localhost:3000`.

```bash
npm run dev:backend
```

Starts the NestJS backend only on `http://localhost:4000`. Use this after infrastructure is running.

```bash
npm run dev:frontend
```

Starts the frontend explicitly. It uses `http://localhost:3000` by default; Next.js may choose the next available port if 3000 is already in use.

```bash
npm run dev:all
```

Starts MongoDB, Redis, backend, and frontend together.

```bash
npm run dev:backend
npm run dev:frontend
npm run seed
npm run test
npm run build
npm run build:all
npm run check
npm run check:all
```

`npm run test` runs lightweight frontend confidence checks. Backend unit tests are available with `npm run test:backend`; backend e2e tests are available with `npm run test:e2e`.

Backend Swagger docs are available at `http://localhost:4000/docs`.

Demo login after seeding:

```text
demo@alfred.local
password123
```
