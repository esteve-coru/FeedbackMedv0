# FeedbackMed — MVP Pipeline Demo

Goal of this repo: prove the pipeline works end-to-end — **CSV → Supabase (Postgres) →
simple server-side calculation → a plain, unstyled page** — on the free tier of
Supabase and Vercel. Nothing here is meant to look good yet; it's meant to *connect*.

## What's already built for you

- ✅ Database schema (`lib/db/schema.ts`) — one table, `survey_responses`
- ✅ Migration SQL generated (`drizzle/0000_giant_joseph.sql`)
- ✅ CSV import script with validation (`scripts/import-csv.ts`)
- ✅ 35-row fictional test dataset (`sample-data/test-patients.csv`) — this is your
  Task 0 stand-in for a real SAP export
- ✅ A minimal Next.js page that queries the DB and shows both raw rows and processed
  stats (average score, top-box/bottom-box %, breakdown by ward)
- ✅ Build verified locally (`npm run build` passes clean)

I could not create accounts or deploy anything myself — account creation and
production credentials are things you need to own (see the ownership note in the
original work order, which is correct). Everything below is the minimum you need to
click through.

## Step 1 — Create the Supabase project (~5 min)

1. Go to supabase.com and create an account **under your business email**, not a
   personal one.
2. New Project → name it `feedbackmed-mvp` → set region to **Zurich (eu-central-2)**
   → set a database password (save it somewhere — you'll need it in Step 2) → free tier.
3. Once the project is ready: **Project Settings → Database → Connection string →
   "Transaction pooler"**. Copy it — it looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-2.pooler.supabase.com:6543/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the real password from step 2.

## Step 2 — Configure this project locally

```bash
cp .env.example .env.local
```
Paste the connection string from Step 1 as `DATABASE_URL` in `.env.local`.

```bash
npm install
npm run db:migrate      # creates the survey_responses table in Supabase
npm run import:csv      # imports the 35 fictional rows
npm run dev              # http://localhost:3000 — you should see the data + stats
```

If that page shows a table of names and a stats block, the whole pipeline works
locally. That's the core proof.

## Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "FeedbackMed MVP pipeline demo"
```
Create an empty repo on GitHub under your business account, then follow GitHub's
"push an existing repository" instructions it shows you.

## Step 4 — Deploy to Vercel (~5 min)

1. Go to vercel.com, sign up **under your business account/email**, free tier (Hobby).
2. "Add New Project" → import the GitHub repo you just pushed.
3. Before deploying, expand **Environment Variables** and add:
   - `DATABASE_URL` = the same Supabase connection string from Step 1
4. Deploy. Vercel will run `npm run build` — the same build I already verified passes
   locally, so it should succeed first try.
5. Once live, connecting `feedbackmed.ch` is Vercel → Project → Settings → Domains.

At this point you have a public (unauthenticated — see caveat below) URL showing live
data pulled from Supabase, computed on the server, which is exactly the demo you
described: "if we have a CSV, we can import it, it's stored via Supabase, filtered and
processed, and shown in a frontend deployed on Vercel."

## Trying a different CSV

```bash
npm run import:csv -- ./path/to/your-file.csv
```
Same column format as `sample-data/test-patients.csv`: `patient_name,admission_date,
discharge_date,ward,age,contact_preference,nps_score` (nps_score 0–10).

## What's deliberately NOT in this MVP

- No auth — the page is public. Fine for a demo with fictional data; **do not point
  this at real patient data as-is.**
- No tokens, no real survey form, no email/SMS invitations (that's Task 1 and Task 4
  from the work order).
- No multi-tenant separation or row-level security. This is a single flat table.
- No real SAP interface — the CSV import script *is* the stand-in.

These are exactly the things the original work order scopes as later tasks (1, 2, 3,
4). Nothing here contradicts that plan — this is only the narrow slice we discussed:
schema + import + hosted display.

## Before this touches real patient data

Two things from our architecture discussion need to land before any real patient
appears in this database: splitting identity data from response data (the
three-store model), and row-level security enforcing tenant isolation. Retrofitting
those onto a live schema is significantly more expensive than building them in from
the start — worth doing before Task 4 (real invitation flow), not after.

## Note on `npm audit`

`npm audit` will flag `sharp` (an image-optimization dependency of Next.js) — it's
unused here since this app doesn't use `next/image`, so it's low risk for this demo.
Worth revisiting before this ships anywhere real.
