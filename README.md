# ReleaseCheck

Release checklist app: Next.js UI, PostgreSQL, GraphQL at `/api/graphql`.

## Local setup

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL` to your Postgres URL, then:

```bash
npx prisma migrate deploy
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

**Docker:** `docker compose up --build` (Postgres + app on port 3000; migrations run on start).

**Tests:** `npm test`

## GraphQL

`POST` (and `GET` in dev for GraphiQL) → `/api/graphql` with JSON body `{ "query": "...", "variables": {} }`.

| Query | |
| --- | --- |
| `stepDefinitions` | Checklist step ids/labels (static). |
| `releases` | All releases. |
| `release(id)` | One release or `null`. |

| Mutation | |
| --- | --- |
| `createRelease(input)` | `name`, `date` (ISO), optional `additionalInfo`. |
| `updateRelease(id, input)` | Partial update. |
| `deleteRelease(id)` | Returns `true`. |
| `toggleStep(releaseId, stepId)` | Toggle step completion. |

Status is computed: `PLANNED` (none done) → `ONGOING` → `DONE` (all steps).

Example:

```bash
curl -s -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation($input: CreateReleaseInput!){ createRelease(input: $input){ id name } }","variables":{"input":{"name":"1.0.0","date":"2026-03-22T12:00:00.000Z"}}}'
```

## Database

Table `Release`: `id` (text CUID), `name`, `date`, `additionalInfo`, `completedStepIds` (int array), `createdAt`, `updatedAt`. Step labels live in `src/lib/steps.ts`.

## Deploy (e.g. Vercel)

1. **Database** — Create Postgres (e.g. [Neon](https://neon.tech)). Use the **pooled** connection string in Vercel (`DATABASE_URL`). Hostnames contain `neon.tech` — the app then uses Neon's serverless driver + WebSockets (required on Vercel). Local Docker Postgres still uses `pg`.
2. **Migrations** — Against that database, once:  
   `DATABASE_URL="…your prod url…" npx prisma migrate deploy`
3. **Vercel** — Import the repo, add env **`DATABASE_URL`** = same URL as step 2, then deploy. Redeploy after changing env vars.
4. **If `/api/graphql` returned 500** — Usually missing/wrong `DATABASE_URL`, migrations not applied, or (fixed in code) Prisma client not reused in production. After pulling latest, redeploy.

The GraphQL route runs on **Node.js** (`runtime = "nodejs"`), not Edge.
