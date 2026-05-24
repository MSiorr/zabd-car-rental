# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # eslint

# Database (requires .env.local with DB_* vars)
pnpm db:reset     # drop + recreate tables, seed data, load logic (tables.sql → data.sql → logic.sql)
pnpm db:logic     # reload only stored procedures, triggers, views, events
```

Copy `.env.example` → `.env.local` and fill in MySQL credentials + a 32-char `NEXTAUTH_SECRET`.

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · MySQL (mysql2) · Tailwind CSS + shadcn/ui · pnpm

**Auth:** JWT via `jose` stored in an httpOnly `session` cookie (7-day expiry). `lib/auth.ts` handles sign/verify. Route protection lives in `proxy.ts` (acts as middleware via `matcher`), not in `middleware.ts`.

**Three roles:** `admin`, `employee`, `client`. Clients access `/reservations`; admins and employees access `/admin`. Route guard logic is in `proxy.ts`.

**Database layer:** Single connection pool in `lib/db.ts`. API routes call raw SQL or MySQL stored procedures via `pool.execute` / `conn.execute`. No ORM.

**Key stored procedures (defined in `sql/logic.sql`):**
- `create_reservation` — validates availability, calculates price, inserts reservation in a transaction
- `return_vehicle` — completes rental, applies penalty if overdue, resets vehicle status
- `process_overdue_reservations` — cursor-based batch penalty processor (called manually or via event)

**Pricing:** `calculate_final_rate` MySQL function applies: `base_price × category_multiplier × (weekday/weekend split) × season_multiplier × promo_discount`. Config values (`weekend_multiplier`, `high_season_multiplier`, `payment_timeout_hours`, `late_penalty_per_day`) live in `System_Config` table.

**DB views used by API routes:**
- `view_available_fleet` — available vehicles with main image and branch
- `view_vehicle_card` — full vehicle detail with JSON attributes and images
- `view_monthly_summary` — revenue/penalty aggregates per month

**Vehicle attributes** are EAV: `Attributes` table defines attribute names/types; `Vehicle_Attribute` stores values across four typed columns (`Value_String`, `Value_Number`, `Value_Date`, `Value_Bool`). Marka/Model are queried as subselects by name in several API routes.

**SQL files:** `tables.sql` → `data.sql` → `logic.sql`. `db:reset` runs all three. Re-running `db:logic` is safe (uses `DROP IF EXISTS` + `CREATE OR REPLACE`).

## Next.js version note

This project uses Next.js 16 — APIs and conventions may differ from training data. Check `node_modules/next/dist/docs/` for the authoritative reference before writing framework-specific code.
