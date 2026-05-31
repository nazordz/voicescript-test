# Voicescript

## Run first time

to run the development server for first time run commands below:

```bash
# install dependecies
pnpm i

# copy .env.example
cp .env.example .env

# boot up only postgres container
docker compose up postgres -d

# generate prisma client
pnpm prisma:generate

# run migration to create tables
pnpm prisma:migrate

# run seeding
pnpm prisma:seed

# run development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Start with docker compose

Make sure the docker is running on your computer and this command will not provide seeder data for database by default.

```bash
cp .env.example .env

# run command below if you want to insert seeder data
# pnpm prisma:seed

docker compose up -d
```

## Run playwright test

Make sure port 3000 & 5432 are not being use or if you running docker container from this project before, run this command `docker compose down`.

```bash
# run in headless mode
pnpm test:e2e
# or with ui
pnpm test:e2e:ui
```

## Disclaimer

I used AI-assisted tooling for scaffolding and implementation support, but reviewed, tested, and adapted the code myself.

## Technical assessment brief

Title: Court Reporting Workflow Manager
Goal: Build a simplified workflow system for managing transcription jobs

**Core Scenario**
A court reporting agency receives audio recordings.

They need to:

1. Assign jobs to court reporters
2. Assign editors to review transcripts
3. Track job status
4. Calculate payments

**Required Features**

1. Job Management
   Create a job:

- case_name
- duration (minutes)
- location (physical / remote)
- status
  Statuses:

```
  NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED
```

2. Reporter Assignment
   - Assign job to a reporter
   - Reporter attributes:
     - name
     - location
     - availability

- Logic:
  - Prefer same city for physical jobs
  - Allow remote assignment

3. Editor Assignment
   - Assign editor after transcription
   - Track review status
4. Payment Calculation

   ```
   Example rules:
    - Reporter paid per minute (e.g. 2000 IDR/min)
    - Editor paid per job (flat fee)

    System should:
    - calculate total payout
    - display per-job earnings
   ```

**Frontend Requirements:**
backoffice:

- data reporters + form
- data editors + form
- main scenario:
  - create job
  - job list
  - change of status and history record
  - assignments UI

criterias:

- support desktop and mobile screen

**Backend Requirements:**
REST API backend in nextjs:

create job:

- assign reporter/editor
- update status
- calculate payment

Use:

- Node.js + TypeScript
- Prisma + postgres

Create migrations and seeders with prisma:

1. editors
2. reporters
   1. location (city_name)
3. jobs

Rules:

- use smallint for column status and location in table jobs
- create CRUDs and also UI for table and form
  - rules:
    1. add filter and sorting
    2. add search with debounce
  - tables: 2. editors 3. reporters 4. jobs
- update e2e with playwright in folder ./tests
- use snake_case for column names in table

---

tech stacks:

- prisma for:
  - migration
  - models
- zod for validation
- useQuery - to fetch and mutation
- tailwind + daisyUI
- docker compose
- dayjs

mcp tools:

- postgres-mcp
- context7

## Screenshots

all pages screenshot are in folder [./docs/screenshots](./docs/screenshots)

## Notes

The improvised changes or decissions I made are listed below:

1. I decided to create server-side API endpoints directly in Next.js because, for this assessment test, building a full-stack application this way is easier and helps speed up development.
2. I decided to create CRUD pages for editors and reporters.
3. I added new job status **CANCELLED** if user want to cancel/remove it.
4. Add an auto-assign option in the Job Detail panel to automatically select a reporter in the same city as the job, if possible.
5. Added e2e tests with playwright by adding attribute 'data-testid', create test scenarios in folder './tests' and implemented testcontainers in playwright test setup.
