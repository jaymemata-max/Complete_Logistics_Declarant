# CL Customs — Sprint 1 Setup

## What's in this sprint

- Supabase schema (all tables)
- Seed data from VD DBF files (13 reference tables, ~20,000 records)
- Updated `src/types.ts`
- Updated `src/lib/supabase.ts`
- Updated `src/components/tabs/HeaderTab.tsx`
  - Importer search (live Supabase lookup, 1,107 records)
  - Vessel autocomplete (live Supabase lookup)
  - All reference dropdowns wired to real data (countries, entrepots, payment accounts, etc.)
  - Field 30a input added
  - Field 48 rekeninghouder dropdown added
  - Field 49 entrepot dropdown added

---

## Step 1 — Create Supabase project

1. Go to https://supabase.com and create a new project.
2. Copy your project URL and anon key from Project Settings → API.

---

## Step 2 — Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

---

## Step 3 — Run the schema migration

In your Supabase dashboard, go to **SQL Editor** and run:

```
supabase/migrations/001_schema.sql
```

This creates all tables, indexes, enums, RLS policies, and triggers.

---

## Step 4 — Seed reference data

The seed script reads the VD DBF files and generates SQL inserts.

**If you have the VD data directory available:**

```bash
python3 supabase/seeds/seed.py \
  --dbf-dir /path/to/VDAUA5/data \
  --output supabase/seeds/seed_data.sql
```

Then run `supabase/seeds/seed_data.sql` in the Supabase SQL editor.

**Expected record counts after seeding:**

| Table | Records |
|---|---|
| countries | 260 |
| package_types | 25 |
| delivery_terms | 15 |
| locations_of_goods | 18 |
| entrepots | 9 |
| payment_accounts | 3 |
| iso_container_codes | 57 |
| cpc_codes | 264 |
| ports | 15,395 |
| commodity_master | 2,560 |
| importers | 1,107 |
| freight_rates | 499 |

---

## Step 5 — Add vessels manually

The VD schepen.DBF was not in the data export. Add vessels manually via the Supabase table editor, or insert them directly:

```sql
insert into vessels (name, nationality, typical_voyage_from) values
  ('REPULSE BAY', 'PA', 'USMIA'),
  ('POLAR LIGHT', 'NL', 'NLRTM'),
  ('AMERIJET', 'US', 'USMIA'),
  ('VIKING EAGLE', 'PA', 'USMIA');
-- Add more as needed
```

---

## Step 6 — Install Supabase client

```bash
npm install @supabase/supabase-js
```

---

## Step 7 — Copy updated source files

Replace these files in your prototype:

| This sprint | Replace in prototype |
|---|---|
| `src/types.ts` | `src/types.ts` |
| `src/lib/supabase.ts` | `src/lib/supabase.ts` (new file) |
| `src/components/tabs/HeaderTab.tsx` | `src/components/tabs/HeaderTab.tsx` |

---

## What's NOT in this sprint (coming in Sprint 2)

- Declaration list with status (needs Supabase save/load)
- Templates from Supabase
- DeclarationContext wired to Supabase persistence

For now, declarations still live in React state. Sprint 2 will wire persistence.

---

## Notes

- The `factor` field from the original prototype has been replaced by `calculationWorkingMode`
  (0 = per value, 1 = per weight, 2 = no apportionment) per the ASYCUDA SAD XML spec.
- `locationOfGoodsAddress` (field 30a) is capped at 60 chars in the UI and DB.
- Vessel selection auto-fills transport nationality and border transport fields.
- Importer selection auto-fills consignee code + name, and optionally delivery terms.
