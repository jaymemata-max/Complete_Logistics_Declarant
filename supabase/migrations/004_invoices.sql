-- ============================================================
-- CL Customs — Sprint 4 Invoice Tables
-- Run AFTER 001_schema.sql, 002_sprint2.sql, 003_sprint4.sql
--
-- NOTE: 003_sprint4.sql added RLS policies for invoices and
-- invoice_lines but the CREATE TABLE statements were missing.
-- The policies in 003 would have failed silently. This migration
-- creates the tables and re-applies all policies safely.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- invoices
-- One invoice per declaration (though schema allows multiple)
-- ─────────────────────────────────────────────────────────────

create sequence if not exists invoices_seq;

create table if not exists invoices (
  id              uuid primary key default gen_random_uuid(),
  declaration_id  uuid not null references declarations(id) on delete cascade,
  -- Human-readable reference: INV-2026-0001, INV-2026-0002, etc.
  -- Uses a sequence so numbers are always unique and ascending.
  invoice_number  text not null default (
                    'INV-' || to_char(current_date, 'YYYY') || '-' ||
                    lpad(nextval('invoices_seq')::text, 4, '0')
                  ),
  invoice_date    date not null default current_date,
  due_date        date,
  total           numeric(14,2) not null default 0,
  paid            boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- invoice_lines
-- Each line = one service/fee on the invoice
-- ─────────────────────────────────────────────────────────────

create table if not exists invoice_lines (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  description varchar(120) not null,
  quantity    numeric(8,2) not null default 1,
  unit_price  numeric(14,2) not null default 0,
  amount      numeric(14,2) not null default 0,  -- quantity * unit_price, stored for performance
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_invoices_declaration_id
  on invoices (declaration_id);

create index if not exists idx_invoices_created_at
  on invoices (created_at desc);

create index if not exists idx_invoices_paid
  on invoices (paid);

create index if not exists idx_invoice_lines_invoice_id
  on invoice_lines (invoice_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger (matches declarations / templates pattern)
-- ─────────────────────────────────────────────────────────────

create trigger invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

alter table invoices enable row level security;
alter table invoice_lines enable row level security;

-- Authenticated users: full access
do $$ begin
  create policy "authenticated full access"
    on invoices for all
    to authenticated
    using (true) with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "authenticated full access"
    on invoice_lines for all
    to authenticated
    using (true) with check (true);
exception when duplicate_object then null;
end; $$;

-- Anon: full access (matches sprint2 pattern — tighten when auth is wired)
-- These were attempted in 003_sprint4.sql but would have failed since
-- the tables didn't exist yet. Safe to recreate here.
do $$ begin
  create policy "anon read invoices"
    on invoices for select to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon insert invoices"
    on invoices for insert to anon with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon update invoices"
    on invoices for update to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon delete invoices"
    on invoices for delete to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon read invoice_lines"
    on invoice_lines for select to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon insert invoice_lines"
    on invoice_lines for insert to anon with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon update invoice_lines"
    on invoice_lines for update to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon delete invoice_lines"
    on invoice_lines for delete to anon using (true);
exception when duplicate_object then null;
end; $$;

-- ─────────────────────────────────────────────────────────────
-- Missing FK indexes from 001_schema.sql (see review notes)
-- Safe to add here — all are IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_declaration_items_declaration_id
  on declaration_items (declaration_id);

create index if not exists idx_declaration_containers_declaration_id
  on declaration_containers (declaration_id);

create index if not exists idx_declaration_supplementary_units_item_id
  on declaration_supplementary_units (item_id);

create index if not exists idx_declaration_attached_docs_item_id
  on declaration_attached_docs (item_id);

create index if not exists idx_declaration_vehicles_item_id
  on declaration_vehicles (item_id);

create index if not exists idx_declarations_created_at
  on declarations (created_at desc);
