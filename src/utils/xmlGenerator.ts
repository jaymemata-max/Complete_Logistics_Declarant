import { Declaration } from '../types';

/**
 * Generates ASYCUDA SAD XML matching the format accepted by Aruba Customs.
 * Validated against real VDAUA5 exports (confirmed submissions).
 *
 * Fixes vs previous version:
 * - <SAD id="60"> added — present in every real VD submission
 * - <Assessment_notice> now contains Registration_year + Assessment_year
 * - <Consignee_name> removed — VD only sends Consignee_code
 * - <Declarant_name> removed — VD only sends Declarant_code
 * - <Border_information> now only <Mode> — VD never sends Identity/Nationality there
 * - <Valuation_method_code> removed — VD does not emit this
 * - <Description_of_goods> removed — VD does not emit this
 * - <Previous_document> FCL uses <Previous_document_reference>,
 *   LCL/Air/Alcohol use <Summary_declaration> + <Summary_declaration_sl>
 */
export function generateAsycudaXml(declaration: Declaration): string {
  const { header, items, containers } = declaration;

  const s = (val: string | undefined | null): string =>
    (val || '').trim();

  const n = (val: number | undefined | null): string =>
    val !== undefined && val !== null ? val.toFixed(2) : '0.00';

  const t = (indent: number, tag: string, content: string): string =>
    `${' '.repeat(indent)}<${tag}>${content}</${tag}>\n`;

  const year = String(new Date().getFullYear());
  const isFCL = header.shipmentType === 'FCL';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<ASYCUDA>\n`;
  xml += `  <SAD id="60">\n`;

  // Assessment_notice — always populated with current year
  xml += `    <Assessment_notice>\n`;
  xml += t(6, 'Registration_year', year);
  xml += t(6, 'Assessment_year', year);
  xml += `    </Assessment_notice>\n`;

  // Identification
  xml += `    <Identification>\n`;
  xml += t(6, 'Manifest_reference_number', s(header.manifestReferenceNumber));
  xml += t(6, 'Total_number_of_packages', String(header.totalNumberOfPackages || 0));
  xml += `      <Office_segment>\n`;
  xml += t(8, 'Customs_clearance_office_code', s(header.customsClearanceOfficeCode));
  xml += `      </Office_segment>\n`;
  xml += `      <Type>\n`;
  xml += t(8, 'Type_of_declaration', s(header.typeOfDeclaration));
  xml += t(8, 'General_procedure_code', s(header.generalProcedureCode));
  xml += `      </Type>\n`;
  xml += `    </Identification>\n`;

  // Traders — VD only sends Consignee_code, no Consignee_name
  xml += `    <Traders>\n`;
  xml += `      <Consignee>\n`;
  xml += t(8, 'Consignee_code', s(header.consigneeCode));
  xml += `      </Consignee>\n`;
  xml += `    </Traders>\n`;

  // Declarant — VD only sends Declarant_code, no Declarant_name
  xml += `    <Declarant>\n`;
  xml += t(6, 'Declarant_code', s(header.declarantCode));
  xml += `      <Reference>\n`;
  xml += t(8, 'Year', s(header.referenceYear));
  xml += t(8, 'Number', s(header.referenceNumber));
  xml += `      </Reference>\n`;
  xml += `    </Declarant>\n`;

  // General_information
  xml += `    <General_information>\n`;
  xml += `      <Country>\n`;
  xml += t(8, 'Country_first_destination', s(header.countryFirstDestination));
  xml += t(8, 'Trading_country', s(header.tradingCountry));
  xml += `        <Export>\n`;
  xml += t(10, 'Export_country_code', s(header.exportCountryCode));
  xml += `        </Export>\n`;
  xml += `        <Destination>\n`;
  xml += t(10, 'Destination_country_code', s(header.destinationCountryCode));
  xml += `        </Destination>\n`;
  xml += `      </Country>\n`;
  xml += `    </General_information>\n`;

  // Transport
  xml += `    <Transport>\n`;
  xml += t(6, 'Container_flag', header.containerFlag ? 'true' : 'false');
  xml += t(6, 'Location_of_goods', s(header.locationOfGoods));
  if (header.locationOfGoodsAddress?.trim()) {
    xml += t(6, 'Location_of_goods_address', s(header.locationOfGoodsAddress));
  }
  xml += `      <Means_of_transport>\n`;
  xml += `        <Departure_arrival_information>\n`;
  xml += t(10, 'Identity', s(header.transportIdentity));
  xml += t(10, 'Nationality', s(header.transportNationality));
  xml += `        </Departure_arrival_information>\n`;
  // VD only emits <Mode> in Border_information — no Identity/Nationality
  xml += `        <Border_information>\n`;
  xml += t(10, 'Mode', s(header.borderTransportMode));
  xml += `        </Border_information>\n`;
  xml += `      </Means_of_transport>\n`;
  xml += `      <Delivery_terms>\n`;
  xml += t(8, 'Code', s(header.deliveryTermsCode));
  xml += t(8, 'Place', s(header.deliveryTermsPlace));
  xml += `      </Delivery_terms>\n`;
  xml += `      <Border_office>\n`;
  xml += t(8, 'Code', s(header.borderOfficeCode));
  xml += `      </Border_office>\n`;
  xml += `      <Place_of_loading>\n`;
  xml += t(8, 'Code', s(header.placeOfLoadingCode));
  xml += `      </Place_of_loading>\n`;
  xml += `    </Transport>\n`;

  // Financial — ASYCUDA spells "Deffered" with double 'f', intentional
  xml += `    <Financial>\n`;
  xml += t(6, 'Deffered_payment_reference', s(header.deferredPaymentReference));
  xml += `      <Financial_transaction>\n`;
  xml += t(8, 'Code_1', s(header.financialTransactionCode1));
  xml += t(8, 'Code_2', s(header.financialTransactionCode2));
  xml += `      </Financial_transaction>\n`;
  xml += `    </Financial>\n`;

  // Warehouse
  xml += `    <Warehouse>\n`;
  xml += t(6, 'Identification', s(header.warehouseIdentification));
  xml += `    </Warehouse>\n`;

  // Valuation
  xml += `    <Valuation>\n`;
  xml += `      <Invoice>\n`;
  xml += t(8, 'Amount_foreign_currency', n(header.invoiceAmount));
  xml += t(8, 'Currency_code', s(header.invoiceCurrencyCode) || 'USD');
  xml += `      </Invoice>\n`;
  xml += `      <External_freight>\n`;
  xml += t(8, 'Amount_foreign_currency', n(header.externalFreightAmount));
  xml += t(8, 'Currency_code', s(header.externalFreightCurrencyCode) || 'USD');
  xml += `      </External_freight>\n`;
  xml += `      <Insurance>\n`;
  xml += t(8, 'Amount_foreign_currency', n(header.insuranceAmount));
  xml += t(8, 'Currency_code', s(header.insuranceCurrencyCode) || 'USD');
  xml += `      </Insurance>\n`;
  xml += `      <Other_cost>\n`;
  xml += t(8, 'Amount_foreign_currency', n(header.otherCostAmount));
  xml += t(8, 'Currency_code', s(header.otherCostCurrencyCode) || 'USD');
  xml += `      </Other_cost>\n`;
  xml += `      <Deduction>\n`;
  xml += t(8, 'Amount_foreign_currency', n(header.deductionAmount));
  xml += t(8, 'Currency_code', s(header.deductionCurrencyCode) || 'USD');
  xml += `      </Deduction>\n`;
  xml += `    </Valuation>\n`;

  // Containers — always emitted
  xml += `    <Containers>\n`;
  if (header.containerFlag && containers.length > 0) {
    containers.forEach(c => {
      xml += `      <Container>\n`;
      xml += t(8, 'Item_number', String(c.itemNumber || ''));
      xml += t(8, 'Container_identity', s(c.containerNumber));
      xml += t(8, 'Container_type', s(c.containerType));
      xml += t(8, 'Empty_full_indicator', s(c.emptyFullIndicator));
      xml += t(8, 'Goods_description', s(c.goodsDescription));
      xml += t(8, 'Packages_type', s(c.packagesType));
      xml += t(8, 'Packages_number', n(c.packagesNumber));
      xml += t(8, 'Packages_weight', n(c.packagesWeight));
      xml += `      </Container>\n`;
    });
  }
  xml += `    </Containers>\n`;

  xml += `  </SAD>\n`;

  // Items
  xml += `  <Items>\n`;

  items.forEach(item => {
    xml += `    <Item>\n`;

    xml += `      <Packages>\n`;
    xml += t(8, 'Number_of_packages', String(item.numberOfPackages || 0));
    xml += t(8, 'Marks1_of_packages', s(item.marks1));
    xml += t(8, 'Marks2_of_packages', s(item.marks2));
    xml += t(8, 'Kind_of_packages_code', s(item.kindOfPackagesCode));
    xml += `      </Packages>\n`;

    // Incoterms — item-level mirrors header delivery terms per VD format
    xml += `      <Incoterms>\n`;
    xml += t(8, 'Code', s(header.deliveryTermsCode));
    xml += t(8, 'Place', s(header.deliveryTermsPlace));
    xml += `      </Incoterms>\n`;

    // Tariff — VD does not emit Valuation_method_code
    xml += `      <Tariff>\n`;
    xml += t(8, 'Extended_customs_procedure', s(item.extendedCustomsProcedure));
    xml += t(8, 'National_customs_procedure', s(item.nationalCustomsProcedure));
    if (item.preferenceCode?.trim()) {
      xml += t(8, 'Preference_code', s(item.preferenceCode));
    }
    xml += `        <Harmonized_system>\n`;
    xml += t(10, 'Commodity_code', s(item.hsCode));
    xml += `        </Harmonized_system>\n`;
    if (item.supplementaryUnits && item.supplementaryUnits.length > 0) {
      item.supplementaryUnits.forEach(su => {
        xml += `        <Supplementary_unit>\n`;
        xml += t(10, 'Supplementary_unit_code', s(su.code));
        xml += t(10, 'Supplementary_unit_quantity', n(su.quantity));
        xml += `        </Supplementary_unit>\n`;
      });
    }
    if (item.quotaNumber?.trim()) {
      xml += `        <Quota>\n`;
      xml += t(10, 'Quota_code', s(item.quotaNumber));
      xml += `        </Quota>\n`;
    }
    xml += `      </Tariff>\n`;

    // Goods description — VD does not emit Description_of_goods
    xml += `      <Goods_description>\n`;
    xml += t(8, 'Country_of_origin_code', s(item.countryOfOriginCode));
    xml += t(8, 'Commercial_description', s(item.commercialDescription));
    xml += `      </Goods_description>\n`;

    xml += `      <Valuation_item>\n`;
    xml += `        <Weight>\n`;
    xml += t(10, 'Gross_weight_itm', n(item.grossWeight));
    xml += t(10, 'Net_weight_itm', n(item.netWeight));
    xml += `        </Weight>\n`;
    xml += `        <Invoice>\n`;
    xml += t(10, 'Amount_foreign_currency', n(item.invoiceAmount));
    xml += t(10, 'Currency_code', s(item.invoiceCurrencyCode) || 'USD');
    xml += `        </Invoice>\n`;
    xml += `      </Valuation_item>\n`;

    // Field 44 — Attached documents
    if (item.attachedDocuments && item.attachedDocuments.length > 0) {
      xml += `      <Attached_documents>\n`;
      item.attachedDocuments.forEach(doc => {
        xml += `        <Attached_document>\n`;
        xml += t(10, 'Attached_document_code', s(doc.documentCode));
        xml += t(10, 'Attached_document_name', s(doc.documentName));
        xml += t(10, 'Attached_document_reference', s(doc.referenceNumber));
        if (doc.documentDate) {
          xml += t(10, 'Attached_document_date', s(doc.documentDate));
        }
        xml += `        </Attached_document>\n`;
      });
      xml += `      </Attached_documents>\n`;
    }

    // Previous document (Field 40)
    // FCL/direct → <Previous_document_reference>
    // LCL/Air/Alcohol → <Summary_declaration> + <Summary_declaration_sl>
    xml += `      <Previous_document>\n`;
    if (isFCL) {
      xml += t(8, 'Previous_document_reference', s(item.previousDocumentSummaryDeclaration));
    } else {
      xml += t(8, 'Summary_declaration', s(item.previousDocumentSummaryDeclaration));
      xml += t(8, 'Summary_declaration_sl', s(item.previousDocumentSummaryDeclarationSubline));
    }
    xml += `      </Previous_document>\n`;

    xml += `    </Item>\n`;
  });

  xml += `  </Items>\n`;
  xml += `</ASYCUDA>\n`;

  return xml;
}
