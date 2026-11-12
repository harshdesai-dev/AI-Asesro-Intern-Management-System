# V1 Manual QA Checklist

Run this checklist after configuring PostgreSQL and creating the Admin account.

## Authentication and permissions

- [ ] Admin can sign in with seeded credentials.
- [ ] Invalid password is rejected with a generic error.
- [ ] Admin is redirected to `/admin`; intern is redirected to `/intern`.
- [ ] Unauthenticated users cannot access either dashboard.
- [ ] Intern cannot access Admin pages or Admin API routes.
- [ ] Deactivated intern cannot continue using an existing session.
- [ ] Logout clears the session and redirects to login.

## Intern and team management

- [ ] Admin can create an intern with a unique email and optional unique intern ID.
- [ ] Duplicate email or intern ID is rejected.
- [ ] Admin can deactivate and reactivate an intern.
- [ ] Admin can create a team and add multiple active interns.
- [ ] An intern cannot be in two current teams at once.
- [ ] Admin can edit a team's current roster.
- [ ] Deactivating a team clears its current roster.

## Individual task workflow

- [ ] Admin can create a task and assign it to one intern.
- [ ] Admin can assign one task to multiple individual interns; each receives a separate assignment.
- [ ] Each assigned intern can view only their own individual assignment.
- [ ] Intern can start the task.
- [ ] Assigned intern can submit an HTTP/HTTPS link and a short note.
- [ ] Admin can approve the submission.
- [ ] Admin can request changes; the intern can resubmit the latest work.
- [ ] Another intern cannot view or submit the assignment.

## Team task workflow

- [ ] Admin can assign a task to a team with active members.
- [ ] Admin must select the Team Lead from the selected team's current members.
- [ ] Assignment captures the active team roster at creation time.
- [ ] Every snapshot member can view the team assignment.
- [ ] A non-TL team member cannot submit the common work.
- [ ] The selected TL can submit one common link for the team.
- [ ] Admin reviews the one common team submission.
- [ ] Changing the current team roster does not change the existing assignment snapshot.
- [ ] A different TL can be selected for a later team assignment.

## Working-day attendance

- [ ] Admin can load a working date and active intern list.
- [ ] Admin can mark one intern or bulk-mark multiple interns.
- [ ] Present, Absent, Late and Half Day statuses save correctly.
- [ ] Saving the same intern/date again updates the existing record.
- [ ] Intern can view only their own attendance history.
- [ ] Intern cannot create or correct attendance records.

## Meetings

- [ ] Admin can schedule a meeting for all active interns.
- [ ] Admin can schedule a meeting for one team.
- [ ] Admin can schedule a meeting for selected interns.
- [ ] Meeting participant records are snapshotted at creation time.
- [ ] Meeting end time must be after start time.
- [ ] Admin can mark Present, Absent or Late for each participant.
- [ ] Intern sees only meetings they were included in.
- [ ] Meeting attendance remains separate from working-day attendance.
- [ ] Admin can mark a meeting completed or cancelled.
- [ ] Cancelled meetings cannot have attendance changed.

## Release checks

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `.env` is not committed.
- [ ] Production environment uses a strong `AUTH_SECRET` and secure HTTPS.
