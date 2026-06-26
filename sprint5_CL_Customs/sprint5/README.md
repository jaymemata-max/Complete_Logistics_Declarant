# CL Customs — Sprint 5 (UI Changes)

## What's new

1. Logo clickable in both DeclarationList and DeclarationWorkspace — goes to home
2. DECLARANT text is now font-weight 900 (was too thin)
3. Home screen: dashboard + template cards + declarations list always visible together
4. Dashboard: status counts + bar chart with period selector (Today/Week/Month/Quarter/Year/All time)
5. "All Declarations" button in header scrolls to the list
6. Invoices button in header

---

## Claude Code instructions

Paste this into Claude Code on the sprint1 branch:

---

> Please do the following on the sprint1 branch:
>
> 1. Copy `sprint5/src/components/DeclarationList.tsx` → `src/components/DeclarationList.tsx`
>
> 2. In `src/components/DeclarationWorkspace.tsx`, find the logo/brand section in the header and:
>    - Wrap the logo text in a button element that calls `setDeclaration(null)` when clicked
>    - Change the "DECLARANT" span font weight to 900:
>      Replace: `<span className="font-medium text-secondary tracking-widest text-xs uppercase mt-1">Declarant</span>`
>      With: `<span className="text-secondary tracking-widest text-xs uppercase mt-1" style={{fontWeight: 900, letterSpacing: '0.15em'}}>DECLARANT</span>`
>    - Make sure `setDeclaration` is imported from `useDeclaration()`
>
> 3. In `src/components/InvoiceList.tsx`, find the logo/brand section in the header and apply the same DECLARANT font weight fix:
>    - Change the DECLARANT text to fontWeight 900
>
> 4. In `src/components/InvoiceWorkspace.tsx`, find the header brand section and apply the same fix.
>
> 5. Run `npm run build` and show any TypeScript errors.
>
> 6. If clean, commit "feat: sprint5 home dashboard, template cards, clickable logo, bold declarant" and push to main.
