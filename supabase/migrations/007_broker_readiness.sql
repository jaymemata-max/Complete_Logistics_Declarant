-- ============================================================
-- CL Customs - Broker Readiness Reference Data and Workflow Fields
-- Run AFTER 006_feedback_cleanup.sql
-- ============================================================

-- Field 44 document code lookup from VD attachdocs.
create table if not exists attached_document_types (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(4) not null unique,
  description varchar(90) not null,
  created_at  timestamptz not null default now()
);

alter table attached_document_types enable row level security;

do $$ begin
  create policy "anon read attached_document_types"
    on attached_document_types for select to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "authenticated read attached_document_types"
    on attached_document_types for select to authenticated using (true);
exception when duplicate_object then null;
end; $$;

insert into attached_document_types (code, description) values
  ('001', 'Factuur'),
  ('002', 'Vrachtbrief (bill of lading)'),
  ('003', 'Vracht verzekeringsbewijs'),
  ('004', 'Certificate of Title bij vervoermiddelen'),
  ('005', 'Cites Verklaring'),
  ('006', 'Consent tot invoer vuurwapens'),
  ('007', 'Energieverbruik label'),
  ('008', 'Inventarislijst persoonlijke en huishoudelijk goederen bij verhuizing'),
  ('009', 'Aanvraagformulier vrijstelling verhuisboedel'),
  ('010', 'Efficient energieverbruikcertificaat'),
  ('011', 'Bewijs van inschrijving in het bevolkingsregister van Aruba'),
  ('012', 'Bewijs van uitschrijving uit het land van herkomst'),
  ('013', 'Gezondheidscertificaat voor huisdieren'),
  ('014', 'Motorvoertuig verzekeringsbewijs'),
  ('015', 'Kentekenbewijs motorvoertuig'),
  ('016', 'Identiteitsbewijs'),
  ('017', 'Werk- en verblijfvergunning vreemdelingen'),
  ('018', 'Bewijs van oorsprong (bijv Euro 1 certificaat)'),
  ('019', 'Invoervergunning Economische Zaken'),
  ('020', 'Invoervergunning Veterinaire Dienst'),
  ('021', 'Invoervergunning Inspectie voor Geneesmiddelen'),
  ('022', 'Invoervergunning Directie Telecommunicatiezaken'),
  ('023', 'Paklijst'),
  ('024', 'Binnenlandse Vrachtbrief'),
  ('025', 'Kopie Paspoort'),
  ('026', 'Gezondheidsverklaring'),
  ('027', 'Overlijdens akte'),
  ('028', 'Notariele akte van nalatenschap'),
  ('029', 'Studenten Kaart of soortgelijk'),
  ('030', 'Bewijs van studie beeindiging'),
  ('031', 'Vorderings Etiket (claim Tag)'),
  ('032', 'Reisbiljet'),
  ('033', 'Brief Minister'),
  ('034', 'Ministeriele beschikking'),
  ('035', 'Ministeriele regeling'),
  ('036', 'Medische verklaring'),
  ('037', 'Vergunning openbaar personenvervoer'),
  ('038', 'Rijvergunning openbaar personenvervoer'),
  ('039', 'Hulpbestuurder kaart'),
  ('040', 'Rijbewijs'),
  ('041', 'Garantie bewijs'),
  ('042', 'Vestigingsvergunning'),
  ('043', 'Landsbesluit'),
  ('044', 'Landsverordening'),
  ('045', 'Douaneverklaring'),
  ('046', 'Beschikking'),
  ('047', 'Betalingsbewijs'),
  ('048', 'Koopakte'),
  ('049', 'Aanvraagformulier vrijstellingen m.u.v. verhuisgoederen'),
  ('050', 'Resultaat verificatie gedistilleerd'),
  ('051', 'Analyse certificaat ethyl alcohol')
on conflict (code) do update set
  description = excluded.description;

-- Field 48 real deferred payment accounts. Cash/CONTANT stays blank in XML.
insert into payment_accounts (code, description) values
  ('MARICAR LOG. 33', 'Complete Logistics deferred account'),
  ('MARICAR LOG. 34', 'Complete Logistics deferred account')
on conflict (code) do update set
  description = excluded.description;

-- Fields needed to track the ASYCUDA workflow after XML upload.
alter table declarations
  add column if not exists asycuda_status varchar(30),
  add column if not exists asycuda_response_message text,
  add column if not exists query_reason text,
  add column if not exists payment_status varchar(30) not null default 'PENDING',
  add column if not exists cleared_at timestamptz;

create table if not exists declaration_workflow_events (
  id             uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references declarations(id) on delete cascade,
  event_type     varchar(30) not null,
  message        text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_declaration_workflow_events_declaration_id
  on declaration_workflow_events (declaration_id);

create index if not exists idx_declaration_workflow_events_created_at
  on declaration_workflow_events (created_at desc);

alter table declaration_workflow_events enable row level security;

do $$ begin
  create policy "authenticated full access"
    on declaration_workflow_events for all
    to authenticated
    using (true) with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon read declaration_workflow_events"
    on declaration_workflow_events for select
    to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon insert declaration_workflow_events"
    on declaration_workflow_events for insert
    to anon with check (true);
exception when duplicate_object then null;
end; $$;

-- Optional structured storage for split/degroupage lines outside item rows.
create table if not exists declaration_split_lines (
  id                uuid primary key default gen_random_uuid(),
  declaration_id    uuid not null references declarations(id) on delete cascade,
  source_type       varchar(20) not null check (source_type in ('SPLITSING', 'DEGROUPAGE')),
  house_bill_number varchar(26),
  subline           varchar(4),
  packages          numeric(10,2),
  gross_weight      numeric(12,3),
  goods_description varchar(88),
  created_at        timestamptz not null default now()
);

create index if not exists idx_declaration_split_lines_declaration_id
  on declaration_split_lines (declaration_id);

alter table declaration_split_lines enable row level security;

do $$ begin
  create policy "authenticated full access"
    on declaration_split_lines for all
    to authenticated
    using (true) with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon read declaration_split_lines"
    on declaration_split_lines for select
    to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon insert declaration_split_lines"
    on declaration_split_lines for insert
    to anon with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon update declaration_split_lines"
    on declaration_split_lines for update
    to anon using (true) with check (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "anon delete declaration_split_lines"
    on declaration_split_lines for delete
    to anon using (true);
exception when duplicate_object then null;
end; $$;
