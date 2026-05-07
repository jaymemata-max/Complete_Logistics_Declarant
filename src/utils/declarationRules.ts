import type { Declaration, DeclarationContainer, DeclarationVehicle } from '../types';

export const LEGACY_PAYMENT_CODES = new Set(['CONTANT', 'KREDIET', 'NVT']);

export function normalizeDeferredPaymentReference(value: string | undefined | null): string {
  const normalized = (value || '').trim();
  if (!normalized || normalized === '__CASH__') return '';
  return LEGACY_PAYMENT_CODES.has(normalized.toUpperCase()) ? '' : normalized;
}

export function isLegacyPaymentReference(value: string | undefined | null): boolean {
  const normalized = (value || '').trim().toUpperCase();
  return LEGACY_PAYMENT_CODES.has(normalized);
}

export function sanitizeDeclarationForSave(declaration: Declaration): Declaration {
  return {
    ...declaration,
    header: {
      ...declaration.header,
      deferredPaymentReference: normalizeDeferredPaymentReference(declaration.header.deferredPaymentReference),
    },
  };
}

export function requiresVehicleInfo(hsCode: string): boolean {
  const hs = hsCode.replace(/\D/g, '');
  return hs.startsWith('8426')
    || hs.startsWith('8427')
    || hs.startsWith('8429')
    || hs.startsWith('8430')
    || hs.startsWith('8432')
    || hs.startsWith('86')
    || /^870[1-6]/.test(hs)
    || hs.startsWith('8709')
    || hs.startsWith('8710')
    || hs.startsWith('8711')
    || hs.startsWith('8713')
    || /^890[1-8]/.test(hs);
}

function hasText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

function nearlyEqual(left: number, right: number, tolerance = 0.1): boolean {
  return Math.abs(left - right) <= tolerance;
}

export function validateContainerDetails(declaration: Declaration): string[] {
  const warnings: string[] = [];

  if (!declaration.header.containerFlag) return warnings;
  if (declaration.containers.length === 0) {
    warnings.push('Container flag is true but no containers added');
    return warnings;
  }

  declaration.containers.forEach((container: DeclarationContainer, index) => {
    const label = `Container ${index + 1}`;
    if (!hasText(container.containerNumber)) warnings.push(`${label}: Missing Container Number`);
    if (!hasText(container.containerType)) warnings.push(`${label}: Missing Container Type`);
    if (!hasText(container.emptyFullIndicator)) warnings.push(`${label}: Missing Empty/Full Indicator`);
    if (!container.itemNumber || container.itemNumber <= 0) warnings.push(`${label}: Missing linked Item Number`);
    if (!hasText(container.goodsDescription)) warnings.push(`${label}: Missing Goods Description`);
    if (!hasText(container.packagesType)) warnings.push(`${label}: Missing Packages Type`);
    if (!container.packagesNumber || container.packagesNumber <= 0) warnings.push(`${label}: Packages Number must be greater than 0`);
    if (!container.packagesWeight || container.packagesWeight <= 0) warnings.push(`${label}: Packages Weight must be greater than 0`);
  });

  return warnings;
}

export function validateVehicleDetails(vehicle: DeclarationVehicle, itemNumber: number): string[] {
  const warnings: string[] = [];
  const label = `Item ${itemNumber}: Vehicle`;

  if (!hasText(vehicle.vinNumber)) warnings.push(`${label} missing VIN number`);
  if (!hasText(vehicle.make)) warnings.push(`${label} missing make`);
  if (!hasText(vehicle.model)) warnings.push(`${label} missing model`);
  if (!hasText(vehicle.year)) warnings.push(`${label} missing year`);
  if (!hasText(vehicle.engineType)) warnings.push(`${label} missing engine type`);
  if (!hasText(vehicle.engineNumber)) warnings.push(`${label} missing engine number`);
  if (!hasText(vehicle.fuelType)) warnings.push(`${label} missing fuel type`);
  if (!hasText(vehicle.transmission)) warnings.push(`${label} missing transmission`);
  if (!vehicle.invoiceValue || vehicle.invoiceValue <= 0) warnings.push(`${label} invoice value must be greater than 0`);
  if (!vehicle.grossWeight || vehicle.grossWeight <= 0) warnings.push(`${label} gross weight must be greater than 0`);
  if (!vehicle.netWeight || vehicle.netWeight <= 0) warnings.push(`${label} net weight must be greater than 0`);

  return warnings;
}

export function validateDeclarationForSubmit(declaration: Declaration): string[] {
  const errors: string[] = [];
  const { header, items, vehicles } = declaration;

  if (!hasText(header.typeOfDeclaration)) errors.push('Header: Missing Type of Declaration');
  if (!hasText(header.generalProcedureCode)) errors.push('Header: Missing General Procedure Code');
  if (!hasText(header.customsClearanceOfficeCode)) errors.push('Header: Missing Customs Clearance Office Code');
  if (!hasText(header.manifestReferenceNumber)) errors.push('Header: Missing Manifest Reference Number');
  if (!hasText(header.consigneeCode) && !hasText(header.consigneeName)) errors.push('Header: Missing Consignee');
  if (!hasText(header.declarantCode) && !hasText(header.declarantName)) errors.push('Header: Missing Declarant');
  if (!hasText(header.exportCountryCode)) errors.push('Header: Missing Export Country Code');
  if (!hasText(header.destinationCountryCode)) errors.push('Header: Missing Destination Country Code');
  if (!hasText(header.tradingCountry)) errors.push('Header: Missing Trading Country');
  if (!hasText(header.transportIdentity)) errors.push('Header: Missing Transport Identity');
  if (!hasText(header.transportNationality)) errors.push('Header: Missing Transport Nationality');
  if (!hasText(header.borderTransportMode)) errors.push('Header: Missing Border Transport Mode');
  if (!hasText(header.deliveryTermsCode)) errors.push('Header: Missing Delivery Terms Code');
  if (!hasText(header.deliveryTermsPlace)) errors.push('Header: Missing Delivery Terms Place');
  if (!hasText(header.locationOfGoods)) errors.push('Header: Missing Location of Goods');
  if (!header.totalNumberOfPackages || header.totalNumberOfPackages <= 0) errors.push('Header: Total Number of Packages must be greater than 0');
  if (!header.grossWeight || header.grossWeight <= 0) errors.push('Header: Total Gross Weight must be greater than 0');
  if (!header.invoiceAmount || header.invoiceAmount <= 0) errors.push('Header: Total Invoice Amount must be greater than 0');

  if (isLegacyPaymentReference(header.deferredPaymentReference)) {
    errors.push('Header: Field 48 cannot be CONTANT, KREDIET, or NVT. Leave it empty for cash or select a real credit account.');
  }

  if (items.length === 0) errors.push('Declaration has no items');

  let totalItemPackages = 0;
  let totalItemGrossWeight = 0;
  let totalItemInvoiceAmount = 0;

  items.forEach(item => {
    const normalizedHsCode = item.hsCode.replace(/\D/g, '');
    if (!normalizedHsCode) errors.push(`Item ${item.itemNumber}: Missing HS Code`);
    if (!hasText(item.previousDocumentSummaryDeclaration)) errors.push(`Item ${item.itemNumber}: Missing Field 40 Previous Document`);
    if (header.splitsFlag && !hasText(item.previousDocumentSummaryDeclarationSubline)) errors.push(`Item ${item.itemNumber}: Missing Field 40 S/L for split shipment`);
    if (!hasText(item.commercialDescription)) errors.push(`Item ${item.itemNumber}: Missing Commercial Description`);
    if (!hasText(item.descriptionOfGoods)) errors.push(`Item ${item.itemNumber}: Missing Description of Goods`);
    if (!hasText(item.countryOfOriginCode)) errors.push(`Item ${item.itemNumber}: Missing Country of Origin Code`);
    if (!item.numberOfPackages || item.numberOfPackages <= 0) errors.push(`Item ${item.itemNumber}: Number of Packages must be greater than 0`);
    if (!hasText(item.kindOfPackagesCode)) errors.push(`Item ${item.itemNumber}: Missing Package Type`);
    if (!item.grossWeight || item.grossWeight <= 0) errors.push(`Item ${item.itemNumber}: Gross Weight must be greater than 0`);
    if (!item.netWeight || item.netWeight <= 0) errors.push(`Item ${item.itemNumber}: Net Weight must be greater than 0`);
    if (item.netWeight && item.grossWeight && item.netWeight > item.grossWeight) errors.push(`Item ${item.itemNumber}: Net Weight cannot be greater than Gross Weight`);
    if (!item.invoiceAmount || item.invoiceAmount <= 0) errors.push(`Item ${item.itemNumber}: Invoice Amount must be greater than 0`);
    if (!hasText(item.extendedCustomsProcedure)) errors.push(`Item ${item.itemNumber}: Missing Extended Customs Procedure`);
    if (!hasText(item.nationalCustomsProcedure)) errors.push(`Item ${item.itemNumber}: Missing National Customs Procedure`);

    if (requiresVehicleInfo(item.hsCode)) {
      const vehicle = vehicles.find(v => v.itemId === item.id);
      const hasSupplementaryUnitQuantity = item.supplementaryUnits?.some(su => su.quantity > 0);
      if (!vehicle) {
        errors.push(`Item ${item.itemNumber}: Vehicle information required for this HS code`);
      } else {
        errors.push(...validateVehicleDetails(vehicle, item.itemNumber));
      }
      if (!hasSupplementaryUnitQuantity) errors.push(`Item ${item.itemNumber}: Field 41 supplementary unit quantity required for vehicle goods`);
    }

    totalItemPackages += item.numberOfPackages || 0;
    totalItemGrossWeight += item.grossWeight || 0;
    totalItemInvoiceAmount += item.invoiceAmount || 0;
  });

  errors.push(...validateContainerDetails(declaration));

  if (header.totalNumberOfPackages && totalItemPackages !== header.totalNumberOfPackages) {
    errors.push(`Mismatch: Header Total Packages (${header.totalNumberOfPackages}) does not match sum of Item Packages (${totalItemPackages})`);
  }
  if (header.grossWeight && !nearlyEqual(totalItemGrossWeight, header.grossWeight)) {
    errors.push(`Mismatch: Header Gross Weight (${header.grossWeight}) does not match sum of Item Gross Weights (${totalItemGrossWeight.toFixed(2)})`);
  }
  if (header.invoiceAmount && !nearlyEqual(totalItemInvoiceAmount, header.invoiceAmount)) {
    errors.push(`Mismatch: Header Invoice Amount (${header.invoiceAmount}) does not match sum of Item Invoice Amounts (${totalItemInvoiceAmount.toFixed(2)})`);
  }
  return errors;
}
