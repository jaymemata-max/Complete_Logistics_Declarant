// ─────────────────────────────────────────────────────────────
// INVOICE FUNCTIONS — add these to src/lib/db.ts
// ─────────────────────────────────────────────────────────────

// Add these imports at the top of db.ts if not already there:
// import { supabase } from './supabase';

export interface InvoiceSummary {
  id: string;
  declarationId: string;
  declarationDisplay?: string;
  consigneeName?: string;
  invoiceDate: string;
  dueDate?: string;
  total: number;
  paid: boolean;
  createdAt: string;
  lineCount?: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceDetail extends InvoiceSummary {
  lines: InvoiceLine[];
}

// NOTE: These functions use the supabase client already imported in db.ts.
// Copy only the function bodies below into db.ts, not the import line.

/*
import { supabase } from './supabase'; // already in db.ts
*/

export async function listInvoices(): Promise<InvoiceSummary[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, declaration_id, invoice_date, due_date, total, paid, created_at,
      declarations (
        customs_reference_number,
        declaration_headers ( declaration_id_display, consignee_name )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) { console.error('listInvoices error:', error); return []; }

  return (data || []).map((inv: any) => ({
    id: inv.id,
    declarationId: inv.declaration_id,
    declarationDisplay: inv.declarations?.declaration_headers?.declaration_id_display,
    consigneeName: inv.declarations?.declaration_headers?.consignee_name,
    invoiceDate: inv.invoice_date,
    dueDate: inv.due_date,
    total: inv.total || 0,
    paid: inv.paid || false,
    createdAt: inv.created_at,
  }));
}

export async function loadInvoice(id: string): Promise<InvoiceDetail | null> {
  const [invRes, linesRes] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        id, declaration_id, invoice_date, due_date, total, paid, created_at,
        declarations (
          customs_reference_number,
          declaration_headers ( declaration_id_display, consignee_name )
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('invoice_lines')
      .select('id, description, quantity, unit_price, amount')
      .eq('invoice_id', id)
      .order('created_at'),
  ]);

  if (invRes.error || !invRes.data) return null;
  const inv = invRes.data as any;

  return {
    id: inv.id,
    declarationId: inv.declaration_id,
    declarationDisplay: inv.declarations?.declaration_headers?.declaration_id_display,
    consigneeName: inv.declarations?.declaration_headers?.consignee_name,
    invoiceDate: inv.invoice_date,
    dueDate: inv.due_date,
    total: inv.total || 0,
    paid: inv.paid || false,
    createdAt: inv.created_at,
    lines: (linesRes.data || []).map((l: any) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity || 1,
      unitPrice: l.unit_price || 0,
      amount: l.amount || 0,
    })),
  };
}

export async function createInvoice(
  declarationId: string,
  lines: Omit<InvoiceLine, 'id'>[],
  dueDate?: string
): Promise<string | null> {
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const today = new Date().toISOString().split('T')[0];
  const due = dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .insert({
      declaration_id: declarationId,
      invoice_date: today,
      due_date: due,
      total,
      paid: false,
    })
    .select('id')
    .single();

  if (invErr || !inv) { console.error('createInvoice error:', invErr); return null; }

  if (lines.length > 0) {
    await supabase.from('invoice_lines').insert(
      lines.map(l => ({
        invoice_id: inv.id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        amount: l.amount,
      }))
    );
  }

  return inv.id;
}

export async function markInvoicePaid(id: string, paid: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('invoices')
    .update({ paid })
    .eq('id', id);
  if (error) { console.error('markInvoicePaid error:', error); return false; }
  return true;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  await supabase.from('invoice_lines').delete().eq('invoice_id', id);
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) { console.error('deleteInvoice error:', error); return false; }
  return true;
}
