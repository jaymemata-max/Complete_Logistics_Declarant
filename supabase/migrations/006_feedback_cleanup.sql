-- ============================================================
-- CL Customs — Real Data Test Feedback Cleanup
-- Run AFTER 005_declaration_types.sql
-- ============================================================

-- HS / commodity codes must be stored as digits only.
update declaration_items
set hs_code = regexp_replace(coalesce(hs_code, ''), '\D', '', 'g')
where hs_code is not null
  and hs_code <> regexp_replace(hs_code, '\D', '', 'g');

do $$ begin
  alter table declaration_items
    add constraint declaration_items_hs_code_digits_only
    check (hs_code is null or hs_code = '' or hs_code ~ '^[0-9]+$');
exception when duplicate_object then null;
end; $$;

-- Field 40 subline is optional; store blank UI values as NULL.
update declaration_items
set previous_document_summary_declaration_sl = null
where previous_document_summary_declaration_sl = '';
