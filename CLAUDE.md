# Complete Logistics Declarant - Reference App

This standalone Declarant app is now the source/reference implementation for the customs declaration module that will be integrated into the main shipment management app.

## Integration Target

- Main app repo: `Complete-Logistics-Aruba/backer-booster`
- Standalone Declarant repo: `jaymemata-max/Complete_Logistics_Declarant`
- Main integration work should happen in `backer-booster`.
- This repo should be used to reference validated Declarant behavior, XML generation, Supabase schema, migrations, and broker test examples.

## Safety Rules

- Do not treat this app as the long-term production surface unless explicitly instructed.
- Do not write to production Supabase without a fresh backup and approval.
- Keep ASYCUDA XML changes verified against known VDAUA/VD exports.
- Preserve broker-specific behavior in documentation before moving it into the main app.

## Useful Areas

- `src/utils/xmlGenerator.ts` - ASYCUDA XML generation.
- `src/components/DeclarationWorkspace.tsx` - final declaration workspace.
- `src/components/tabs/` - SAD field entry tabs.
- `src/lib/db.ts` - standalone Supabase persistence layer.
- `supabase/migrations/` - Declarant schema evolution.
- `Brokerage automation/` in the parent workspace - source documents, examples, and VDAUA reference material.
