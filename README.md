# ReleaseCheck

A small full-stack release checklist app: list releases, create and edit them, track shared checklist steps, and keep optional notes. The UI is a Next.js single-page experience; data lives in PostgreSQL; the API is **GraphQL** at `/api/graphql`.

**Live demo:** add your deployed URL here after you publish (for example Vercel + Neon).

## Requirements

- Node.js 20+ (LTS recommended)
- PostgreSQL 16+ (local Docker or a hosted provider such as [Neon](https://neon.tech))

## Run locally

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd full-stack-test
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to your Postgres connection string, for example:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
   ```

3. **Database schema**

   ```bash
   npx prisma migrate deploy
   ```

   For development you can use `npx prisma migrate dev` when you change the schema.

4. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Run with Docker (Postgres + app)

With Docker Desktop running:

```bash
docker compose up --build
```

The app listens on port **3000**; Postgres is internal to the compose network. Migrations run on container start via `prisma migrate deploy`.

## Tests

```bash
npm test
```

## Tech stack

- **Framework:** Next.js (App Router), React 19
- **API:** GraphQL ([GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)) — `POST` and `GET` on `/api/graphql` (GraphiQL enabled in development)
- **Database:** PostgreSQL via [Prisma](https://www.prisma.io/) ORM and the [`@prisma/adapter-pg`](https://www.prisma.io/docs/orm/overview/databases/postgresql) driver adapter

---

## API (GraphQL)

All operations go to **`/api/graphql`** with `Content-Type: application/json` and a body:

```json
{ "query": "...", "variables": { ... } }
```

### Queries

| Operation | Description |
|-----------|-------------|
| `stepDefinitions` | Static list of checklist step `id` + `label` (same for every release). |
| `releases` | All releases, ordered by date. |
| `release(id)` | One release by id, or `null`. |

### Mutations

| Operation | Description |
|-----------|-------------|
| `createRelease(input)` | Create a release (`name`, `date` ISO string, optional `additionalInfo`). |
| `updateRelease(id, input)` | Update fields (`name`, `date`, `additionalInfo` — all optional). |
| `deleteRelease(id)` | Delete a release. Returns `true`. |
| `toggleStep(releaseId, stepId)` | Flip completion for a step index `0 … n-1`. |

### Example (create release)

```bash
curl -s -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation($input: CreateReleaseInput!){ createRelease(input: $input){ id name date status } }","variables":{"input":{"name":"Version 1.0.0","date":"2026-03-22T12:00:00.000Z","additionalInfo":null}}}'
```

### Release status (computed)

`Release.status` is **not** stored. It is derived from completed steps:

- **PLANNED** — no step completed  
- **ONGOING** — at least one, not all  
- **DONE** — every step completed  

---

## Database schema

### Table: `Release` (Prisma / PostgreSQL)

| Column | Type | Notes |
|--------|------|--------|
| `id` | `TEXT` (CUID) | Primary key |
| `name` | `TEXT` | Required |
| `date` | `TIMESTAMP(3)` | Required |
| `additionalInfo` | `TEXT` | Optional |
| `completedStepIds` | `INTEGER[]` | Which global step indices are done (no separate `Step` table) |
| `createdAt` | `TIMESTAMP(3)` | Default now |
| `updatedAt` | `TIMESTAMP(3)` | Auto-updated |

Checklist **labels** are defined in code (`src/lib/steps.ts`), not in the database.

---

## Deploy (example: Vercel + Neon)

1. Create a Postgres database on Neon (or another host) and copy the connection string into `DATABASE_URL`.
2. Push this repo to GitHub and import the project in [Vercel](https://vercel.com).
3. Add the environment variable `DATABASE_URL` in the Vercel project settings.
4. Set the build command to `npm run build` and install command to `npm install` (defaults). Prisma runs `prisma generate` on `postinstall`.
5. Optionally add a `postinstall` or build step note: migrations can be run once via `npx prisma migrate deploy` using Neon’s SQL console or a one-off CI job; for ongoing deploys, use a Vercel build hook or run migrations in CI before promote.

For serverless Postgres, use a provider that supports Prisma and connection pooling (Neon’s pooled string is documented in their Prisma guide).

---

## Project structure (short)

- `src/app/` — UI routes (`/`, `/release/new`, `/release/[id]`)
- `src/app/api/graphql/` — GraphQL Yoga handler
- `src/graphql/schema.ts` — Schema and resolvers
- `src/lib/steps.ts` — Shared checklist definitions
- `src/lib/status.ts` — Status derivation
- `prisma/` — Prisma schema and migrations
