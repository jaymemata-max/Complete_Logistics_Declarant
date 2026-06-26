-- ============================================================
-- CL Customs — Test Declaration Seed
-- Creates one fully populated LCL declaration for XML testing.
-- Run in Supabase SQL Editor.
-- After running, refresh the declaration list in the app
-- and open "TEST-LCL-2026-001" to generate and download the XML.
-- ============================================================

-- Clean up any previous test run
delete from declaration_supplementary_units
  where item_id in (
    select id from declaration_items
    where declaration_id in (
      select id from declarations where customs_reference_number = 'TEST-RUN'
    )
  );

delete from declaration_attached_docs
  where item_id in (
    select id from declaration_items
    where declaration_id in (
      select id from declarations where customs_reference_number = 'TEST-RUN'
    )
  );

delete from declaration_items
  where declaration_id in (
    select id from declarations where customs_reference_number = 'TEST-RUN'
  );

delete from declaration_containers
  where declaration_id in (
    select id from declarations where customs_reference_number = 'TEST-RUN'
  );

delete from declaration_headers
  where declaration_id in (
    select id from declarations where customs_reference_number = 'TEST-RUN'
  );

delete from declarations where customs_reference_number = 'TEST-RUN';

-- ── Step 1: Create the declaration root ──────────────────────────────────────

insert into declarations (
  id, status, shipment_type,
  customs_reference_number,
  created_at, updated_at
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'DRAFT',
  'LCL',
  'TEST-RUN',
  now(), now()
);

-- ── Step 2: Full header — every field filled ──────────────────────────────────

insert into declaration_headers (
  declaration_id,
  declaration_id_display,
  type_of_declaration,
  general_procedure_code,
  manifest_reference_number,
  total_number_of_packages,
  customs_clearance_office_code,
  consignee_code,
  consignee_name,
  declarant_code,
  declarant_name,
  reference_year,
  reference_number,
  country_first_destination,
  trading_country,
  export_country_code,
  destination_country_code,
  container_flag,
  location_of_goods,
  location_of_goods_address,
  transport_identity,
  transport_nationality,
  border_transport_identity,
  border_transport_nationality,
  border_transport_mode,
  delivery_terms_code,
  delivery_terms_place,
  border_office_code,
  place_of_loading_code,
  deferred_payment_reference,
  financial_transaction_code_1,
  financial_transaction_code_2,
  warehouse_identification,
  invoice_amount,
  invoice_currency_code,
  external_freight_amount,
  external_freight_currency_code,
  insurance_amount,
  insurance_currency_code,
  other_cost_amount,
  other_cost_currency_code,
  deduction_amount,
  deduction_currency_code,
  gross_weight,
  calculation_working_mode,
  splits_flag
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'TEST-LCL-2026-001',         -- Aangifte nummer
  'IM',                         -- Import declaration
  '4',                          -- General procedure code
  'HK02 2026 TEST001',          -- Manifest reference (office + year + number)
  332,                          -- Total packages
  'HK02',                       -- Clearance office (Harbour)
  '3184090',                    -- Consignee ASYCUDA code
  'MAGALIE REGALES',            -- Consignee name
  '5036782',                    -- Declarant code (Complete Logistics)
  'COMPLETE LOGISTICS',         -- Declarant name
  '2026',                       -- Reference year
  'HBOL16932-TEST',             -- Reference number (B/L number)
  'US',                         -- Country first destination
  'US',                         -- Trading country
  'US',                         -- Export country
  'AW',                         -- Destination (Aruba)
  false,                        -- No containers (LCL)
  'GE-30',                      -- Location of goods (Field 30)
  'COMPLETE LOGISTICS WAREHOUSE', -- Field 30a
  'AS FABRIZIA V-236',          -- Vessel name (Field 18)
  'PT',                         -- Vessel nationality (Portugal)
  'AS FABRIZIA V-236',          -- Border transport identity
  'PT',                         -- Border transport nationality
  '1',                          -- Mode: Sea
  'FOB',                        -- Delivery terms
  'MIAMI',                      -- Delivery terms place
  'HI01',                       -- Border office
  'AWBAR',                      -- Place of loading (Harbour)
  '',                           -- No deferred payment
  '1',                          -- Financial transaction code 1
  '1',                          -- Financial transaction code 2
  '',                           -- No warehouse/entrepot
  12538.80,                     -- Invoice amount
  'USD',
  748.25,                       -- External freight
  'USD',
  203.41,                       -- Insurance
  'USD',
  400.47,                       -- Other costs
  'USD',
  126.53,                       -- Deduction
  'USD',
  500.00,                       -- Total gross weight
  0,                            -- Calculation mode: per value
  false                         -- No splits
);

-- ── Step 3: Items — 5 different goods lines ────────────────────────────────

-- Item 1: Plastics/electronics (with supplementary unit)
insert into declaration_items (
  id, declaration_id, item_number,
  trade_name_search, hs_code,
  commercial_description, description_of_goods,
  country_of_origin_code,
  number_of_packages, kind_of_packages_code,
  marks1, marks2,
  invoice_amount, invoice_currency_code,
  gross_weight, net_weight,
  extended_customs_procedure, national_customs_procedure,
  preference_code, valuation_method_code,
  quota_number,
  previous_document_summary_declaration,
  previous_document_summary_declaration_sl
) values (
  'item-0001-0000-0000-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  1,
  'LAPTOP',
  '84714100',
  'PORTABLE ADP MACHINE',
  'LAPTOPS UNDER 10KG',
  'CN',
  8, 'STKS',
  'HBOL16932-TEST', '',
  2752.00, 'USD',
  60.00, 50.00,
  '4000', '000',
  '', '1',
  '',
  'HBOL16932-TEST',
  '1'
);

-- Item 2: Computer peripherals
insert into declaration_items (
  id, declaration_id, item_number,
  trade_name_search, hs_code,
  commercial_description, description_of_goods,
  country_of_origin_code,
  number_of_packages, kind_of_packages_code,
  marks1, marks2,
  invoice_amount, invoice_currency_code,
  gross_weight, net_weight,
  extended_customs_procedure, national_customs_procedure,
  preference_code, valuation_method_code,
  quota_number,
  previous_document_summary_declaration,
  previous_document_summary_declaration_sl
) values (
  'item-0002-0000-0000-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  2,
  'MONITOR',
  '85285100',
  'MONITORS',
  'FLAT SCREEN MONITORS',
  'US',
  9, 'STKS',
  'IDEM', '',
  1161.00, 'USD',
  60.00, 50.00,
  '4000', '000',
  '', '1',
  '',
  'HBOL16932-TEST',
  '1'
);

-- Item 3: Audio equipment
insert into declaration_items (
  id, declaration_id, item_number,
  trade_name_search, hs_code,
  commercial_description, description_of_goods,
  country_of_origin_code,
  number_of_packages, kind_of_packages_code,
  marks1, marks2,
  invoice_amount, invoice_currency_code,
  gross_weight, net_weight,
  extended_customs_procedure, national_customs_procedure,
  preference_code, valuation_method_code,
  quota_number,
  previous_document_summary_declaration,
  previous_document_summary_declaration_sl
) values (
  'item-0003-0000-0000-000000000003',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  3,
  'SPEAKER',
  '85182200',
  'LUIDSPREKERS',
  'LOUDSPEAKERS IN ENCLOSURES',
  'US',
  30, 'STKS',
  'IDEM', '',
  1704.72, 'USD',
  55.00, 50.00,
  '4000', '000',
  '', '1',
  '',
  'HBOL16932-TEST',
  '1'
);

-- Item 4: Kitchen appliances (with attached document — import permit)
insert into declaration_items (
  id, declaration_id, item_number,
  trade_name_search, hs_code,
  commercial_description, description_of_goods,
  country_of_origin_code,
  number_of_packages, kind_of_packages_code,
  marks1, marks2,
  invoice_amount, invoice_currency_code,
  gross_weight, net_weight,
  extended_customs_procedure, national_customs_procedure,
  preference_code, valuation_method_code,
  quota_number,
  previous_document_summary_declaration,
  previous_document_summary_declaration_sl
) values (
  'item-0004-0000-0000-000000000004',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  4,
  'KEUKENTOESTEL',
  '85094000',
  'ELEKTRISCHE KEUKENTOESTELLEN',
  'ELECTRIC KITCHEN APPLIANCES',
  'US',
  26, 'STKS',
  'IDEM', '',
  1880.00, 'USD',
  150.00, 120.00,
  '4000', '000',
  '', '1',
  '',
  'HBOL16932-TEST',
  '1'
);

-- Item 5: Plastics — field 36 (preference) and field 39 (quota) filled
insert into declaration_items (
  id, declaration_id, item_number,
  trade_name_search, hs_code,
  commercial_description, description_of_goods,
  country_of_origin_code,
  number_of_packages, kind_of_packages_code,
  marks1, marks2,
  invoice_amount, invoice_currency_code,
  gross_weight, net_weight,
  extended_customs_procedure, national_customs_procedure,
  preference_code, valuation_method_code,
  quota_number,
  previous_document_summary_declaration,
  previous_document_summary_declaration_sl
) values (
  'item-0005-0000-0000-000000000005',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  5,
  'HOEZEN',
  '42029200',
  'HOEZEN VAN KUNSTSTOF',
  'COVERS AND CASES OF PLASTIC',
  'US',
  44, 'STKS',
  'IDEM', '',
  449.52, 'USD',
  12.00, 10.00,
  '4000', '000',
  '100',                         -- Field 36: preference code
  '1',
  'QT-2026-001',                 -- Field 39: quota number
  'HBOL16932-TEST',
  '1'
);

-- ── Step 4: Supplementary units (Field 41) on item 1 ─────────────────────────

insert into declaration_supplementary_units (
  item_id, rank, code, quantity
) values
  ('item-0001-0000-0000-000000000001', 1, 'PCE', 8);

-- ── Step 5: Attached documents (Field 44) on item 4 ──────────────────────────

insert into declaration_attached_docs (
  item_id,
  document_code,
  document_name,
  reference_number,
  document_date
) values
  (
    'item-0004-0000-0000-000000000004',
    'INV',
    'Commercial Invoice',
    'INV-2026-TEST-001',
    '2026-04-01'
  ),
  (
    'item-0004-0000-0000-000000000004',
    'PKL',
    'Packing List',
    'PKL-2026-TEST-001',
    '2026-04-01'
  );

-- ── Done ─────────────────────────────────────────────────────────────────────
-- Expected result: declaration "TEST-LCL-2026-001" appears in the list.
-- Open it, go to XML Preview, click Download XML.
-- The XML should contain all 5 items, supplementary unit on item 1,
-- attached documents on item 4, preference code on item 5, quota on item 5.
