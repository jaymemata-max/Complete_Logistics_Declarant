import type { DeclarationContainer, DeclarationHeader, DeclarationItem } from '../types';
import { normalizeDeferredPaymentReference } from './declarationRules';

export interface ParsedEdImport {
  header: Partial<DeclarationHeader>;
  items: DeclarationItem[];
  containers: Partial<DeclarationContainer>[];
  reviewNotes: string[];
}

const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

function parseNumber(raw = ''): number {
  const value = String(raw).trim().replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  if (!value) return 0;
  if (value.includes(',')) return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
  if (/^\d{1,3}(\.\d{3})+$/.test(value)) return Number(value.replace(/\./g, '')) || 0;
  return Number(value) || 0;
}

function tokens(line = ''): string[] {
  return line.split(/\s+/).filter(Boolean);
}

function parseAmountCurrency(raw = '') {
  const [amountPart, rest = ''] = raw.split(/\t+/);
  return {
    amount: parseNumber(amountPart),
    currency: (rest.match(/[A-Z]{3}/)?.[0] || 'USD').toUpperCase(),
  };
}

function packageCode(raw = ''): string {
  const code = raw.trim().toUpperCase();
  if (code === 'CTN' || code === 'CTNS' || code === 'CARTON' || code === 'CARTONS') return 'CT';
  if (code === 'BOX' || code === 'BOXES') return 'BX';
  if (code === 'PALLET' || code === 'PALLETS') return 'PL';
  if (code === 'PCS' || code === 'PIECE' || code === 'PIECES' || code === 'STKS') return 'STKS';
  return code.slice(0, 4) || 'STKS';
}

function parsePackageLine(raw = '') {
  const parts = raw.split(/\t+/);
  if (parts.length >= 2) return { code: packageCode(parts[0]), quantity: parseNumber(parts[1]) };
  const match = raw.match(/([A-Z]+)\s+(\d+(?:[.,]\d+)?)/i);
  return { code: packageCode(match?.[1] || ''), quantity: parseNumber(match?.[2] || '') };
}

function parseCpc(raw = '') {
  const [extended = '4000', national = '000'] = raw.trim().split(/\s+/);
  return { extendedCustomsProcedure: extended, nationalCustomsProcedure: national };
}

function parseSupplementaryUnit(raw = '') {
  const match = raw.match(/([A-Z]{2,3})\s+([\d.,]+)\s+([\d.,]+)/i);
  return {
    code: (match?.[1] || 'PCE').toUpperCase(),
    quantity: parseNumber(match?.[2] || '0'),
    invoiceAmount: parseNumber(match?.[3] || '0'),
  };
}

function paymentReference(lines: string[]): string {
  const paymentMode = lines.find(line => line === 'KREDIET' || line === 'CONTANT') || '';
  if (paymentMode === 'CONTANT') return '';
  const account = lines.find(line => /^MARICAR LOG\.\s*\d+/i.test(line));
  return normalizeDeferredPaymentReference(account || (paymentMode === 'KREDIET' ? 'MARICAR LOG. 34' : ''));
}

function findLocationAddress(lines: string[], placeOfLoadingLine: string): string {
  const printedLabel = /(plaats van lading|kantoor|land|waarde|datum|aangifte|controle|handtekening|totaal|code|artikel|factuur|aanvullende|vervoer|douane)/i;
  const placeOfLoadingIndex = lines.findIndex(line => line === placeOfLoadingLine);
  if (placeOfLoadingIndex === -1) return '';

  return lines.slice(placeOfLoadingIndex + 1, placeOfLoadingIndex + 4).find(line =>
    line.length <= 60
    && /(#\s*\d+|\b\d+[A-Z]?(?:-[A-Z])?\b)/i.test(line)
    && /\d/.test(line)
    && /[A-Za-z]/.test(line)
    && !line.includes('2026')
    && !/^(HI|LV)\d{2}\b/i.test(line)
    && !/\bbestem\./i.test(line)
    && !printedLabel.test(line)
  ) || '';
}

function findTradeName(lines: string[], start: number, fallback: string): string {
  const candidates = lines
    .slice(start, start + 85)
    .filter(line => /^[A-Z][A-Z\s]+$/.test(line))
    .filter(line => !['S/L', 'AFL'].includes(line));
  return candidates.find(line => !line.includes('AANGIFTE')) || fallback;
}

function findSecondItemTradeName(lines: string[], fallback: string): string {
  const totals = lines.findIndex(line => line.includes('Totaal Tweede Artikel'));
  if (totals === -1) return fallback;
  const candidates = lines
    .slice(totals, totals + 35)
    .filter(line => /^[A-Z][A-Z\s]+$/.test(line))
    .filter(line => !['S/L', 'AFL'].includes(line));
  return candidates[candidates.length - 1] || fallback;
}

function buildDocuments(itemNumber: number, referenceNumber: string, documentReference: string, documentDate: string, shipmentType: string) {
  return [
    {
      id: makeId(`doc-${itemNumber}-invoice`),
      documentCode: '001',
      documentName: 'Factuur',
      referenceNumber: `INV-${referenceNumber}`,
      documentDate,
    },
    {
      id: makeId(`doc-${itemNumber}-bl`),
      documentCode: '002',
      documentName: shipmentType === 'Air' ? 'Air waybill' : 'Vrachtbrief (bill of lading)',
      referenceNumber: documentReference,
      documentDate,
    },
  ];
}

function buildItem(itemNumber: number, values: {
  tradeName: string;
  hsCode: string;
  goodsDescription: string;
  origin: string;
  packagesType: string;
  packagesNumber: number;
  grossWeight: number;
  netWeight: number;
  invoiceAmount: number;
  invoiceCurrencyCode: string;
  previousDocument: string;
  suCode: string;
  suQuantity: number;
  extendedCustomsProcedure: string;
  nationalCustomsProcedure: string;
  attachedDocuments: DeclarationItem['attachedDocuments'];
}): DeclarationItem {
  return {
    id: makeId('item'),
    itemNumber,
    tradeNameSearch: values.tradeName,
    hsCode: values.hsCode,
    commercialDescription: values.tradeName.slice(0, 44),
    descriptionOfGoods: values.goodsDescription || values.tradeName,
    countryOfOriginCode: values.origin,
    numberOfPackages: values.packagesNumber,
    kindOfPackagesCode: values.packagesType,
    marks1: '',
    marks2: '',
    invoiceAmount: values.invoiceAmount,
    invoiceCurrencyCode: values.invoiceCurrencyCode || 'USD',
    grossWeight: values.grossWeight,
    netWeight: values.netWeight,
    extendedCustomsProcedure: values.extendedCustomsProcedure || '4000',
    nationalCustomsProcedure: values.nationalCustomsProcedure || '000',
    preferenceCode: '',
    valuationMethodCode: '1',
    quotaNumber: '',
    previousDocumentSummaryDeclaration: values.previousDocument || '',
    previousDocumentSummaryDeclarationSubline: '',
    supplementaryUnits: values.suQuantity
      ? [{ id: makeId('su'), rank: 1, code: values.suCode || 'PCE', quantity: values.suQuantity }]
      : [],
    attachedDocuments: values.attachedDocuments,
  };
}

function extractContainer(
  raw: string,
  item: DeclarationItem,
  typeGuess = '40HC'
): Partial<DeclarationContainer> | null {
  const match = raw.match(/\b([A-Z]{4}\d{7})\s*\/\s*([\d.,]+)\s*([A-Z]+)\b/i);
  if (!match) return null;
  return {
    id: makeId('ctr'),
    itemNumber: item.itemNumber,
    containerNumber: match[1].toUpperCase(),
    containerType: typeGuess,
    emptyFullIndicator: 'F',
    goodsDescription: item.descriptionOfGoods,
    packagesType: packageCode(match[3]),
    packagesNumber: parseNumber(match[2]),
    packagesWeight: item.grossWeight,
  };
}

export function parseSadPdfText(rawText: string, existingItemCount = 0): ParsedEdImport {
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const reviewNotes = [
    'Confirm reference, manifest, and date fields because SAD PDF text can concatenate these values.',
    'Freight and insurance were set as test placeholders.',
    'Field 44 document references are best guesses from the SAD reference number and B/L/AWB.',
    'Commercial descriptions are condensed SAD descriptions, not original supplier invoice line descriptions.',
  ];

  const cLine = lines.findIndex(line => /^C\s+\d+\s+\d{2}\/\d{2}\/\d{4}$/.test(line));
  if (cLine === -1) {
    return { header: {}, items: [], containers: [], reviewNotes: ['No SAD header line found. Paste selectable text from the SAD PDF.'] };
  }

  const refMatch = lines[cLine].match(/^C\s+(\d+)\s+(\d{2})\/(\d{2})\/(\d{4})$/);
  const referenceNumber = refMatch?.[1] || '';
  const documentDate = refMatch ? `${refMatch[4]}-${refMatch[3]}-${refMatch[2]}` : new Date().toISOString().slice(0, 10);
  const typeParts = tokens(lines[cLine + 1]);
  const headerParts = tokens(lines[cLine + 3]);
  const totalItems = parseInt(headerParts[0] || '1', 10) || 1;
  const totalPackages = parseNumber(headerParts[1] || '0');
  const manifest = headerParts.slice(2, -1).join('');
  const referenceYear = headerParts[headerParts.length - 1] || refMatch?.[4] || String(new Date().getFullYear());
  const transportParts = tokens(lines[cLine + 4]);
  const transportNationality = transportParts[0] || '';
  const containerFlag = transportParts[transportParts.length - 1]?.toLowerCase() === 'yes';
  const transportIdentity = transportParts.slice(1, -1).join(' ');
  const shipmentType = transportIdentity.includes('AVIANCA') ? 'Air' : containerFlag ? 'FCL' : 'LCL';
  const itemStartIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(x => /^\d+\s+\d{8,10}/.test(x.line))
    .map(x => x.index);

  if (itemStartIndexes.length === 0) {
    return { header: {}, items: [], containers: [], reviewNotes: ['No SAD item lines with HS codes found.'] };
  }

  const first = itemStartIndexes[0];
  const firstMatch = lines[first].match(/^(\d+)\s+(\d{8,10})/);
  const origin = lines[first + 1] || transportNationality;
  const destinationCountry = lines[first + 4] || 'AW';
  const [deliveryTermsCode = '', ...deliveryPlaceParts] = tokens(lines[first + 5] || '');
  const invoice = parseAmountCurrency(lines[first + 7]);
  const hasContainerLine = /\b[A-Z]{4}\d{7}\s*\//.test(lines[first + 9] || '');
  const firstPackage = parsePackageLine(lines[first + (hasContainerLine ? 10 : 9)]);
  const firstCpc = parseCpc(lines[first + 15]);
  const firstPreviousDocument = lines[first + 16] || lines[first + 8] || manifest;
  const firstGross = Math.max(parseNumber(lines[first + 13]), parseNumber(lines[first + 14]));
  const firstNet = Math.min(parseNumber(lines[first + 13]), parseNumber(lines[first + 14])) || firstGross;
  const firstSu = parseSupplementaryUnit(lines.find((line, index) => index > first && index < first + 45 && /^PCE\s+/.test(line)) || '');
  const firstDescription = lines.find((line, index) =>
    index > first
    && index < first + 45
    && /[a-z]/.test(line)
    && !line.includes('Land')
    && !line.includes('Kantoor')
    && !line.includes('Plaats')
  ) || 'Imported goods';
  const firstTrade = findTradeName(lines, first + 50, firstDescription);
  const docs = (itemNumber: number, previousDocument: string) =>
    buildDocuments(itemNumber, referenceNumber, previousDocument || manifest, documentDate, shipmentType);

  const items: DeclarationItem[] = [
    buildItem(existingItemCount + 1, {
      tradeName: firstTrade,
      hsCode: firstMatch?.[2] || '',
      goodsDescription: firstDescription,
      origin,
      packagesType: firstPackage.code,
      packagesNumber: firstPackage.quantity,
      grossWeight: firstGross,
      netWeight: firstNet,
      invoiceAmount: firstSu.invoiceAmount || invoice.amount,
      invoiceCurrencyCode: invoice.currency,
      previousDocument: firstPreviousDocument,
      suCode: firstSu.code,
      suQuantity: firstSu.quantity,
      attachedDocuments: docs(existingItemCount + 1, firstPreviousDocument),
      ...firstCpc,
    }),
  ];

  if (totalItems > 1 && itemStartIndexes[1]) {
    const second = itemStartIndexes[1];
    const secondMatch = lines[second].match(/^(\d+)\s+(\d{8,10})/);
    const secondPackage = parsePackageLine(lines[second + 1]);
    const secondCpc = parseCpc(lines[second + 5]);
    const secondSu = parseSupplementaryUnit(lines[second + 7]);
    const secondGross = parseNumber(lines[second + 3]);
    const secondTrade = findSecondItemTradeName(lines, firstTrade);
    const secondPreviousDocument = lines[second - 31]?.match(/^[A-Z0-9-]+$/) ? lines[second - 31] : firstPreviousDocument;
    items.push(buildItem(existingItemCount + 2, {
      tradeName: secondTrade,
      hsCode: secondMatch?.[2] || '',
      goodsDescription: secondTrade === firstTrade ? firstDescription : secondTrade,
      origin: lines[second + 4] || origin,
      packagesType: secondPackage.code,
      packagesNumber: secondPackage.quantity,
      grossWeight: secondGross,
      netWeight: secondGross,
      invoiceAmount: secondSu.invoiceAmount || parseNumber(lines[second + 6]),
      invoiceCurrencyCode: invoice.currency,
      previousDocument: secondPreviousDocument,
      suCode: secondSu.code,
      suQuantity: secondSu.quantity,
      attachedDocuments: docs(existingItemCount + 2, secondPreviousDocument),
      ...secondCpc,
    }));
  }

  const containers: Partial<DeclarationContainer>[] = [];
  if (containerFlag) {
    lines
      .filter(line => /\b[A-Z]{4}\d{7}\s*\//.test(line))
      .forEach((line, index) => {
        const container = extractContainer(line, items[Math.min(index, items.length - 1)]);
        if (container) containers.push(container);
      });
    reviewNotes.push('Container type was guessed as 40HC because the SAD PDF does not show the ISO type clearly.');
  }

  const placeOfLoadingLine = lines.find(line => /^AW[A-Z0-9]{2,}\s+/.test(line)) || '';
  const borderOfficeLine = lines.find(line => /^(HI|LV)\d{2}\s+/.test(line)) || '';
  const totalInvoice = Math.round(items.reduce((sum, item) => sum + item.invoiceAmount, 0) * 100) / 100;
  const totalGross = Math.round(items.reduce((sum, item) => sum + item.grossWeight, 0) * 100) / 100;

  return {
    header: {
      shipmentType,
      typeOfDeclaration: typeParts[0] || 'INV',
      generalProcedureCode: typeParts[1] || '4',
      manifestReferenceNumber: manifest,
      totalNumberOfPackages: totalPackages,
      customsClearanceOfficeCode: lines[cLine - 10] || tokens(borderOfficeLine)[0] || '',
      consigneeCode: lines[cLine - 9] || '',
      consigneeName: lines[cLine - 8] || '',
      declarantCode: lines[cLine - 4] || '5036782',
      declarantName: lines[cLine - 3] || 'Complete Logistics',
      referenceYear,
      referenceNumber,
      countryFirstDestination: destinationCountry,
      tradingCountry: origin,
      exportCountryCode: transportNationality || origin,
      destinationCountryCode: destinationCountry,
      containerFlag,
      locationOfGoods: lines[first + 6] || '',
      locationOfGoodsAddress: findLocationAddress(lines, placeOfLoadingLine),
      transportIdentity,
      transportNationality,
      borderTransportIdentity: transportIdentity,
      borderTransportNationality: transportNationality,
      borderTransportMode: shipmentType === 'Air' ? '4' : '1',
      deliveryTermsCode,
      deliveryTermsPlace: deliveryPlaceParts.join(' '),
      borderOfficeCode: tokens(borderOfficeLine)[0] || '',
      placeOfLoadingCode: tokens(placeOfLoadingLine)[0] || (shipmentType === 'Air' ? 'AWAIR' : 'AWBAR'),
      deferredPaymentReference: paymentReference(lines),
      invoiceAmount: totalInvoice,
      invoiceCurrencyCode: invoice.currency,
      externalFreightAmount: 100,
      externalFreightCurrencyCode: invoice.currency,
      insuranceAmount: 25,
      insuranceCurrencyCode: invoice.currency,
      grossWeight: totalGross,
    },
    items,
    containers,
    reviewNotes,
  };
}
