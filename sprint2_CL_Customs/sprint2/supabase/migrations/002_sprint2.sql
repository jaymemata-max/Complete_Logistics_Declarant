-- ============================================================
-- CL Customs Module — Sprint 2 Schema Migration
-- Run AFTER 001_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- USER ROLES
-- Manager/admin flag stored in auth.users metadata.
-- We use a simple profiles table to track roles.
-- ─────────────────────────────────────────────────────────────

create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   varchar(60),
  role        varchar(20) not null default 'broker',  -- 'broker' or 'manager'
  created_at  timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "users can read all profiles"
  on user_profiles for select
  to anon, authenticated
  using (true);

create policy "users can update own profile"
  on user_profiles for update
  to authenticated
  using (auth.uid() = id);

-- Allow anon to read declarations list (no auth yet in Sprint 2)
-- This will be tightened when auth is fully wired in Sprint 3
create policy "anon read declarations"
  on declarations for select
  to anon
  using (true);

create policy "anon read declaration_headers"
  on declaration_headers for select
  to anon
  using (true);

create policy "anon read declaration_items"
  on declaration_items for select
  to anon
  using (true);

create policy "anon insert declarations"
  on declarations for insert
  to anon
  with check (true);

create policy "anon update declarations"
  on declarations for update
  to anon
  using (true);

create policy "anon insert declaration_headers"
  on declaration_headers for insert
  to anon
  with check (true);

create policy "anon update declaration_headers"
  on declaration_headers for update
  to anon
  using (true);

create policy "anon insert declaration_items"
  on declaration_items for insert
  to anon
  with check (true);

create policy "anon update declaration_items"
  on declaration_items for update
  to anon
  using (true);

create policy "anon delete declaration_items"
  on declaration_items for delete
  to anon
  using (true);

create policy "anon read declaration_containers"
  on declaration_containers for select to anon using (true);

create policy "anon insert declaration_containers"
  on declaration_containers for insert to anon with check (true);

create policy "anon update declaration_containers"
  on declaration_containers for update to anon using (true);

create policy "anon delete declaration_containers"
  on declaration_containers for delete to anon using (true);

create policy "anon read declaration_supplementary_units"
  on declaration_supplementary_units for select to anon using (true);

create policy "anon insert declaration_supplementary_units"
  on declaration_supplementary_units for insert to anon with check (true);

create policy "anon update declaration_supplementary_units"
  on declaration_supplementary_units for update to anon using (true);

create policy "anon delete declaration_supplementary_units"
  on declaration_supplementary_units for delete to anon using (true);

create policy "anon read declaration_attached_docs"
  on declaration_attached_docs for select to anon using (true);

create policy "anon insert declaration_attached_docs"
  on declaration_attached_docs for insert to anon with check (true);

create policy "anon update declaration_attached_docs"
  on declaration_attached_docs for update to anon using (true);

create policy "anon delete declaration_attached_docs"
  on declaration_attached_docs for delete to anon using (true);

create policy "anon read declaration_vehicles"
  on declaration_vehicles for select to anon using (true);

create policy "anon insert declaration_vehicles"
  on declaration_vehicles for insert to anon with check (true);

create policy "anon update declaration_vehicles"
  on declaration_vehicles for update to anon using (true);

create policy "anon delete declaration_vehicles"
  on declaration_vehicles for delete to anon using (true);

-- Templates — anon can read shared templates, but only insert/update
-- will be locked to manager role once auth is wired
create policy "anon read templates"
  on templates for select to anon using (true);

create policy "anon insert templates"
  on templates for insert to anon with check (true);

create policy "anon update templates"
  on templates for update to anon using (true);

-- ─────────────────────────────────────────────────────────────
-- SEED: Default templates from VD (replacing hardcoded presets)
-- Based on VD templates table data
-- ─────────────────────────────────────────────────────────────

insert into templates (code, description, is_shared, header_snapshot) values
(
  'LCL-SEA-MIAMI',
  'LCL Sea — Miami (Standard)',
  true,
  '{
    "declarationId": "",
    "shipmentType": "LCL",
    "typeOfDeclaration": "IM",
    "generalProcedureCode": "4",
    "manifestReferenceNumber": "",
    "totalNumberOfPackages": 0,
    "customsClearanceOfficeCode": "HK02",
    "consigneeCode": "",
    "consigneeName": "",
    "declarantCode": "5036782",
    "declarantName": "COMPLETE LOGISTICS",
    "referenceYear": "",
    "referenceNumber": "",
    "countryFirstDestination": "US",
    "tradingCountry": "US",
    "exportCountryCode": "US",
    "destinationCountryCode": "AW",
    "containerFlag": false,
    "locationOfGoods": "GE-30",
    "locationOfGoodsAddress": "",
    "transportIdentity": "",
    "transportNationality": "",
    "borderTransportIdentity": "",
    "borderTransportNationality": "",
    "borderTransportMode": "1",
    "deliveryTermsCode": "FOB",
    "deliveryTermsPlace": "MIAMI",
    "borderOfficeCode": "HI01",
    "placeOfLoadingCode": "AWBAR",
    "deferredPaymentReference": "",
    "financialTransactionCode1": "1",
    "financialTransactionCode2": "1",
    "warehouseIdentification": "",
    "invoiceAmount": 0,
    "invoiceCurrencyCode": "USD",
    "externalFreightAmount": 0,
    "externalFreightCurrencyCode": "USD",
    "insuranceAmount": 0,
    "insuranceCurrencyCode": "USD",
    "otherCostAmount": 0,
    "otherCostCurrencyCode": "USD",
    "deductionAmount": 0,
    "deductionCurrencyCode": "USD",
    "grossWeight": 0,
    "calculationWorkingMode": 0,
    "splitsFlag": false
  }'::jsonb
),
(
  'FCL-SEA-MIAMI',
  'FCL Sea — Miami (Container)',
  true,
  '{
    "declarationId": "",
    "shipmentType": "FCL",
    "typeOfDeclaration": "IM",
    "generalProcedureCode": "4",
    "manifestReferenceNumber": "",
    "totalNumberOfPackages": 0,
    "customsClearanceOfficeCode": "HK02",
    "consigneeCode": "",
    "consigneeName": "",
    "declarantCode": "5036782",
    "declarantName": "COMPLETE LOGISTICS",
    "referenceYear": "",
    "referenceNumber": "",
    "countryFirstDestination": "US",
    "tradingCountry": "US",
    "exportCountryCode": "US",
    "destinationCountryCode": "AW",
    "containerFlag": true,
    "locationOfGoods": "HB-03",
    "locationOfGoodsAddress": "",
    "transportIdentity": "",
    "transportNationality": "",
    "borderTransportIdentity": "",
    "borderTransportNationality": "",
    "borderTransportMode": "1",
    "deliveryTermsCode": "FOB",
    "deliveryTermsPlace": "MIAMI",
    "borderOfficeCode": "HI01",
    "placeOfLoadingCode": "AWBAR",
    "deferredPaymentReference": "",
    "financialTransactionCode1": "1",
    "financialTransactionCode2": "1",
    "warehouseIdentification": "",
    "invoiceAmount": 0,
    "invoiceCurrencyCode": "USD",
    "externalFreightAmount": 0,
    "externalFreightCurrencyCode": "USD",
    "insuranceAmount": 0,
    "insuranceCurrencyCode": "USD",
    "otherCostAmount": 0,
    "otherCostCurrencyCode": "USD",
    "deductionAmount": 0,
    "deductionCurrencyCode": "USD",
    "grossWeight": 0,
    "calculationWorkingMode": 0,
    "splitsFlag": false
  }'::jsonb
),
(
  'AIR-AMERIJET',
  'Air — Amerijet (Airport)',
  true,
  '{
    "declarationId": "",
    "shipmentType": "Air",
    "typeOfDeclaration": "IM",
    "generalProcedureCode": "4",
    "manifestReferenceNumber": "",
    "totalNumberOfPackages": 0,
    "customsClearanceOfficeCode": "LV01",
    "consigneeCode": "",
    "consigneeName": "",
    "declarantCode": "5036782",
    "declarantName": "COMPLETE LOGISTICS",
    "referenceYear": "",
    "referenceNumber": "",
    "countryFirstDestination": "US",
    "tradingCountry": "US",
    "exportCountryCode": "US",
    "destinationCountryCode": "AW",
    "containerFlag": false,
    "locationOfGoods": "RT-01",
    "locationOfGoodsAddress": "",
    "transportIdentity": "AMERIJET",
    "transportNationality": "US",
    "borderTransportIdentity": "AMERIJET",
    "borderTransportNationality": "US",
    "borderTransportMode": "4",
    "deliveryTermsCode": "FOB",
    "deliveryTermsPlace": "MIAMI",
    "borderOfficeCode": "LV01",
    "placeOfLoadingCode": "AWAIR",
    "deferredPaymentReference": "",
    "financialTransactionCode1": "1",
    "financialTransactionCode2": "1",
    "warehouseIdentification": "",
    "invoiceAmount": 0,
    "invoiceCurrencyCode": "USD",
    "externalFreightAmount": 0,
    "externalFreightCurrencyCode": "USD",
    "insuranceAmount": 0,
    "insuranceCurrencyCode": "USD",
    "otherCostAmount": 0,
    "otherCostCurrencyCode": "USD",
    "deductionAmount": 0,
    "deductionCurrencyCode": "USD",
    "grossWeight": 0,
    "calculationWorkingMode": 0,
    "splitsFlag": false
  }'::jsonb
),
(
  'ALCOHOL-LCL',
  'Alcohol — LCL Sea',
  true,
  '{
    "declarationId": "",
    "shipmentType": "Alcohol",
    "typeOfDeclaration": "IM",
    "generalProcedureCode": "4",
    "manifestReferenceNumber": "",
    "totalNumberOfPackages": 0,
    "customsClearanceOfficeCode": "HK02",
    "consigneeCode": "",
    "consigneeName": "",
    "declarantCode": "5036782",
    "declarantName": "COMPLETE LOGISTICS",
    "referenceYear": "",
    "referenceNumber": "",
    "countryFirstDestination": "NL",
    "tradingCountry": "NL",
    "exportCountryCode": "NL",
    "destinationCountryCode": "AW",
    "containerFlag": false,
    "locationOfGoods": "GE-30",
    "locationOfGoodsAddress": "",
    "transportIdentity": "",
    "transportNationality": "",
    "borderTransportIdentity": "",
    "borderTransportNationality": "",
    "borderTransportMode": "1",
    "deliveryTermsCode": "FOB",
    "deliveryTermsPlace": "NEDERLAND",
    "borderOfficeCode": "HK02",
    "placeOfLoadingCode": "AWPDB",
    "deferredPaymentReference": "",
    "financialTransactionCode1": "1",
    "financialTransactionCode2": "1",
    "warehouseIdentification": "",
    "invoiceAmount": 0,
    "invoiceCurrencyCode": "USD",
    "externalFreightAmount": 0,
    "externalFreightCurrencyCode": "USD",
    "insuranceAmount": 0,
    "insuranceCurrencyCode": "USD",
    "otherCostAmount": 0,
    "otherCostCurrencyCode": "USD",
    "deductionAmount": 0,
    "deductionCurrencyCode": "USD",
    "grossWeight": 0,
    "calculationWorkingMode": 0,
    "splitsFlag": false
  }'::jsonb
)
on conflict (code) do nothing;
