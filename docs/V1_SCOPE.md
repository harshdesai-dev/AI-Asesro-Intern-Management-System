# V1 Scope — Approved Behaviour

## Roles

### Admin
- Create, update, deactivate and reactivate intern accounts.
- Create teams and maintain current team membership.
- Create tasks and assign them to individual interns or teams.
- Select the Team Lead for each team task/project.
- Review the latest individual or team submission and approve it or request changes.
- Mark and correct working-day attendance, individually or in bulk.
- Schedule meetings for all active interns, a team, or selected interns.
- Record meeting attendance separately from working-day attendance.

### Intern
- Sign in with an Admin-created account.
- View individual assignments and team assignments for which they were included at assignment time.
- Start assigned work.
- Submit an individual task if assigned individually.
- View shared team work; only the selected Team Lead may submit the common team submission.
- View latest Admin feedback and resubmit when changes are requested.
- View personal working-day attendance and scheduled meetings.

## Task workflow

`ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED`

If the Admin requests changes:

`SUBMITTED → NEEDS_CHANGES → SUBMITTED`

The latest submission replaces the previous submission fields. Revision history is out of scope for V1.

### Team assignment rules

1. Admin selects a team.
2. The system reads the team's active current members.
3. Admin selects one Team Lead from those members.
4. The system creates one team `TaskAssignment` and snapshots the selected roster in `TaskAssignmentMember`.
5. Every snapshot member can view the assignment.
6. Only the selected Team Lead can submit the shared work.
7. The Team Lead is not permanent on the `Team`; a different TL can be selected for another assignment.
8. Later team roster changes do not change existing assignment members or its Team Lead.

### Individual assignment rules

- Each selected intern gets a separate `TaskAssignment`.
- Each intern submits their own work.
- Admin reviews each assignment independently.

## Attendance

- One record per intern per working date.
- Status values: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`.
- Admin can mark one or many interns in a single save.
- Admin can correct a previously saved record.
- Interns can view only their own records.

## Meetings

- Audience options: all active interns, one team, or selected interns.
- Participants are snapshotted when the meeting is created.
- Meeting attendance values: `PENDING`, `PRESENT`, `ABSENT`, `LATE`.
- Admin can mark attendance and mark a meeting completed or cancelled.
- Meeting attendance is not reused as working-day attendance.

## Explicitly deferred

- Permanent team-lead role.
- Historical team membership timeline.
- Submission revision history.
- Per-member contribution tracking for shared tasks.
- Notifications, chat, file storage and automated reminders.
- Advanced analytics and AI performance evaluation.
- AI task grading.
