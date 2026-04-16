import { supabase } from './supabase';
import type { Declaration, DeclarationHeader, DeclarationItem, DeclarationContainer, Template } from '../types';

// ─────────────────────────────────────────────────────────────
// Types for list view (lightweight, no full item data)
// ─────────────────────────────────────────────────────────────

export interface DeclarationSummary {
  id: string;
  status: string;
  shipmentType: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  registeredAt?: string;
  customsReferenceNumber?: string;
  // From header join
  declarationId?: string;
  consigneeName?: string;
  referenceNumber?: string;
  manifestReferenceNumber?: string;
  transportIdentity?: string;
  totalNumberOfPackages?: number;
  grossWeight?: number;
  invoiceAmount?: number;
  invoiceCurrencyCode?: string;
}

// ─────────────────────────────────────────────────────────────
// Declarations
// ─────────────────────────────────────────────────────────────

export async function listDeclarations(): Promise<DeclarationSummary[]> {
  const { data, error } = await supabase
    .from('declarations')
    .select(`
      id, status, shipment_type, created_at, updated_at,
      submitted_at, registered_at, customs_reference_number,
      declaration_headers (
        declaration_id_display, consignee_name, reference_number,
        manifest_reference_number, transport_identity,
        total_number_of_packages, gross_weight,
        invoice_amount, invoice_currency_code
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listDeclarations error:', error);
    return [];
  }

  return (data || []).map((d: any) => {
    const h = d.declaration_headers;
    return {
      id: d.id,
      status: d.status,
      shipmentType: d.shipment_type,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      submittedAt: d.submitted_at,
      registeredAt: d.registered_at,
      customsReferenceNumber: d.customs_reference_number,
      declarationId: h?.declaration_id_display,
      consigneeName: h?.consignee_name,
      referenceNumber: h?.reference_number,
      manifestReferenceNumber: h?.manifest_reference_number,
      transportIdentity: h?.transport_identity,
      totalNumberOfPackages: h?.total_number_of_packages,
      grossWeight: h?.gross_weight,
      invoiceAmount: h?.invoice_amount,
      invoiceCurrencyCode: h?.invoice_currency_code,
    };
  });
}

export async function loadDeclaration(id: string): Promise<Declaration | null> {
  const [declRes, headerRes, itemsRes, containersRes] = await Promise.all([
    supabase.from('declarations').select('*').eq('id', id).single(),
    supabase.from('declaration_headers').select('*').eq('declaration_id', id).single(),
    supabase.from('declaration_items').select(`
      *,
      declaration_supplementary_units (*),
      declaration_attached_docs (*),
      declaration_vehicles (*)
    `).eq('declaration_id', id).order('item_number'),
    supabase.from('declaration_containers').select('*').eq('declaration_id', id),
  ]);

  if (declRes.error || !declRes.data) {
    console.error('loadDeclaration error:', declRes.error);
    return null;
  }

  const d = declRes.data;
  const h = headerRes.data;

  const header: DeclarationHeader = h ? {
    declarationId: h.declaration_id_display || '',
    shipmentType: d.shipment_type,
    typeOfDeclaration: h.type_of_declaration || '',
    generalProcedureCode: h.general_procedure_code || '',
    manifestReferenceNumber: h.manifest_reference_number || '',
    totalNumberOfPackages: h.total_number_of_packages || 0,
    customsClearanceOfficeCode: h.customs_clearance_office_code || '',
    consigneeCode: h.consignee_code || '',
    consigneeName: h.consignee_name || '',
    declarantCode: h.declarant_code || '',
    declarantName: h.declarant_name || '',
    referenceYear: h.reference_year || '',
    referenceNumber: h.reference_number || '',
    countryFirstDestination: h.country_first_destination || '',
    tradingCountry: h.trading_country || '',
    exportCountryCode: h.export_country_code || '',
    destinationCountryCode: h.destination_country_code || '',
    containerFlag: h.container_flag || false,
    locationOfGoods: h.location_of_goods || '',
    locationOfGoodsAddress: h.location_of_goods_address || '',
    transportIdentity: h.transport_identity || '',
    transportNationality: h.transport_nationality || '',
    borderTransportIdentity: h.border_transport_identity || '',
    borderTransportNationality: h.border_transport_nationality || '',
    borderTransportMode: h.border_transport_mode || '',
    deliveryTermsCode: h.delivery_terms_code || '',
    deliveryTermsPlace: h.delivery_terms_place || '',
    borderOfficeCode: h.border_office_code || '',
    placeOfLoadingCode: h.place_of_loading_code || '',
    deferredPaymentReference: h.deferred_payment_reference || '',
    financialTransactionCode1: h.financial_transaction_code_1 || '',
    financialTransactionCode2: h.financial_transaction_code_2 || '',
    warehouseIdentification: h.warehouse_identification || '',
    invoiceAmount: h.invoice_amount || 0,
    invoiceCurrencyCode: h.invoice_currency_code || 'USD',
    externalFreightAmount: h.external_freight_amount || 0,
    externalFreightCurrencyCode: h.external_freight_currency_code || 'USD',
    insuranceAmount: h.insurance_amount || 0,
    insuranceCurrencyCode: h.insurance_currency_code || 'USD',
    otherCostAmount: h.other_cost_amount || 0,
    otherCostCurrencyCode: h.other_cost_currency_code || 'USD',
    deductionAmount: h.deduction_amount || 0,
    deductionCurrencyCode: h.deduction_currency_code || 'USD',
    grossWeight: h.gross_weight || 0,
    calculationWorkingMode: h.calculation_working_mode ?? 0,
    splitsFlag: h.splits_flag || false,
  } : {} as DeclarationHeader;

  const items: DeclarationItem[] = (itemsRes.data || []).map((item: any) => ({
    id: item.id,
    itemNumber: item.item_number,
    tradeNameSearch: item.trade_name_search || '',
    hsCode: item.hs_code || '',
    commercialDescription: item.commercial_description || '',
    descriptionOfGoods: item.description_of_goods || '',
    countryOfOriginCode: item.country_of_origin_code || '',
    numberOfPackages: item.number_of_packages || 0,
    kindOfPackagesCode: item.kind_of_packages_code || '',
    marks1: item.marks1 || '',
    marks2: item.marks2 || '',
    invoiceAmount: item.invoice_amount || 0,
    invoiceCurrencyCode: item.invoice_currency_code || 'USD',
    grossWeight: item.gross_weight || 0,
    netWeight: item.net_weight || 0,
    extendedCustomsProcedure: item.extended_customs_procedure || '',
    nationalCustomsProcedure: item.national_customs_procedure || '',
    preferenceCode: item.preference_code || '',
    valuationMethodCode: item.valuation_method_code || '1',
    quotaNumber: item.quota_number || '',
    previousDocumentSummaryDeclaration: item.previous_document_summary_declaration || '',
    previousDocumentSummaryDeclarationSubline: item.previous_document_summary_declaration_sl || '',
    supplementaryUnits: (item.declaration_supplementary_units || []).map((su: any) => ({
      id: su.id, rank: su.rank, code: su.code || '', quantity: su.quantity || 0,
    })),
    attachedDocuments: (item.declaration_attached_docs || []).map((doc: any) => ({
      id: doc.id,
      documentCode: doc.document_code || '',
      documentName: doc.document_name || '',
      referenceNumber: doc.reference_number || '',
      documentDate: doc.document_date,
    })),
  }));

  const vehicles = (itemsRes.data || [])
    .filter((item: any) => item.declaration_vehicles?.length > 0)
    .map((item: any) => ({
      ...item.declaration_vehicles[0],
      itemId: item.id,
    }));

  const containers = (containersRes.data || []).map((c: any) => ({
    id: c.id,
    itemNumber: c.item_number || 0,
    containerNumber: c.container_number || '',
    containerType: c.container_type || '',
    emptyFullIndicator: c.empty_full_indicator || 'F',
    goodsDescription: c.goods_description || '',
    packagesType: c.packages_type || '',
    packagesNumber: c.packages_number || 0,
    packagesWeight: c.packages_weight || 0,
  }));

  return {
    id: d.id,
    status: d.status,
    shipmentType: d.ship_type,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    submittedAt: d.submitted_at,
    registeredAt: d.registered_at,
    customsReferenceNumber: d.customs_reference_number,
    header,
    items,
    containers,
    vehicles,
  };
}

export async function saveDeclaration(declaration: Declaration): Promise<string | null> {
  const isNew = !declaration.id || declaration.id.startsWith('local-');

  // Upsert declaration root
  const declPayload = {
    ...(isNew ? {} : { id: declaration.id }),
    status: declaration.status || 'DRAFT',
    shipment_type: declaration.header.shipmentType,
    updated_at: new Date().toISOString(),
  };

  let declId = declaration.id;

  if (isNew) {
    const { data, error } = await supabase
      .from('declarations')
      .insert(declPayload)
      .select('id')
      .single();
    if (error) { console.error('insert declaration error:', error); return null; }
    declId = data.id;
  } else {
    const { error } = await supabase
      .from('declarations')
      .update(declPayload)
      .eq('id', declId);
    if (error) { console.error('update declaration error:', error); return null; }
  }

  // Upsert header
  const h = declaration.header;
  const headerPayload = {
    declaration_id: declId,
    declaration_id_display: h.declarationId,
    type_of_declaration: h.typeOfDeclaration,
    general_procedure_code: h.generalProcedureCode,
    manifest_reference_number: h.manifestReferenceNumber,
    total_number_of_packages: h.totalNumberOfPackages,
    customs_clearance_office_code: h.customsClearanceOfficeCode,
    consignee_code: h.consigneeCode,
    consignee_name: h.consigneeName,
    declarant_code: h.declarantCode,
    declarant_name: h.declarantName,
    reference_year: h.referenceYear,
    reference_number: h.referenceNumber,
    country_first_destination: h.countryFirstDestination,
    trading_country: h.tradingCountry,
    export_country_code: h.exportCountryCode,
    destination_country_code: h.destinationCountryCode,
    container_flag: h.containerFlag,
    location_of_goods: h.locationOfGoods,
    location_of_goods_address: h.locationOfGoodsAddress,
    transport_identity: h.transportIdentity,
    transport_nationality: h.transportNationality,
    border_transport_identity: h.borderTransportIdentity,
    border_transport_nationality: h.borderTransportNationality,
    border_transport_mode: h.borderTransportMode,
    delivery_terms_code: h.deliveryTermsCode,
    delivery_terms_place: h.deliveryTermsPlace,
    border_office_code: h.borderOfficeCode,
    place_of_loading_code: h.placeOfLoadingCode,
    deferred_payment_reference: h.deferredPaymentReference,
    financial_transaction_code_1: h.financialTransactionCode1,
    financial_transaction_code_2: h.financialTransactionCode2,
    warehouse_identification: h.warehouseIdentification,
    invoice_amount: h.invoiceAmount,
    invoice_currency_code: h.invoiceCurrencyCode,
    external_freight_amount: h.externalFreightAmount,
    external_freight_currency_code: h.externalFreightCurrencyCode,
    insurance_amount: h.insuranceAmount,
    insurance_currency_code: h.insuranceCurrencyCode,
    other_cost_amount: h.otherCostAmount,
    other_cost_currency_code: h.otherCostCurrencyCode,
    deduction_amount: h.deductionAmount,
    deduction_currency_code: h.deductionCurrencyCode,
    gross_weight: h.grossWeight,
    calculation_working_mode: h.calculationWorkingMode ?? 0,
    splits_flag: h.splitsFlag,
  };

  await supabase
    .from('declaration_headers')
    .upsert(headerPayload, { onConflict: 'declaration_id' });

  // Delete and reinsert items (simplest approach for now)
  if (!isNew) {
    // Get existing item IDs to delete their children first
    const { data: existingItems } = await supabase
      .from('declaration_items')
      .select('id')
      .eq('declaration_id', declId);

    if (existingItems && existingItems.length > 0) {
      const ids = existingItems.map((i: any) => i.id);
      await supabase.from('declaration_supplementary_units').delete().in('item_id', ids);
      await supabase.from('declaration_attached_docs').delete().in('item_id', ids);
      await supabase.from('declaration_vehicles').delete().in('item_id', ids);
      await supabase.from('declaration_items').delete().eq('declaration_id', declId);
    }
    await supabase.from('declaration_containers').delete().eq('declaration_id', declId);
  }

  // Insert items
  for (const item of declaration.items) {
    const { data: savedItem, error: itemError } = await supabase
      .from('declaration_items')
      .insert({
        declaration_id: declId,
        item_number: item.itemNumber,
        trade_name_search: item.tradeNameSearch,
        hs_code: item.hsCode,
        commercial_description: item.commercialDescription,
        description_of_goods: item.descriptionOfGoods,
        country_of_origin_code: item.countryOfOriginCode,
        number_of_packages: item.numberOfPackages,
        kind_of_packages_code: item.kindOfPackagesCode,
        marks1: item.marks1,
        marks2: item.marks2,
        invoice_amount: item.invoiceAmount,
        invoice_currency_code: item.invoiceCurrencyCode,
        gross_weight: item.grossWeight,
        net_weight: item.netWeight,
        extended_customs_procedure: item.extendedCustomsProcedure,
        national_customs_procedure: item.nationalCustomsProcedure,
        preference_code: item.preferenceCode,
        valuation_method_code: item.valuationMethodCode,
        quota_number: item.quotaNumber,
        previous_document_summary_declaration: item.previousDocumentSummaryDeclaration,
        previous_document_summary_declaration_sl: item.previousDocumentSummaryDeclarationSubline,
      })
      .select('id')
      .single();

    if (itemError || !savedItem) continue;
    const itemId = savedItem.id;

    // Supplementary units
    if (item.supplementaryUnits.length > 0) {
      await supabase.from('declaration_supplementary_units').insert(
        item.supplementaryUnits.map(su => ({
          item_id: itemId, rank: su.rank, code: su.code, quantity: su.quantity,
        }))
      );
    }

    // Attached documents
    if (item.attachedDocuments.length > 0) {
      await supabase.from('declaration_attached_docs').insert(
        item.attachedDocuments.map(doc => ({
          item_id: itemId,
          document_code: doc.documentCode,
          document_name: doc.documentName,
          reference_number: doc.referenceNumber,
          document_date: doc.documentDate || null,
        }))
      );
    }

    // Vehicle
    const vehicle = declaration.vehicles?.find(v => v.itemId === item.id);
    if (vehicle) {
      await supabase.from('declaration_vehicles').insert({
        item_id: itemId,
        vin_number: vehicle.vinNumber,
        stock_number: vehicle.stockNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        engine_type: vehicle.engineType,
        engine_number: vehicle.engineNumber,
        fuel_type: vehicle.fuelType,
        transmission: vehicle.transmission,
        invoice_value: vehicle.invoiceValue,
        invoice_currency: vehicle.invoiceCurrency,
        gross_weight: vehicle.grossWeight,
        net_weight: vehicle.netWeight,
      });
    }
  }

  // Insert containers
  if (declaration.containers.length > 0) {
    await supabase.from('declaration_containers').insert(
      declaration.containers.map(c => ({
        declaration_id: declId,
        item_number: c.itemNumber,
        container_number: c.containerNumber,
        container_type: c.containerType,
        empty_full_indicator: c.emptyFullIndicator,
        goods_description: c.goodsDescription,
        packages_type: c.packagesType,
        packages_number: c.packagesNumber,
        packages_weight: c.packagesWeight,
      }))
    );
  }

  return declId;
}

export async function updateDeclarationStatus(
  id: string,
  status: string,
  extra?: { customsReferenceNumber?: string }
): Promise<boolean> {
  const payload: any = { status, updated_at: new Date().toISOString() };
  if (status === 'SUBMITTED') payload.submitted_at = new Date().toISOString();
  if (status === 'REGISTERED') payload.registered_at = new Date().toISOString();
  if (extra?.customsReferenceNumber) payload.customs_reference_number = extra.customsReferenceNumber;

  const { error } = await supabase.from('declarations').update(payload).eq('id', id);
  if (error) { console.error('updateDeclarationStatus error:', error); return false; }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────

export async function listTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, code, description, is_shared, header_snapshot')
    .eq('is_shared', true)
    .order('description');

  if (error) { console.error('listTemplates error:', error); return []; }
  return (data || []).map((t: any) => ({
    id: t.id,
    code: t.code,
    description: t.description,
    isShared: t.is_shared,
    headerSnapshot: t.header_snapshot,
  }));
}

export async function saveTemplate(
  code: string,
  description: string,
  header: DeclarationHeader
): Promise<boolean> {
  const { error } = await supabase.from('templates').upsert({
    code,
    description,
    is_shared: true,
    header_snapshot: header,
  }, { onConflict: 'code' });

  if (error) { console.error('saveTemplate error:', error); return false; }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────

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
