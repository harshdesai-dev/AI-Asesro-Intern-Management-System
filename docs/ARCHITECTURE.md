# V1 Technical Architecture

## Request flow

Browser → Next.js App Router page → API route → Zod validation → role/session check → Prisma → PostgreSQL.

## Authentication

- Email/password login.
- Passwords are hashed with bcrypt (12 rounds).
- Session is a signed HS256 JWT in an HttpOnly, SameSite=Lax cookie.
- Session lifetime: 12 hours.
- Each authenticated request reloads the user role/status from the database so deactivated accounts lose access.
- No public signup route exists.

## Assignment model

`Task` stores the shared task definition. `TaskAssignment` stores each assignment target and its latest submission/review state.

For an individual assignment, `internId` is set and `teamId`/`teamLeadId` are null.

For a team assignment, `teamId` and `teamLeadId` are set, `internId` is null, and `TaskAssignmentMember` contains the assignment-time roster. API validation ensures the selected TL belongs to that roster.

`TaskAssignmentMember` is not a historical membership table. It is a snapshot attached to one assignment only.

## Submission model

V1 supports one latest submission per assignment. `submissionUrl`, `submissionNote`, `submittedAt`, `status`, `reviewFeedback`, `reviewedById`, and `reviewedAt` live on `TaskAssignment`.

This avoids a separate submission-history table while retaining independent submission and review state for every individual or team assignment.

## Team membership

`User.teamId` stores one current team per intern. The team roster can be changed by Admin. When a team task is created, current active members are copied into `TaskAssignmentMember`.

## Attendance

`Attendance` is unique by `(internId, workDate)`. Admin writes use an upsert so corrections update the existing record rather than creating duplicates.

`MeetingAttendance` is a separate model and also acts as the participant snapshot for a meeting. It is created with `PENDING` status when a meeting is scheduled.

## Authorization boundaries

- Admin-only: intern/team/task/meeting creation, task review, working-day attendance, meeting attendance.
- Intern-only: own task list, own attendance, own meetings.
- Team task visibility: only users present in the assignment snapshot.
- Team task submission: only the `teamLeadId` on that specific assignment.
- Individual task submission: only the assigned `internId`.
