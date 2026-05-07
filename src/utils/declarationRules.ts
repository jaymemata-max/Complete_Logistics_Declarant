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
  const warnings: string[] = [];

  if (isLegacyPaymentReference(declaration.header.deferredPaymentReference)) {
    warnings.push('Header: Field 48 cannot be CONTANT, KREDIET, or NVT. Leave it empty for cash or select a real credit account.');
  }

  warnings.push(...validateContainerDetails(declaration));

  declaration.items.forEach(item => {
    if (requiresVehicleInfo(item.hsCode)) {
      const vehicle = declaration.vehicles.find(v => v.itemId === item.id);
      if (!vehicle) {
        warnings.push(`Item ${item.itemNumber}: Vehicle information required for this HS code`);
      } else {
        warnings.push(...validateVehicleDetails(vehicle, item.itemNumber));
      }
    }
  });

  return warnings;
}
