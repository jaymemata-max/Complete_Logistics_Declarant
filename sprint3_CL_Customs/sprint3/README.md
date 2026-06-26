# CL Customs — Sprint 3

## What's new

- ItemsTab — fully rewired with live Supabase lookups:
  - Trade name search → live commodity_master (2,560 records)
  - CPC dropdown → live cpc_codes (264 codes)
  - Package type dropdown → live package_types (25 types)
  - Country of origin → live countries (260 countries)
- Field 36 — Preference code input per item
- Field 39 — Quota/Contingent input per item
- Field 41 — Aanvullende eenheden (correct label, code capped to 3 chars)
- Field 44 — Bijzondere vermeldingen (document code, name, reference, date)
- Field 43 — W.M. code as proper dropdown (1–6)
- Invoice currency field per item
- New VehicleTab for car/vehicle declarations

---

## Claude Code instructions

Paste this into Claude Code (sprint1 branch):

---

> Please do the following on the sprint1 branch:
>
> 1. Copy `sprint3/src/components/tabs/ItemsTab.tsx` → `src/components/tabs/ItemsTab.tsx`
>
> 2. Copy `sprint3/src/components/tabs/VehicleTab.tsx` → `src/components/tabs/VehicleTab.tsx` (new file)
>
> 3. In `src/store/DeclarationContext.tsx`:
>    - Add `updateDeclaration` function to the context interface and implementation:
>      ```ts
>      updateDeclaration: (updates: Partial<Declaration>) => void;
>      ```
>      Implementation:
>      ```ts
>      const updateDeclaration = (updates: Partial<Declaration>) => {
>        setDeclaration(prev => prev ? { ...prev, ...updates } : null);
>      };
>      ```
>    - Add `updateDeclaration` to the context provider value
>    - Make sure `useDeclaration` hook exposes `updateDeclaration`
>
> 4. In `src/components/DeclarationWorkspace.tsx`:
>    - Import `VehicleTab` from `./tabs/VehicleTab`
>    - Import `Car` icon from `lucide-react`
>    - Add a Vehicles tab between Items and Containers:
>      ```tsx
>      { value: 'vehicles', icon: Car, label: 'Vehicles' }
>      ```
>    - Add the TabsContent for vehicles:
>      ```tsx
>      <TabsContent value="vehicles" className="mt-0">
>        <VehicleTab />
>      </TabsContent>
>      ```
>
> 5. Run `npm run build` and show me any TypeScript errors.
>
> 6. If clean, commit "feat: sprint3 items tab live lookups, fields 36/39/41/44, vehicle tab" and push to main.

---

## Notes

- The VehicleTab uses `updateDeclaration` from context to update the vehicles array
- Each vehicle links to one item via `itemId`
- The VehicleTab only appears if the declaration has items
- Commodity master search uses ilike on keyword, hs_code, and commercial_description
- Field 41 code is capped to 3 characters (AN3 per ASYCUDA spec)
- Field 44 document code is capped to 4 characters (AN4 per ASYCUDA spec)
