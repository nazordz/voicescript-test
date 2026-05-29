# Voicescript

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Start with docker compose

```bash
docker compose up -d
```

## Disclaimer

I used AI-assisted tooling for scaffolding and implementation support, but reviewed, tested, and adapted the code myself. I can explain the architecture and implementation decisions.

## Brief

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

create job
  - assign reporter/editor
  - update status
  - calculate payment

Use:
  - Node.js + TypeScript
  - Prisma + postgres

Create migrations and seeders with prisma
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
    - tables:
      2. editors
      3. reporters
      4. jobs
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
