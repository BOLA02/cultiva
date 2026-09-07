# Cultiva Backend

REST API for an agricultural marketplace connecting farmers, buyers, transporters, dealers, and cooperatives.

This repository is an npm-workspaces monorepo:

- `/src` and `/prisma` — Express and Prisma API package
- `/apps/web` — React and Vite web application

## Setup

1. Copy `.env.example` to `.env` and provide the required values.
2. Run `npm install`.
3. Run `npm run prisma:generate` and `npm run prisma:migrate`.
4. Start both applications with `npm run dev:all`.

### First administrator

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally the other `ADMIN_*` values in `.env`, then run:

```bash
npm run seed:admin
```

This creates (or updates) one active, verified administrator. Sign in through the normal web login page, then open **Admin** to review farmers, their submitted farm-document URLs, and pending farms.

### Farm-to-marketplace workflow

1. A farmer creates a farm, submits at least one proof-document URL, and adds crops.
2. An administrator verifies the farm in the Admin review queue.
3. The farmer chooses **List on marketplace** for a crop and can publish it immediately.

Only crops belonging to verified farms can be listed or published. Public marketplace results also exclude listings from a farm that has subsequently been suspended.

The health check is `GET /api/v1/health`. All APIs are mounted below `/api/v1`.

## Scripts

- `npm run dev:all` – run the API and web app together
- `npm run dev:api` – run only the API on port 5001
- `npm run dev:web` – run only the web app on port 3000
- `npm run build:all` – production-build every workspace
- `npm run build` – compile the API
- `npm run build:web` – build the web application
- `npm start` – run the compiled server
- `npm run prisma:generate` – regenerate Prisma Client
- `npm run prisma:migrate` – apply development migrations

Never commit `.env` or application secrets.
