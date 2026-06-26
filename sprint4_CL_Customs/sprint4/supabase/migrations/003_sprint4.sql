-- ============================================================
-- CL Customs — Sprint 4 Schema Migration
-- Run AFTER 001_schema.sql and 002_sprint2.sql
-- ============================================================

-- Anon RLS on invoices and invoice_lines
create policy "anon read invoices"
  on invoices for select to anon using (true);

create policy "anon insert invoices"
  on invoices for insert to anon with check (true);

create policy "anon update invoices"
  on invoices for update to anon using (true);

create policy "anon delete invoices"
  on invoices for delete to anon using (true);

create policy "anon read invoice_lines"
  on invoice_lines for select to anon using (true);

create policy "anon insert invoice_lines"
  on invoice_lines for insert to anon with check (true);

create policy "anon update invoice_lines"
  on invoice_lines for update to anon using (true);

create policy "anon delete invoice_lines"
  on invoice_lines for delete to anon using (true);
