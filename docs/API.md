# V1 API Map

All routes are under `/api/v1`. Mutating routes require a valid same-site session cookie.

## Authentication

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate with email/password |
| POST | `/auth/logout` | Session | Clear session cookie |
| GET | `/auth/me` | Session | Return current account |

## Admin — people and teams

| Method | Route | Purpose |
|---|---|---|
| GET / POST | `/interns` | List or create intern accounts |
| PATCH | `/interns/:internId` | Update profile, status or temporary password |
| GET / POST | `/teams` | List or create teams |
| PATCH | `/teams/:teamId` | Update team name, current roster or active state |

## Tasks

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET / POST | `/tasks` | Admin | List tasks or create task + assignment(s) |
| PATCH | `/tasks/assignments/:assignmentId/review` | Admin | Approve or request changes |
| GET | `/me/tasks` | Intern | List individual and assignment-snapshot team tasks |
| PATCH | `/me/tasks/:assignmentId` | Intern | Start work or submit/resubmit latest work |

## Attendance

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/attendance?date=YYYY-MM-DD` | Admin | Load active interns and date records |
| POST | `/attendance` | Admin | Mark or correct one or many interns |
| GET | `/me/attendance` | Intern | View personal working-day attendance |

## Meetings

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET / POST | `/meetings` | Admin | List or schedule meetings |
| PATCH | `/meetings/:meetingId` | Admin | Mark meeting completed or cancelled |
| PATCH | `/meetings/:meetingId/attendance` | Admin | Mark participant attendance |
| GET | `/me/meetings` | Intern | View personal meeting schedule and attendance |

## Dashboard

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/dashboard` | Session | Return role-specific operational metrics |
