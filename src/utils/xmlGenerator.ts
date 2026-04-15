import { Declaration } from '../types';

export function generateAsycudaXml(declaration: Declaration): string {
  const { header, items, containers } = declaration;

  // Helper to safely format numbers and strings
  const formatNum = (num: number | undefined) => num !== undefined ? num.toString() : '';
  const formatStr = (str: string | undefined) => str || '';

  // TODO: The exact XML shape is inferred from the prompt.
  // Real implementation would need to match the specific ASYCUDA schema exactly.
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<ASYCUDA>\n`;
  xml += `  <SAD>\n`;
  
  // Assessment_notice (Mocked empty or minimal as per typical submission)
  xml += `    <Assessment_notice>\n`;
  xml += `    </Assessment_notice>\n`;

  // Identification
  xml += `    <Identification>\n`;
  xml += `      <Office_segment>\n`;
  xml += `        <Customs_clearance_office_code>${formatStr(header.customsClearanceOfficeCode)}</Customs_clearance_office_code>\n`;
  xml += `      </Office_segment>\n`;
  xml += `      <Type_of_declaration>${formatStr(header.typeOfDeclaration)}</Type_of_declaration>\n`;
  xml += `      <Declaration_sgl_segment>\n`;
  xml += `        <General_procedure_code>${formatStr(header.generalProcedureCode)}</General_procedure_code>\n`;
  xml += `      </Declaration_sgl_segment>\n`;
  xml += `      <Manifest_reference_number>${formatStr(header.manifestReferenceNumber)}</Manifest_reference_number>\n`;
  xml += `    </Identification>\n`;

  // Traders
  xml += `    <Traders>\n`;
  xml += `      <Consignee>\n`;
  xml += `        <Consignee_code>${formatStr(header.consigneeCode)}</Consignee_code>\n`;
  xml += `        <Consignee_name>${formatStr(header.consigneeName)}</Consignee_name>\n`;
  xml += `      </Consignee>\n`;
  xml += `    </Traders>\n`;

  // Declarant
  xml += `    <Declarant>\n`;
  xml += `      <Declarant_code>${formatStr(header.declarantCode)}</Declarant_code>\n`;
  xml += `      <Declarant_name>${formatStr(header.declarantName)}</Declarant_name>\n`;
  xml += `      <Reference>\n`;
  xml += `        <Reference_year>${formatStr(header.referenceYear)}</Reference_year>\n`;
  xml += `        <Reference_number>${formatStr(header.referenceNumber)}</Reference_number>\n`;
  xml += `      </Reference>\n`;
  xml += `    </Declarant>\n`;

  // General_information
  xml += `    <General_information>\n`;
  xml += `      <Country>\n`;
  xml += `        <Country_first_destination>${formatStr(header.countryFirstDestination)}</Country_first_destination>\n`;
  xml += `        <Trading_country>${formatStr(header.tradingCountry)}</Trading_country>\n`;
  xml += `        <Export>\n`;
  xml += `          <Export_country_code>${formatStr(header.exportCountryCode)}</Export_country_code>\n`;
  xml += `        </Export>\n`;
  xml += `        <Destination>\n`;
  xml += `          <Destination_country_code>${formatStr(header.destinationCountryCode)}</Destination_country_code>\n`;
  xml += `        </Destination>\n`;
  xml += `      </Country>\n`;
  xml += `      <Value_details>\n`;
  xml += `      </Value_details>\n`;
  xml += `    </General_information>\n`;

  // Transport
  xml += `    <Transport>\n`;
  xml += `      <Means_of_transport>\n`;
  xml += `        <Departure_arrival_information>\n`;
  xml += `          <Identity>${formatStr(header.transportIdentity)}</Identity>\n`;
  xml += `          <Nationality>${formatStr(header.transportNationality)}</Nationality>\n`;
  xml += `        </Departure_arrival_information>\n`;
  xml += `        <Border_information>\n`;
  xml += `          <Identity>${formatStr(header.borderTransportIdentity)}</Identity>\n`;
  xml += `          <Nationality>${formatStr(header.borderTransportNationality)}</Nationality>\n`;
  xml += `          <Mode>${formatStr(header.borderTransportMode)}</Mode>\n`;
  xml += `        </Border_information>\n`;
  xml += `      </Means_of_transport>\n`;
  xml += `      <Delivery_terms>\n`;
  xml += `        <Code>${formatStr(header.deliveryTermsCode)}</Code>\n`;
  xml += `        <Place>${formatStr(header.deliveryTermsPlace)}</Place>\n`;
  xml += `      </Delivery_terms>\n`;
  xml += `      <Border_office>\n`;
  xml += `        <Code>${formatStr(header.borderOfficeCode)}</Code>\n`;
  xml += `      </Border_office>\n`;
  xml += `      <Place_of_loading>\n`;
  xml += `        <Code>${formatStr(header.placeOfLoadingCode)}</Code>\n`;
  xml += `      </Place_of_loading>\n`;
  xml += `      <Location_of_goods>${formatStr(header.locationOfGoods)}</Location_of_goods>\n`;
  xml += `    </Transport>\n`;

  // Financial
  xml += `    <Financial>\n`;
  xml += `      <Financial_transaction>\n`;
  xml += `        <Code1>${formatStr(header.financialTransactionCode1)}</Code1>\n`;
  xml += `        <Code2>${formatStr(header.financialTransactionCode2)}</Code2>\n`;
  xml += `      </Financial_transaction>\n`;
  xml += `      <Deferred_payment>\n`;
  xml += `        <Deferred_payment_reference>${formatStr(header.deferredPaymentReference)}</Deferred_payment_reference>\n`;
  xml += `      </Deferred_payment>\n`;
  xml += `    </Financial>\n`;

  // Warehouse
  if (header.warehouseIdentification) {
    xml += `    <Warehouse>\n`;
    xml += `      <Identification>${formatStr(header.warehouseIdentification)}</Identification>\n`;
    xml += `    </Warehouse>\n`;
  } else {
    xml += `    <Warehouse/>\n`;
  }

  // Valuation
  xml += `    <Valuation>\n`;
  xml += `      <Calculation_working_mode>1</Calculation_working_mode>\n`;
  xml += `      <Total>\n`;
  xml += `        <Total_invoice>${formatNum(header.invoiceAmount)}</Total_invoice>\n`;
  xml += `        <Total_weight>${formatNum(header.grossWeight)}</Total_weight>\n`;
  xml += `      </Total>\n`;
  xml += `    </Valuation>\n`;

  // Containers
  if (header.containerFlag && containers.length > 0) {
    xml += `    <Containers>\n`;
    containers.forEach(c => {
      xml += `      <Container>\n`;
      xml += `        <Container_identity>${formatStr(c.containerNumber)}</Container_identity>\n`;
      xml += `        <Container_type>${formatStr(c.containerType)}</Container_type>\n`;
      xml += `        <Empty_full_indicator>${formatStr(c.emptyFullIndicator)}</Empty_full_indicator>\n`;
      xml += `        <Goods_description>${formatStr(c.goodsDescription)}</Goods_description>\n`;
      xml += `        <Packages_type>${formatStr(c.packagesType)}</Packages_type>\n`;
      xml += `        <Packages_number>${formatNum(c.packagesNumber)}</Packages_number>\n`;
      xml += `        <Packages_weight>${formatNum(c.packagesWeight)}</Packages_weight>\n`;
      xml += `      </Container>\n`;
    });
    xml += `    </Containers>\n`;
  }

  xml += `  </SAD>\n`;

  // Items
  xml += `  <Items>\n`;
  items.forEach(item => {
    xml += `    <Item>\n`;
    xml += `      <Packages>\n`;
    xml += `        <Number_of_packages>${formatNum(item.numberOfPackages)}</Number_of_packages>\n`;
    xml += `        <Kind_of_packages_code>${formatStr(item.kindOfPackagesCode)}</Kind_of_packages_code>\n`;
    xml += `        <Marks1_of_packages>${formatStr(item.marks1)}</Marks1_of_packages>\n`;
    xml += `        <Marks2_of_packages>${formatStr(item.marks2)}</Marks2_of_packages>\n`;
    xml += `      </Packages>\n`;
    
    xml += `      <Tariff>\n`;
    xml += `        <Hs_code>\n`;
    xml += `          <Commodity_code>${formatStr(item.hsCode)}</Commodity_code>\n`;
    xml += `        </Hs_code>\n`;
    xml += `        <Extended_customs_procedure>${formatStr(item.extendedCustomsProcedure)}</Extended_customs_procedure>\n`;
    xml += `        <National_customs_procedure>${formatStr(item.nationalCustomsProcedure)}</National_customs_procedure>\n`;
    if (item.supplementaryUnits && item.supplementaryUnits.length > 0) {
      item.supplementaryUnits.forEach(su => {
        xml += `        <Supplementary_unit>\n`;
        xml += `          <Supplementary_unit_code>${formatStr(su.code)}</Supplementary_unit_code>\n`;
        xml += `          <Supplementary_unit_quantity>${formatNum(su.quantity)}</Supplementary_unit_quantity>\n`;
        xml += `        </Supplementary_unit>\n`;
      });
    }
    xml += `      </Tariff>\n`;

    xml += `      <Goods_description>\n`;
    xml += `        <Country_of_origin_code>${formatStr(item.countryOfOriginCode)}</Country_of_origin_code>\n`;
    xml += `        <Description_of_goods>${formatStr(item.descriptionOfGoods)}</Description_of_goods>\n`;
    xml += `        <Commercial_Description>${formatStr(item.commercialDescription)}</Commercial_Description>\n`;
    xml += `      </Goods_description>\n`;

    xml += `      <Previous_document>\n`;
    xml += `        <Summary_declaration>${formatStr(item.previousDocumentSummaryDeclaration)}</Summary_declaration>\n`;
    xml += `        <Summary_declaration_sl>${formatStr(item.previousDocumentSummaryDeclarationSubline)}</Summary_declaration_sl>\n`;
    xml += `      </Previous_document>\n`;

    xml += `      <Valuation_item>\n`;
    xml += `        <Weight_itm>\n`;
    xml += `          <Gross_weight_itm>${formatNum(item.grossWeight)}</Gross_weight_itm>\n`;
    xml += `          <Net_weight_itm>${formatNum(item.netWeight)}</Net_weight_itm>\n`;
    xml += `        </Weight_itm>\n`;
    xml += `        <Item_Invoice>\n`;
    xml += `          <Amount_foreign>${formatNum(item.invoiceAmount)}</Amount_foreign>\n`;
    xml += `          <Currency_code>${formatStr(item.invoiceCurrencyCode)}</Currency_code>\n`;
    xml += `        </Item_Invoice>\n`;
    xml += `      </Valuation_item>\n`;

    xml += `    </Item>\n`;
  });
  xml += `  </Items>\n`;
  xml += `</ASYCUDA>\n`;

  return xml;
}
