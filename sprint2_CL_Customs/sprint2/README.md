# CL Customs — Sprint 2

## What's new

- Declarations save to Supabase (manual save via Save Draft button)
- Declaration list — VD-style table with all key columns
- Status workflow — DRAFT → SUBMITTED → REGISTERED / REJECTED
- Templates from Supabase — replaces hardcoded presets
- Save as Template — manager can save any header as a reusable template

---

## Step 1 — Run the migration in Supabase

In Supabase SQL Editor, run `supabase/migrations/002_sprint2.sql`.

This adds:
- `user_profiles` table with role field (broker / manager)
- Anon RLS policies on all transaction tables (needed until auth is wired in Sprint 3)
- 4 default templates seeded from VD data

---

## Step 2 — Copy files into the prototype

| Sprint 2 file | Replace in prototype |
|---|---|
| `src/lib/db.ts` | `src/lib/db.ts` (new file) |
| `src/components/DeclarationList.tsx` | `src/components/DeclarationList.tsx` |
| `src/components/DeclarationWorkspace.tsx` | `src/components/DeclarationWorkspace.tsx` |

---

## Step 3 — Update DeclarationContext

The context needs to pass `status` and `vehicles` correctly.
Tell Claude Code:

> In `src/store/DeclarationContext.tsx`:
> 1. The Declaration interface now requires `status`. Make sure every place that creates
>    a new declaration object includes `status: 'DRAFT' as const`.
> 2. The `setDeclaration` function should accept the full Declaration including status.
> 3. Remove the `loadPreset` function — templates now come from Supabase via DeclarationList.

---

## Step 4 — Commit and push to main

```
git add .
git commit -m "feat: sprint2 persistence, declaration list, templates"
git push origin sprint1
git checkout main
git merge sprint1
git push origin main
```

---

## Notes

- Save as Template is in the workspace header — currently no role check.
  Sprint 3 will add auth and restrict this to manager role.
- Declarations with a `local-` ID have not been saved to Supabase yet.
  Clicking Save Draft saves them and replaces the local ID with a real UUID.
- The declaration list refreshes on load and has a refresh button.
  It does not auto-refresh — brokers need to click refresh to see new declarations
  from other brokers.
