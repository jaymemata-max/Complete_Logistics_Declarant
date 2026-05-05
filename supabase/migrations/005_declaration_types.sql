-- ============================================================
-- CL Customs — VD Declaration Type Codes
-- Run AFTER 001_schema.sql
--
-- VD/VDAUA stores declaration type as a 3-letter code plus a
-- general procedure code. The app previously used IM/EX, which
-- does not match real VD exports such as:
--   <Type_of_declaration>INV</Type_of_declaration>
--   <General_procedure_code>4</General_procedure_code>
-- ============================================================

create table if not exists declaration_types (
  id              uuid primary key default gen_random_uuid(),
  code            varchar(3) not null,
  procedure_code  varchar(1) not null,
  description     varchar(80) not null,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (code, procedure_code)
);

alter table declaration_types enable row level security;

do $$ begin
  create policy "anon read declaration_types"
    on declaration_types for select to anon using (true);
exception when duplicate_object then null;
end; $$;

do $$ begin
  create policy "authenticated read declaration_types"
    on declaration_types for select to authenticated using (true);
exception when duplicate_object then null;
end; $$;

insert into declaration_types (code, procedure_code, description, sort_order) values
  ('AZ',  '9', 'Aanvraag voor de verstrekking van accijnszegels', 10),
  ('INP', '4', 'Passagiers Invoer', 20),
  ('INV', '4', 'Definitieve Invoer', 30),
  ('INV', '5', 'Tijdelijke Invoer', 40),
  ('INV', '6', 'Wederinvoer', 50),
  ('INV', '7', 'Opslag', 60),
  ('IZM', '4', 'Definitieve Invoer (zonder manifest)', 70),
  ('IZM', '5', 'Tijdelijke Invoer (zonder manifest)', 80),
  ('IZM', '6', 'Wederinvoer (zonder manifest)', 90),
  ('IZM', '7', 'Opslag (zonder manifest)', 100),
  ('NIL', '9', 'Aangifte met een Nul, waarde en hoeveelheid', 110),
  ('NL',  '4', 'NL 302', 120),
  ('OP',  '9', 'Overige Procedures', 130),
  ('UIT', '1', 'Definitieve Uitvoer', 140),
  ('UIT', '2', 'Tijdelijke Uitvoer', 150)
on conflict (code, procedure_code) do update set
  description = excluded.description,
  sort_order = excluded.sort_order;

-- Correct existing app-created values.
update declaration_headers
set type_of_declaration = 'INV',
    general_procedure_code = '4'
where type_of_declaration = 'IM';

update declaration_headers
set type_of_declaration = 'UIT',
    general_procedure_code = '1'
where type_of_declaration = 'EX';

-- Correct saved templates created before this lookup existed.
update templates
set header_snapshot = jsonb_set(
  jsonb_set(header_snapshot, '{typeOfDeclaration}', '"INV"'::jsonb),
  '{generalProcedureCode}', '"4"'::jsonb
)
where header_snapshot->>'typeOfDeclaration' = 'IM';

update templates
set header_snapshot = jsonb_set(
  jsonb_set(header_snapshot, '{typeOfDeclaration}', '"UIT"'::jsonb),
  '{generalProcedureCode}', '"1"'::jsonb
)
where header_snapshot->>'typeOfDeclaration' = 'EX';
