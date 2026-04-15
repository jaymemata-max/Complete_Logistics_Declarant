-- ============================================================
-- CL Customs Module — Sprint 1 Schema Migration
-- Run this in your Supabase SQL editor or via supabase db push
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- REFERENCE TABLES (seed data, read-only in app)
-- ─────────────────────────────────────────────────────────────

create table if not exists countries (
  id          uuid primary key default gen_random_uuid(),
  code        char(3) not null unique,
  name        varchar(40),
  zone        varchar(10)
);

create table if not exists package_types (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(10) not null unique,
  description varchar(40)
);

create table if not exists delivery_terms (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(10) not null unique,
  description varchar(40),
  place       varchar(40)
);

create table if not exists locations_of_goods (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(10) not null unique,
  place       varchar(40)
);

create table if not exists entrepots (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(10) not null unique,
  description varchar(40)
);

create table if not exists payment_accounts (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(20) not null unique,
  description varchar(40)
);

create table if not exists iso_container_codes (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(5) not null unique,
  description varchar(60)
);

create table if not exists cpc_codes (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(10) not null unique,  -- e.g. 4000-000
  extended    varchar(4),                   -- e.g. 4000
  national    varchar(3),                   -- e.g. 000
  type        varchar(5),                   -- e.g. INV4
  tax_code    varchar(10),
  description varchar(120),
  exemption   varchar(40)
);

create table if not exists ports (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(10) not null unique,
  description varchar(50),
  country_code char(3)
);

create table if not exists commodity_master (
  id                      uuid primary key default gen_random_uuid(),
  keyword                 varchar(30) not null,  -- CHANDELSBE — broker search term
  hs_code                 varchar(20),           -- CGOEDERENC
  commercial_description  varchar(40),           -- COMSCHRIJV
  goods_description       varchar(40),           -- CDOMSCHRIJ
  goods_description_2     varchar(40),           -- CDOMSCHRI2
  goods_description_3     varchar(40),           -- CDOMSCHRI3
  goods_description_4     varchar(40),           -- CDOMSCHRI4
  marks_1                 varchar(20),           -- CMERKEN1
  marks_2                 varchar(20),           -- CMERKEN2
  marks_3                 varchar(20),           -- CMERKEN3
  package_code            varchar(10),           -- CCOLLICODE
  supp_unit_code          varchar(10),           -- CQTYCOLLIC
  supp_unit_qty_1         numeric(10,2),
  supp_unit_qty_2         numeric(10,2),
  supp_unit_qty_3         numeric(10,2)
);

create index if not exists idx_commodity_master_keyword
  on commodity_master using gin(to_tsvector('simple', keyword));

create table if not exists importers (
  id              uuid primary key default gen_random_uuid(),
  asycuda_code    varchar(10) not null unique,  -- CNAMECODE
  name            varchar(40) not null,          -- CNAME
  address1        varchar(40),
  address2        varchar(40),
  address3        varchar(40),
  asycuda_name    varchar(15),                   -- CAANGEVERN (short code)
  contact         varchar(40),
  phone           varchar(15),
  fax             varchar(15),
  email           varchar(40),
  kvk_number      varchar(15),
  default_duty_terms varchar(10)                 -- CDUTYTERMS
);

create index if not exists idx_importers_name
  on importers using gin(to_tsvector('simple', name));

create index if not exists idx_importers_asycuda_code
  on importers (asycuda_code);

create table if not exists vessels (
  id                    uuid primary key default gen_random_uuid(),
  name                  varchar(60) not null,
  nationality           char(3),
  imo_number            varchar(20),
  typical_voyage_from   varchar(10),  -- UN/LOCODE e.g. USMIA
  notes                 text,
  created_at            timestamptz default now()
);

create index if not exists idx_vessels_name
  on vessels using gin(to_tsvector('simple', name));

create table if not exists freight_rates (
  id          uuid primary key default gen_random_uuid(),
  weight      numeric(10,2) not null,
  currency    char(3),
  zone_a      numeric(14,2),
  zone_b      numeric(14,2),
  zone_c      numeric(14,2),
  zone_d      numeric(14,2),
  zone_e      numeric(14,2),
  zone_f      numeric(14,2),
  zone_g      numeric(14,2),
  zone_h      numeric(14,2)
);

-- ─────────────────────────────────────────────────────────────
-- CORE TRANSACTION TABLES
-- ─────────────────────────────────────────────────────────────

create table if not exists templates (
  id              uuid primary key default gen_random_uuid(),
  code            varchar(30) not null unique,
  description     varchar(60) not null,
  created_by      uuid references auth.users(id),
  is_shared       boolean default true,
  header_snapshot jsonb not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create type if not exists declaration_status as enum (
  'DRAFT', 'SUBMITTED', 'REGISTERED', 'REJECTED'
);

create type if not exists shipment_type as enum (
  'LCL', 'FCL', 'Air', 'Alcohol'
);

create table if not exists declarations (
  id                      uuid primary key default gen_random_uuid(),
  status                  declaration_status not null default 'DRAFT',
  shipment_type           shipment_type not null,
  created_by              uuid references auth.users(id),
  submitted_at            timestamptz,
  registered_at           timestamptz,
  customs_reference_number varchar(30),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index if not exists idx_declarations_status on declarations (status);
create index if not exists idx_declarations_created_by on declarations (created_by);

create table if not exists declaration_headers (
  id                              uuid primary key default gen_random_uuid(),
  declaration_id                  uuid not null unique references declarations(id) on delete cascade,
  declaration_id_display          varchar(20),        -- field 1 AANGIFTE
  type_of_declaration             varchar(3),         -- IM / EX
  general_procedure_code          varchar(1),
  manifest_reference_number       varchar(28),
  total_number_of_packages        integer,
  customs_clearance_office_code   varchar(5),
  consignee_code                  varchar(17),
  consignee_name                  varchar(175),
  declarant_code                  varchar(17),
  declarant_name                  varchar(175),
  reference_year                  varchar(4),
  reference_number                varchar(17),
  country_first_destination       char(3),
  trading_country                 char(3),
  export_country_code             char(3),
  destination_country_code        char(3),
  container_flag                  boolean default false,
  location_of_goods               varchar(17),        -- field 30
  location_of_goods_address       varchar(60),        -- field 30a — SAD XML: Location_of_goods_address
  transport_identity              varchar(27),
  transport_nationality           char(3),
  border_transport_identity       varchar(27),
  border_transport_nationality    char(3),
  border_transport_mode           varchar(3),
  delivery_terms_code             varchar(3),
  delivery_terms_place            varchar(28),
  border_office_code              varchar(5),
  place_of_loading_code           varchar(5),
  deferred_payment_reference      varchar(17),
  financial_transaction_code_1    varchar(1),
  financial_transaction_code_2    varchar(1),
  warehouse_identification        varchar(17),
  invoice_amount                  numeric(15,2),
  invoice_currency_code           char(3),
  external_freight_amount         numeric(15,2),
  external_freight_currency_code  char(3),
  insurance_amount                numeric(15,2),
  insurance_currency_code         char(3),
  other_cost_amount               numeric(15,2),
  other_cost_currency_code        char(3),
  deduction_amount                numeric(15,2),
  deduction_currency_code         char(3),
  gross_weight                    numeric(17,3),
  calculation_working_mode        smallint default 0, -- 0=per value, 1=per weight, 2=no apportionment
  splits_flag                     boolean default false
);

create table if not exists declaration_items (
  id                                      uuid primary key default gen_random_uuid(),
  declaration_id                          uuid not null references declarations(id) on delete cascade,
  item_number                             smallint not null,
  trade_name_search                       varchar(30),
  hs_code                                 varchar(20),
  commercial_description                  varchar(44),
  description_of_goods                    varchar(88),
  country_of_origin_code                  char(3),
  number_of_packages                      integer,
  kind_of_packages_code                   varchar(17),
  marks1                                  varchar(35),
  marks2                                  varchar(35),
  invoice_amount                          numeric(15,2),
  invoice_currency_code                   char(3),
  gross_weight                            numeric(12,3),
  net_weight                              numeric(12,3),
  extended_customs_procedure              varchar(4),
  national_customs_procedure              varchar(3),
  preference_code                         varchar(17),  -- field 36
  valuation_method_code                   varchar(1),   -- field 43
  quota_number                            varchar(17),  -- field 39
  previous_document_summary_declaration   varchar(26),  -- field 40 — transport doc number
  previous_document_summary_declaration_sl varchar(4),  -- subline
  unique (declaration_id, item_number)
);

create table if not exists declaration_supplementary_units (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references declaration_items(id) on delete cascade,
  rank            smallint not null,
  code            varchar(3),   -- Supplementary_unit_code AN3
  quantity        numeric(11,2) -- Supplementary_unit_quantity
);

create table if not exists declaration_attached_docs (
  -- Field 44: Bijzondere vermeldingen — fully free text per SAD XML spec
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references declaration_items(id) on delete cascade,
  document_code       varchar(4),   -- Attached_document_code AN4
  document_name       varchar(70),  -- Attached_document_name AN70
  reference_number    varchar(30),  -- Attached_document_reference AN30
  document_date       date          -- Attached_document_date
);

create table if not exists declaration_vehicles (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null unique references declaration_items(id) on delete cascade,
  vin_number          varchar(25),
  stock_number        varchar(15),
  make                varchar(15),
  model               varchar(25),
  year                char(4),
  color               varchar(15),
  engine_type         varchar(15),
  engine_number       varchar(15),
  fuel_type           char(1),      -- G=Gasoline D=Diesel E=Electric H=Hybrid O=Other
  transmission        char(1),      -- A=Automatic M=Manual
  invoice_value       numeric(14,2),
  invoice_currency    char(3),
  gross_weight        numeric(6,2),
  net_weight          numeric(6,2)
);

create table if not exists declaration_containers (
  id                  uuid primary key default gen_random_uuid(),
  declaration_id      uuid not null references declarations(id) on delete cascade,
  item_number         smallint,
  container_number    varchar(20),
  container_type      varchar(4),
  empty_full_indicator varchar(3),
  goods_description   varchar(44),
  packages_type       varchar(17),
  packages_number     numeric(6,2),
  packages_weight     numeric(12,3)
);

-- ─────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER (applies to declarations and templates)
-- ─────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger declarations_updated_at
  before update on declarations
  for each row execute function set_updated_at();

create trigger templates_updated_at
  before update on templates
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- All authenticated users can read/write all declarations.
-- Anonymous access is blocked.
-- ─────────────────────────────────────────────────────────────

alter table declarations enable row level security;
alter table declaration_headers enable row level security;
alter table declaration_items enable row level security;
alter table declaration_supplementary_units enable row level security;
alter table declaration_attached_docs enable row level security;
alter table declaration_vehicles enable row level security;
alter table declaration_containers enable row level security;
alter table templates enable row level security;

-- Authenticated users can do everything on declarations
create policy "authenticated full access"
  on declarations for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on declaration_headers for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on declaration_items for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on declaration_supplementary_units for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on declaration_attached_docs for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on declaration_vehicles for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on declaration_containers for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access"
  on templates for all
  to authenticated
  using (true)
  with check (true);

-- Reference tables: read-only for authenticated, no anon access
do $$
declare
  tbl text;
  tbls text[] := array[
    'countries','package_types','delivery_terms','locations_of_goods',
    'entrepots','payment_accounts','iso_container_codes','cpc_codes',
    'ports','commodity_master','importers','vessels','freight_rates'
  ];
begin
  foreach tbl in array tbls loop
    execute format('alter table %I enable row level security', tbl);
    execute format(
      'create policy "authenticated read" on %I for select to authenticated using (true)',
      tbl
    );
  end loop;
end;
$$;
