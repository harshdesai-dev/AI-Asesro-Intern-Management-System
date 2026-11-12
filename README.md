# AI ASESRO InternHub — V1

A lean internal platform for managing interns, individual and team assignments, working-day attendance, and meetings.

## V1 product rules

- Two roles only: `ADMIN` and `INTERN`.
- Admin creates and manages intern accounts; there is no public registration.
- An intern belongs to one current team at a time.
- Admin can assign a task to individual interns or to a team.
- A team assignment captures the active team roster at assignment time.
- Admin selects the responsible Team Lead separately for every team task/project.
- Team members collaborate on one shared task; only the selected Team Lead submits the common work.
- Individual assignments have individual submissions.
- V1 stores the latest submission and latest review on `TaskAssignment`; it does not maintain submission revision history.
- Working-day attendance and meeting attendance are separate records.
- Admin marks attendance individually or in bulk and is the only role allowed to correct it.
- Meeting participants are captured when a meeting is scheduled; attendance starts as `PENDING`.

## Technology

- Next.js 15 App Router + React 19 + TypeScript
- PostgreSQL + Prisma 6
- HttpOnly JWT session cookie (`jose`)
- `bcryptjs` password hashing
- Zod request validation
- Responsive custom CSS interface

## Core data models

| Model | Purpose |
|---|---|
| `User` | Admin and intern accounts; current team membership |
| `Team` | Team identity and current roster relation |
| `Task` | Reusable task/project details |
| `TaskAssignment` | Individual/team target, per-task TL, latest submission and review |
| `TaskAssignmentMember` | Assignment-time snapshot of the team roster |
| `Attendance` | Working-day attendance per intern and date |
| `Meeting` | Meeting schedule and audience |
| `MeetingAttendance` | Meeting participant snapshot and separate attendance status |

The model count is intentionally not treated as a target. `TaskAssignmentMember` is retained because it protects an approved business rule: changing a team's current roster must not rewrite an existing assignment's roster.

## Local setup

1. Install Node.js 20.9+ and PostgreSQL 15+.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL`, `AUTH_SECRET`, and the initial Admin credentials.
4. Install dependencies: `npm install`.
5. Generate Prisma Client: `npm run db:generate`.
6. Create the first database migration: `npm run db:migrate -- --name init`.
7. Create the initial Admin account: `npm run db:seed`.
8. Start the app: `npm run dev`.
9. Open `http://localhost:3000` and sign in with the Admin credentials from `.env`.

## Useful commands

- `npm run dev` — local development
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run db:studio` — Prisma Studio
- `npm run db:deploy` — apply committed migrations in a deployment environment

## Security notes

- Never commit `.env` or real credentials.
- Use a unique `AUTH_SECRET` of at least 32 characters.
- The seed command creates/updates the Admin account using a bcrypt hash.
- Admin and intern APIs enforce roles on the server; hiding a link in the UI is not authorization.
- V1 does not include password reset email, MFA, notifications, file uploads, or AI evaluation.

## Current V1 limitations

- One current team per intern.
- One latest submission per assignment; no submission revision timeline.
- Team membership is current-state only; assignment members are snapshotted separately.
- No in-app notifications or messaging.
- AI functionality is intentionally postponed until the operational workflows are stable.
