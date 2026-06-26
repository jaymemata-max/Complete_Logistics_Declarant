# CL Customs — Sprint 4

## What's new

- **Supplier Invoice Import** — paste/upload CSV packing list, map columns, preview, append items
- **Freight Rate Calculator** — zone + weight lookup from 499-row rate table, fills External Freight field
- **Invoicing Module** — generate invoices per declaration, list view with paid/outstanding tracking, print support

---

## Step 1 — Supabase SQL

Run `supabase/migrations/003_sprint4.sql` in the SQL Editor.
Adds anon RLS policies on the invoices and invoice_lines tables.

---

## Step 2 — Claude Code instructions

Paste this into Claude Code on the sprint1 branch:

---

> Please do the following on the sprint1 branch:
>
> **New files to copy:**
> 1. `sprint4/src/components/ImportItemsModal.tsx` → `src/components/ImportItemsModal.tsx`
> 2. `sprint4/src/components/FreightCalculatorModal.tsx` → `src/components/FreightCalculatorModal.tsx`
> 3. `sprint4/src/components/InvoiceList.tsx` → `src/components/InvoiceList.tsx`
> 4. `sprint4/src/components/InvoiceWorkspace.tsx` → `src/components/InvoiceWorkspace.tsx`
> 5. `sprint4/src/components/GenerateInvoiceModal.tsx` → `src/components/GenerateInvoiceModal.tsx`
>
> **Update src/lib/db.ts:**
> Append the contents of `sprint4/src/lib/invoice_functions.ts` to the bottom of `src/lib/db.ts`.
> Remove the first line of invoice_functions.ts (the comment about imports) since db.ts already imports supabase.
> Also export the InvoiceSummary, InvoiceLine, and InvoiceDetail interfaces from db.ts.
>
> **Update src/components/tabs/ItemsTab.tsx:**
> - Add an "Import Items" button next to the "Add Item" button in the header bar
> - Import `ImportItemsModal` from `../../components/ImportItemsModal` (note: not `../../components/tabs/...`)
>   Actually the path from tabs/ to components/ is `../ImportItemsModal`
> - Add state: `const [showImport, setShowImport] = useState(false);`
> - When the button is clicked, set showImport to true
> - Render the modal when showImport is true:
>   ```tsx
>   {showImport && (
>     <ImportItemsModal
>       existingItemCount={declaration.items.length}
>       onImport={(newItems) => {
>         newItems.forEach((item, i) => {
>           // Use addItem then updateItem pattern
>           // Actually: call updateDeclaration directly
>           // Simplest: just add to declaration.items via updateDeclaration
>         });
>         // Use this approach:
>         const { declaration, updateDeclaration } = useDeclaration();
>         // Actually import addItem from context and call it for each
>       }}
>       onClose={() => setShowImport(false)}
>     />
>   )}
>   ```
>   IMPORTANT: The onImport handler should call updateDeclaration to append the new items:
>   ```tsx
>   onImport={(newItems) => {
>     const startNumber = declaration.items.length + 1;
>     const itemsToAdd = newItems.map((item, i) => ({
>       ...item,
>       id: Math.random().toString(36).substring(2, 9),
>       itemNumber: startNumber + i,
>       supplementaryUnits: [],
>       attachedDocuments: [],
>     })) as DeclarationItem[];
>     updateDeclaration({ items: [...declaration.items, ...itemsToAdd] });
>     setShowImport(false);
>   }}
>   ```
>   Import `DeclarationItem` from `../../types` and `updateDeclaration` from the declaration context.
>
> **Update src/components/tabs/HeaderTab.tsx:**
> - Import `FreightCalculatorModal` from `../FreightCalculatorModal`
> - Add state: `const [showFreight, setShowFreight] = useState(false);`
> - Next to the External Freight Amount input, add a small "Calculate" button that sets showFreight to true
> - Render the modal:
>   ```tsx
>   {showFreight && (
>     <FreightCalculatorModal
>       currentWeight={header.grossWeight}
>       onApply={(amount, currency) => {
>         updateHeader({ externalFreightAmount: amount, externalFreightCurrencyCode: currency });
>       }}
>       onClose={() => setShowFreight(false)}
>     />
>   )}
>   ```
>
> **Update src/components/DeclarationWorkspace.tsx:**
> - Import `GenerateInvoiceModal` from `./GenerateInvoiceModal`
> - Import `Receipt` icon from lucide-react (or use `FileText` if Receipt not available)
> - Add state: `const [showInvoice, setShowInvoice] = useState(false);`
> - Add a "Generate Invoice" button in the header bar (near Save Draft)
> - Render the modal when showInvoice is true:
>   ```tsx
>   {showInvoice && !declaration.id.startsWith('local-') && (
>     <GenerateInvoiceModal
>       declarationId={declaration.id}
>       consigneeName={declaration.header.consigneeName}
>       declarationDisplay={declaration.header.declarationId}
>       onCreated={(invoiceId) => {
>         setShowInvoice(false);
>         // Optionally navigate to invoice
>       }}
>       onClose={() => setShowInvoice(false)}
>     />
>   )}
>   ```
>   Note: only show the Generate Invoice button if declaration.id does not start with 'local-' (i.e. it has been saved to Supabase).
>   If it starts with 'local-', show a tooltip/message "Save the declaration first to generate an invoice."
>
> **Update src/components/DeclarationList.tsx:**
> - Add an "Invoices" button in the header bar
> - The button should call a prop `onOpenInvoices: () => void`
> - Add this prop to the component interface
>
> **Update src/App.tsx:**
> - Add view state: `const [view, setView] = useState<'declarations' | 'invoices' | 'invoice-detail'>('declarations');`
> - Add state for selected invoice ID: `const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);`
> - Import `InvoiceList` and `InvoiceWorkspace`
> - Update AppContent to handle the three views:
>   ```tsx
>   const AppContent: React.FC = () => {
>     const { declaration } = useDeclaration();
>     const [view, setView] = useState<'declarations' | 'invoices' | 'invoice-detail'>('declarations');
>     const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
>
>     if (declaration) return <DeclarationWorkspace />;
>
>     if (view === 'invoice-detail' && selectedInvoiceId) {
>       return (
>         <InvoiceWorkspace
>           invoiceId={selectedInvoiceId}
>           onBack={() => setView('invoices')}
>           onDeleted={() => { setSelectedInvoiceId(null); setView('invoices'); }}
>         />
>       );
>     }
>
>     if (view === 'invoices') {
>       return (
>         <InvoiceList
>           onBack={() => setView('declarations')}
>           onOpenInvoice={(id) => { setSelectedInvoiceId(id); setView('invoice-detail'); }}
>         />
>       );
>     }
>
>     return (
>       <DeclarationList
>         onOpenInvoices={() => setView('invoices')}
>       />
>     );
>   };
>   ```
>
> **Run `npm run build`** and fix any TypeScript errors.
>
> **Then commit** "feat: sprint4 import items, freight calculator, invoicing" and push to main.

---

## Notes

- The Import Items button is in the Items tab header, next to Add Item
- The Calculate button is next to the External Freight Amount field in HeaderTab
- Generate Invoice only shows when the declaration has been saved (no local- prefix on ID)
- Invoice printing uses window.print() — the header is hidden with print:hidden CSS class
- Invoices navigation: Declaration List → Invoices button → Invoice List → click row → Invoice detail
