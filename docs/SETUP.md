# Setup and first run

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer
- PostgreSQL 15 or newer

## 1. Environment

```bash
cp .env.example .env
```

Set a working PostgreSQL connection string in `DATABASE_URL`. Set `AUTH_SECRET` to a unique random value of at least 32 characters. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` for the initial Admin account. The Admin password must be at least 12 characters.

## 2. Install and initialize

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

The first `db:migrate` command creates the initial Prisma migration from `prisma/schema.prisma`.

## 3. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## 4. Verify

```bash
npm run typecheck
npm run lint
npm run build
```

## Troubleshooting

- If Prisma cannot connect, confirm PostgreSQL is running and `DATABASE_URL` uses the correct port/database.
- If login rejects the Admin, rerun `npm run db:seed` after checking `.env` values.
- If the session secret error appears, use an `AUTH_SECRET` at least 32 characters long and restart the dev server.
- Never share your `.env` file or commit it to Git.
