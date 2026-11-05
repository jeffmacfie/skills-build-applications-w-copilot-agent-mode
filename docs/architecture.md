# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-specific rendering in the existing React components and use the shared API client for relative `/api` requests. Each capability should expose accessible loading, error, and empty states.
- Logic tier decision: Keep request validation, business rules, and database queries in `octofitService.ts`; keep Express routes responsible for HTTP status codes and response envelopes. Return deliberate 4xx responses for invalid input and missing resources.
- Data tier decision: Add Mongoose required fields, defaults, and relationship types to the existing models. Preserve seed idempotency and unrelated records; do not add authentication.
- Activity tracking approach: Require a non-empty type, positive minutes, and well-formed IDs that reference existing users and teams. Store those references with the submitted activity details, award one point per minute, and set `occurredAt` when creating the record.
- Team management approach: Require a name, preserve the submitted name and mascot, and store valid member IDs in the `members` array. Do not delete or replace unrelated teams or users.
- Leaderboard approach: Sum each team's activity points, sort descending by total, and assign ranks starting at 1.
- Workout suggestions approach: Find the user by email, prefer workouts matching the user's fitness goal, and use recent activity as a matching signal when appropriate. Include a short reason with each suggestion and return 404 for an unknown email.

## Test plan

Baseline results before implementation; rerun each command after its tier is implemented and replace these notes with the updated result.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — baseline: 4 failed, 1 passed. Failures show missing required validation for User, Team, Activity, and Workout fields; the seed/idempotency test passes.
- API logic: `npm run test:api --prefix octofit-tracker/backend` — baseline: 4 failed. Activity and team creation return 501, the leaderboard is empty, and workout suggestions do not include the expected activity-based reason.
- Presentation: `npm test --prefix octofit-tracker/frontend` — baseline: 15 failed. API data/request rendering and each route's loading, empty, and error states are still unimplemented.
- Backend build: `npm run build --prefix octofit-tracker/backend` — not run yet; checks TypeScript compilation.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — not run yet; checks TypeScript compilation and the Vite production build.
- Exercise validation: `node --test tests/exercise-validation.test.mjs` — currently fails because the README Copy Exercise badge does not match the template owner/name; the dedicated `node .github/scripts/grade-step.mjs step1-architecture` check passes.
