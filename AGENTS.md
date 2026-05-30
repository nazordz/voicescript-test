<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Voicescript — Court Reporting Workflow Manager

A simplified workflow system for a court reporting agency that receives audio
recordings and turns them into reviewed transcripts. The product (see
`README.md` for the full brief) must let staff:

1. **Manage jobs** — create a job (`case_name`, `duration_minutes`,
   `location`, physical/remote, `status`) and track its lifecycle.
2. **Assign reporters** — match a reporter to a job. Prefer a reporter in the
   same city for physical jobs; remote jobs may use any reporter.
3. **Assign editors** — assign an editor to review after transcription.
4. **Calculate payments** — reporter is paid per minute, editor a flat fee per
   job; show per-job earnings and total payout.

Job status flow:

```
NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED
```

`CANCELLED` is an added status: any job that is not already `COMPLETED` or
`CANCELLED` can be cancelled (see `isCancellable` / `assertNextStatus` in
`lib/jobs.ts`). Status transitions are validated server-side and recorded in
`job_status_histories`.

The backoffice UI and the REST API both live in this single Next.js app. The UI
must work on **desktop and mobile**.

## Use the available MCP servers when they help

MCP servers are configured in `.mcp.json`. Reach for them instead of guessing:

- **context7** — fetch current docs for any library/framework/CLI (Next.js,
  Prisma, React Query, Zod, Tailwind, daisyUI, etc.) before writing code that
  uses them. Prefer this over recalling from memory; versions here are recent.
- **postgres** — inspect the live database schema, run/explain queries, and
  check index/health when working on data or query performance. It runs in
  `--access-mode=restricted`.
- **daisyui** — look up daisyUI component markup and class names.
- **next-devtools** — Next.js-specific tooling/docs for this version.
- **playwright** / **chrome-devtools** — drive the running app for e2e or
  manual verification in a real browser.

## Architecture & structure

Next.js (App Router) + TypeScript, Prisma + PostgreSQL, React Query on the
client. There is no separate backend — API route handlers under `app/api` are
the REST backend.

```
app/
  (dashboard)/            # backoffice pages: jobs, reporters, editors + layout
  api/                    # REST handlers (route.ts per resource)
    jobs/route.ts                       # GET list / POST create
    jobs/[id]/route.ts                  # GET / PATCH / DELETE one job
    jobs/[id]/status/route.ts           # status transition (+ history)
    jobs/[id]/assign-reporter/route.ts  # reporter assignment
    jobs/[id]/assign-editor/route.ts    # editor assignment
    jobs/[id]/payments/route.ts         # rate/fee updates
    reporters/route.ts, reporters/[id]/route.ts
    editors/route.ts, editors/[id]/route.ts
  layout.tsx, page.tsx, providers.tsx   # React Query provider lives here
components/
  dashboard/  jobs/  reporters/  editors/   # feature components (Table + FormModal)
  ui/                                        # shared: StatusBadge, PaginationControls,
                                             # SortButton, TableToolbar, ListStateView, …
lib/
  prisma.ts        # Prisma client singleton (pg adapter)
  api.ts           # JSON response helpers: ok/created/noContent/validationError/…
  api-client.ts    # client fetch via axios: requestJson, buildListUrl, formatIdr
  query.ts         # getOrderBy / getPagination helpers for list endpoints
  validation.ts    # all Zod schemas + parseJson/parseListQuery
  form-schemas.ts  # Zod schemas used by react-hook-form forms
  jobs.ts          # job domain logic: include, serializeJob, payments, status rules
  constants.ts     # JOB_STATUS enum + labels/options, defaults, INDONESIAN_CITIES
  types.ts         # shared TS types (Job, Reporter, Editor, ListState, …)
hooks/useListState.ts  # list state + useDebouncedValue (search debounce)
prisma/            # schema.prisma, migrations/, seed.ts
tests/             # Playwright e2e specs (workflow.spec.ts)
generated/prisma/  # generated Prisma client — never edit by hand
```

Request flow for a list endpoint: client `buildListUrl` → `useQuery` →
`GET route.ts` → `parseListQuery` (Zod) → Prisma query with
`getOrderBy`/`getPagination` → `serializeJob`/serializer → typed JSON. Domain
rules (status transitions, payment math, what is serialized) belong in `lib`,
not in route handlers or components.

## Code style

- **TypeScript strict**, ES modules. Import internal modules via the `@/` alias
  (e.g. `@/lib/jobs`); the Prisma client comes from `@/generated/prisma`.
- **Formatting**: 2-space indent, double quotes, semicolons, trailing commas —
  matches `.editorconfig` and existing files. Run `pnpm lint` / `pnpm lint:fix`
  before finishing.
- **Validation**: every API input is parsed with a Zod schema from
  `lib/validation.ts` using `parseJson` / `parseListQuery`. Add new input
  contracts there, not inline.
- **API responses**: always go through the helpers in `lib/api.ts`
  (`ok`, `created`, `noContent`, `validationError`, `badRequest`, `notFound`,
  `conflict`, `serverError`) — do not hand-roll `NextResponse.json`.
- **Data access**: use the shared `prisma` singleton from `lib/prisma.ts`. Wrap
  multi-write operations in `prisma.$transaction` (see job create writing a
  status-history row). Never edit the generated client.
- **Client data**: TanStack React Query for all fetching/mutations via
  `requestJson` (axios wrapper); no manual `fetch` in components. List screens
  use `useListState` + `useDebouncedValue` for search debouncing, plus the
  shared `TableToolbar` / `SortButton` / `PaginationControls`.
- **Forms**: react-hook-form + `@hookform/resolvers` with Zod schemas from
  `lib/form-schemas.ts`, rendered in `*FormModal` components.
- **UI**: Tailwind v4 + daisyUI v5 component classes. Keep things responsive
  (desktop + mobile). Money is rendered with `formatIdr`; dates with dayjs.
- **Errors**: route handlers catch and map to the right helper
  (`serverError` logs; `conflict`/`notFound` for expected cases). Don't leak raw
  errors to the client.

## Naming conventions

- **Database columns: `snake_case`** (`case_name`, `duration_minutes`,
  `is_remote`, `created_at`). Map to camelCase Prisma fields with `@map`, and
  map models to plural snake_case tables with `@@map` (`jobs`, `reporters`,
  `editors`, `job_status_histories`).
- **TypeScript/React: camelCase** for variables, functions, and object fields
  (`durationMinutes`, `isRemote`, `serializeJob`); **PascalCase** for React
  components, types, and Prisma models (`JobsTable`, `ListResponse`, `Reporter`).
- **Constants / enums**: `UPPER_SNAKE_CASE` (`JOB_STATUS`,
  `DEFAULT_REPORTER_RATE_IDR`, `JOB_STATUS_LABELS`).
- **Files**: components `PascalCase.tsx`, hooks `useX.ts`, lib modules
  lowercase (`api-client.ts`, `form-schemas.ts`).
- **IDs** are UUIDv7 (`uuidv7()` DB default), typed as `string`.
- **Status & location** are stored as `smallint` (`Int @db.SmallInt`); status
  values come from the `JOB_STATUS` enum, never magic numbers.
- **Money** fields/values are integer IDR, suffixed `Idr` /
  `_idr` (`reporterRateIdr` / `reporter_rate_idr`).

## Tooling

- Package manager: **pnpm**. Scripts: `pnpm dev`, `pnpm build`, `pnpm lint`,
  `pnpm prisma:migrate`, `pnpm prisma:seed`, `pnpm prisma:generate`.
- After changing `prisma/schema.prisma`: create a migration
  (`pnpm prisma:migrate`) and regenerate the client (`pnpm prisma:generate`).
- E2E: Playwright specs in `tests/`; keep them updated when workflows change.
- Local DB via Docker: `docker compose up -d` (see `compose.yml`).
