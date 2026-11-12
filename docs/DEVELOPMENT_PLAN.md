# V1 Delivery Plan

## Phase 1 — Foundation and authentication
- Next.js app shell and role-specific navigation.
- Prisma schema and database migration.
- Admin seed, login/logout and server-side role checks.

## Phase 2 — People and teams
- Admin creates and manages intern accounts.
- Admin creates teams and maintains current team membership.
- Enforce one current team per intern.

## Phase 3 — Tasks and submissions
- Admin creates individual or team assignments.
- Snapshot team members at assignment time.
- Select a Team Lead separately for each team assignment.
- Intern starts work and submits a link.
- Only the designated TL submits common team work.
- Admin approves or requests changes.

## Phase 4 — Working-day attendance
- Admin marks one or many interns.
- Admin can correct existing records.
- Intern views personal attendance history.

## Phase 5 — Meetings
- Admin schedules meetings for all interns, a team or selected interns.
- Meeting participant records are created at scheduling time.
- Admin marks meeting attendance and updates meeting status.
- Intern views their meetings and attendance state.

## Phase 6 — Dashboard and QA
- Connect overview metrics to real database queries.
- Verify permissions and workflow edge cases.
- Run typecheck, lint and production build.
- Deploy only after the database and environment are configured.

## Deferred until after V1

AI evaluation, AI performance summaries, advanced analytics, notifications, file uploads, chat and submission revision history.
