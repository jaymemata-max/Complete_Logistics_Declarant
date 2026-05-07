import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Upload, ChevronRight, Check, FileText, Ship, Table } from 'lucide-react';
import type { DeclarationContainer, DeclarationItem } from '../types';

// ── Shared parsing helpers ────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  const sep = lines[0].includes('\t') ? '\t' : ',';

  return lines.map(line => {
    const cols: string[] = [];
    let cur = '';
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === sep && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }

    cols.push(cur.trim());
    return cols;
  });
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return parseFloat(cleaned.replace(/,/g, '')) || 0;
}

function digitsOnly(value: string | undefined | null): string {
  return (value || '').replace(/\D/g, '');
}

function id(): string {
  return Math.random().toString(36).substring(2, 9);
}

function defaultItem(itemNumber: number): DeclarationItem {
  return {
    id: id(),
    itemNumber,
    tradeNameSearch: '',
    hsCode: '',
    commercialDescription: '',
    descriptionOfGoods: '',
    countryOfOriginCode: '',
    numberOfPackages: 0,
    kindOfPackagesCode: 'STKS',
    marks1: '',
    marks2: '',
    invoiceAmount: 0,
    invoiceCurrencyCode: 'USD',
    grossWeight: 0,
    netWeight: 0,
    extendedCustomsProcedure: '4000',
    nationalCustomsProcedure: '000',
    preferenceCode: '',
    valuationMethodCode: '1',
    quotaNumber: '',
    previousDocumentSummaryDeclaration: '',
    previousDocumentSummaryDeclarationSubline: '',
    supplementaryUnits: [],
    attachedDocuments: [],
  };
}

function packageCode(value: string | undefined): string {
  const raw = (value || '').trim().toUpperCase();
  if (raw === 'CTN' || raw === 'CARTON' || raw === 'CARTONS') return 'CT';
  if (raw === 'BOX' || raw === 'BOXES') return 'BX';
  if (raw === 'PALLET' || raw === 'PALLETS') return 'PL';
  if (raw === 'PIECE' || raw === 'PIECES' || raw === 'PCS') return 'STKS';
  return raw.slice(0, 4);
}

// ── Field mapping options ─────────────────────────────────────────────────────

const MAPPABLE_FIELDS = [
  { value: 'skip', label: '— Skip —' },
  { value: 'tradeNameSearch', label: 'Trade Name' },
  { value: 'hsCode', label: 'HS Code' },
  { value: 'commercialDescription', label: 'Commercial Description' },
  { value: 'descriptionOfGoods', label: 'Description of Goods' },
  { value: 'numberOfPackages', label: 'Number of Packages' },
  { value: 'kindOfPackagesCode', label: 'Package Type' },
  { value: 'marks1', label: 'Marks 1' },
  { value: 'grossWeight', label: 'Gross Weight (kg)' },
  { value: 'netWeight', label: 'Net Weight (kg)' },
  { value: 'invoiceAmount', label: 'Invoice Amount' },
  { value: 'invoiceCurrencyCode', label: 'Currency' },
  { value: 'countryOfOriginCode', label: 'Country of Origin' },
  { value: 'extendedCustomsProcedure', label: 'CPC Extended' },
  { value: 'nationalCustomsProcedure', label: 'CPC National' },
  { value: 'previousDocumentSummaryDeclaration', label: 'B/L or AWB Number' },
  { value: 'previousDocumentSummaryDeclarationSubline', label: 'B/L Subline' },
  { value: 'supplementaryUnitCode', label: 'Field 41 Unit Code' },
  { value: 'supplementaryUnitQuantity', label: 'Field 41 Unit Qty' },
  { value: 'attachedDocumentCode', label: 'Field 44 Doc Code' },
  { value: 'attachedDocumentName', label: 'Field 44 Doc Name' },
  { value: 'attachedDocumentReference', label: 'Field 44 Doc Ref' },
  { value: 'attachedDocumentDate', label: 'Field 44 Doc Date' },
];

function guessField(header: string): string {
  const h = header.toLowerCase();
  if (h.includes('hs') || h.includes('tariff') || h.includes('tarief')) return 'hsCode';
  if (h.includes('trade') || h.includes('keyword') || h.includes('handels')) return 'tradeNameSearch';
  if (h.includes('commercial') || h.includes('omschrijv')) return 'commercialDescription';
  if (h.includes('description') || h.includes('goods') || h.includes('goederen')) return 'descriptionOfGoods';
  if (h.includes('subline') || h.includes('s/l')) return 'previousDocumentSummaryDeclarationSubline';
  if (h.includes('b/l') || h.includes('bol') || h.includes('awb') || h.includes('vrachtbrief')) return 'previousDocumentSummaryDeclaration';
  if (h.includes('qty') || h.includes('colli') || h.includes('package') || h.includes('aantal')) return 'numberOfPackages';
  if (h.includes('pack') || h.includes('kind')) return 'kindOfPackagesCode';
  if (h.includes('gross') || h.includes('bruto')) return 'grossWeight';
  if (h.includes('net') || h.includes('netto')) return 'netWeight';
  if (h.includes('invoice') || h.includes('price') || h.includes('amount') || h.includes('waarde')) return 'invoiceAmount';
  if (h.includes('curr') || h.includes('valuta')) return 'invoiceCurrencyCode';
  if (h.includes('origin') || h.includes('oorsprong') || h.includes('country')) return 'countryOfOriginCode';
  if (h.includes('mark')) return 'marks1';
  if (h.includes('unit code')) return 'supplementaryUnitCode';
  if (h.includes('unit qty') || h.includes('supp')) return 'supplementaryUnitQuantity';
  if (h.includes('doc code')) return 'attachedDocumentCode';
  if (h.includes('doc ref')) return 'attachedDocumentReference';
  if (h.includes('doc date')) return 'attachedDocumentDate';
  return 'skip';
}

function buildItem(row: string[], mapping: string[], existingCount: number): DeclarationItem {
  const item = defaultItem(existingCount + 1);
  const extra: Record<string, string> = {};

  mapping.forEach((field, colIdx) => {
    if (field === 'skip' || !row[colIdx]) return;
    const val = row[colIdx];

    if (['numberOfPackages', 'grossWeight', 'netWeight', 'invoiceAmount'].includes(field)) {
      (item as any)[field] = parseNumber(val);
    } else if (field === 'hsCode') {
      item.hsCode = digitsOnly(val);
    } else if (field === 'kindOfPackagesCode') {
      item.kindOfPackagesCode = packageCode(val);
    } else if (field === 'invoiceCurrencyCode' || field === 'countryOfOriginCode') {
      (item as any)[field] = val.trim().toUpperCase().slice(0, 3);
    } else if (field === 'extendedCustomsProcedure') {
      item.extendedCustomsProcedure = digitsOnly(val).slice(0, 4);
    } else if (field === 'nationalCustomsProcedure') {
      item.nationalCustomsProcedure = digitsOnly(val).slice(0, 3);
    } else if (field.startsWith('supplementary') || field.startsWith('attached')) {
      extra[field] = val.trim();
    } else {
      (item as any)[field] = val.trim();
    }
  });

  if (extra.supplementaryUnitCode || extra.supplementaryUnitQuantity) {
    item.supplementaryUnits = [{
      id: id(),
      rank: 1,
      code: (extra.supplementaryUnitCode || '').toUpperCase().slice(0, 3),
      quantity: parseNumber(extra.supplementaryUnitQuantity),
    }];
  }

  if (extra.attachedDocumentCode || extra.attachedDocumentReference) {
    item.attachedDocuments = [{
      id: id(),
      documentCode: (extra.attachedDocumentCode || '').toUpperCase().slice(0, 4),
      documentName: extra.attachedDocumentName || '',
      referenceNumber: extra.attachedDocumentReference || '',
      documentDate: extra.attachedDocumentDate || '',
    }];
  }

  if (!item.descriptionOfGoods && item.commercialDescription) item.descriptionOfGoods = item.commercialDescription;
  if (!item.commercialDescription && item.descriptionOfGoods) item.commercialDescription = item.descriptionOfGoods.slice(0, 44);
  if (!item.tradeNameSearch) item.tradeNameSearch = item.commercialDescription || item.descriptionOfGoods;

  return item;
}

// ── ED/SAD and B/L text extraction ────────────────────────────────────────────

function nearbyLines(lines: string[], index: number, radius = 4): string[] {
  return lines.slice(Math.max(0, index - radius), Math.min(lines.length, index + radius + 1));
}

function findDescription(lines: string[], index: number): string {
  const candidates = nearbyLines(lines, index, 3)
    .filter(line => /[A-Za-z]/.test(line))
    .filter(line => !/\b(item|hs|tariff|code|weight|invoice|amount|origin|packages?|field)\b/i.test(line))
    .filter(line => digitsOnly(line).length < 6);
  return (candidates[0] || '').slice(0, 88);
}

function findBillNumber(text: string): string {
  const match = text.match(/\b(?:B\/L|BL|BOL|AWB|Vrachtbrief|Bill of Lading)\s*(?:No\.?|Number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,25})/i);
  return match?.[1]?.replace(/[^\w/-]/g, '') || '';
}

function parseEDText(text: string, existingItemCount: number): DeclarationItem[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const billNumber = findBillNumber(text);
  const found: DeclarationItem[] = [];
  const seen = new Set<string>();

  lines.forEach((line, lineIndex) => {
    const hsMatch = line.match(/\b(\d{4}[\d.\s-]{2,12})\b/);
    const hsCode = digitsOnly(hsMatch?.[1]);
    if (!hsCode || hsCode.length < 6 || hsCode.length > 10 || seen.has(`${lineIndex}-${hsCode}`)) return;

    const item = defaultItem(existingItemCount + found.length + 1);
    const context = nearbyLines(lines, lineIndex, 4).join(' ');
    const pkgMatch = context.match(/(\d+(?:[.,]\d+)?)\s*(CTN?|CARTONS?|BX|BOXES?|PK|PKGS?|PL|PALLETS?|PCS|PIECES?|STKS?)\b/i);
    const grossMatch = context.match(/\b(?:gross|bruto|weight|gewicht)\D{0,12}(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)?\b/i);
    const netMatch = context.match(/\b(?:net|netto)\D{0,12}(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)?\b/i);
    const amountMatch = context.match(/\b(?:USD|AWG|EUR)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2}))\b/);
    const originMatch = context.match(/\b(?:origin|oorsprong|country)\D{0,12}([A-Z]{2,3})\b/i);
    const description = findDescription(lines, lineIndex);

    item.hsCode = hsCode;
    item.tradeNameSearch = description || `Imported item ${found.length + 1}`;
    item.commercialDescription = (description || item.tradeNameSearch).slice(0, 44);
    item.descriptionOfGoods = description || item.tradeNameSearch;
    item.previousDocumentSummaryDeclaration = billNumber;
    item.numberOfPackages = parseNumber(pkgMatch?.[1]);
    item.kindOfPackagesCode = packageCode(pkgMatch?.[2]) || 'STKS';
    item.grossWeight = parseNumber(grossMatch?.[1]);
    item.netWeight = parseNumber(netMatch?.[1]) || item.grossWeight;
    item.invoiceAmount = parseNumber(amountMatch?.[1]);
    item.countryOfOriginCode = (originMatch?.[1] || '').toUpperCase();

    found.push(item);
    seen.add(`${lineIndex}-${hsCode}`);
  });

  return found;
}

function parseContainers(text: string): Partial<DeclarationContainer>[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const containers: Partial<DeclarationContainer>[] = [];

  lines.forEach((line, lineIndex) => {
    const matches = [...line.matchAll(/\b([A-Z]{4}\d{7})\b/g)];
    matches.forEach(match => {
      const context = nearbyLines(lines, lineIndex, 3).join(' ');
      const typeMatch = context.match(/\b(20|40|45)\s*(DC|HC|GP|RF|OT|FR)?\b/i);
      const pkgMatch = context.match(/(\d+(?:[.,]\d+)?)\s*(CTN?|CARTONS?|BX|BOXES?|PK|PKGS?|PL|PALLETS?|DR|PCS|PIECES?)\b/i);
      const weightMatch = context.match(/\b(?:gross|weight|gewicht|kg)\D{0,12}(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)?\b/i);
      const itemMatch = context.match(/\bitem\s*(\d{1,3})\b/i);
      const description = findDescription(lines, lineIndex);

      containers.push({
        id: id(),
        containerNumber: match[1],
        containerType: typeMatch ? `${typeMatch[1]}${(typeMatch[2] || 'DC').toUpperCase()}` : '',
        emptyFullIndicator: 'F',
        itemNumber: itemMatch ? parseInt(itemMatch[1], 10) : 0,
        goodsDescription: description,
        packagesType: packageCode(pkgMatch?.[2]),
        packagesNumber: parseNumber(pkgMatch?.[1]),
        packagesWeight: parseNumber(weightMatch?.[1]),
      });
    });
  });

  return containers;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  existingItemCount: number;
  onImport: (items: Partial<DeclarationItem>[]) => void;
  onImportContainers?: (containers: Partial<DeclarationContainer>[]) => void;
  initialMode?: ImportWorkflowMode;
  onClose: () => void;
}

export type ImportWorkflowMode = 'invoice' | 'ed' | 'containers';
type Step = 'paste' | 'map' | 'preview';

const MODE_COPY: Record<ImportWorkflowMode, { title: string; description: string; placeholder: string; icon: React.ElementType }> = {
  invoice: {
    title: 'Invoice / packing list',
    description: 'Map CSV or TSV columns from supplier invoices and packing lists.',
    placeholder: 'Description,HS Code,Qty,Package Type,Gross Weight,Net Weight,Price,Currency,B/L\nLaptops,84714100,8,CT,60,55,2752.00,USD,BL123456',
    icon: Table,
  },
  ed: {
    title: 'ED / SAD text',
    description: 'Paste copied ED or SAD PDF text. The app extracts item lines and HS codes for review.',
    placeholder: 'Paste text copied from an ED/SAD PDF here. The parser looks for HS codes, descriptions, packages, weights, invoice amounts, origin, and B/L/AWB references.',
    icon: FileText,
  },
  containers: {
    title: 'B/L containers',
    description: 'Paste B/L or arrival notice text. The app extracts container numbers and package details.',
    placeholder: 'Paste B/L text here. Example:\nBEAU5503330 40HC 95 CTN GROSS 1234 KG WASHING MACHINES\nItem 1',
    icon: Ship,
  },
};

export const ImportItemsModal: React.FC<Props> = ({ existingItemCount, onImport, onImportContainers, initialMode = 'invoice', onClose }) => {
  const [mode, setMode] = useState<ImportWorkflowMode>(initialMode);
  const [step, setStep] = useState<Step>('paste');
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [previewItems, setPreviewItems] = useState<Partial<DeclarationItem>[]>([]);
  const [previewContainers, setPreviewContainers] = useState<Partial<DeclarationContainer>[]>([]);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const resetPreview = () => {
    setStep('paste');
    setRows([]);
    setHeaders([]);
    setMapping([]);
    setPreviewItems([]);
    setPreviewContainers([]);
    setParseError('');
  };

  const handleModeChange = (nextMode: ImportWorkflowMode) => {
    setMode(nextMode);
    resetPreview();
  };

  const handleParse = () => {
    setParseError('');
    if (!rawText.trim()) return;

    if (mode === 'invoice') {
      const parsed = parseCSV(rawText);
      if (parsed.length === 0) return;
      const hdrs = hasHeader ? parsed[0] : parsed[0].map((_, i) => `Column ${i + 1}`);
      const dataRows = hasHeader ? parsed.slice(1) : parsed;
      setHeaders(hdrs);
      setRows(dataRows);
      setMapping(hdrs.map(h => guessField(h)));
      setStep('map');
      return;
    }

    if (mode === 'ed') {
      const items = parseEDText(rawText, existingItemCount);
      setPreviewItems(items);
      setParseError(items.length ? '' : 'No item lines found. Paste the PDF text, or use Invoice / packing list CSV mapping.');
      setStep('preview');
      return;
    }

    const containers = parseContainers(rawText);
    setPreviewContainers(containers);
    setParseError(containers.length ? '' : 'No container numbers found. Container numbers must look like ABCD1234567.');
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Direct PDF extraction is not available yet. Open the PDF, copy the text, and paste it here.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setRawText(ev.target?.result as string || '');
    reader.readAsText(file);
  };

  const handlePreview = () => {
    const items = rows.map((row, i) => buildItem(row, mapping, existingItemCount + i));
    setPreviewItems(items);
    setStep('preview');
  };

  const handleImport = () => {
    if (mode === 'containers') {
      onImportContainers?.(previewContainers);
    } else {
      onImport(previewItems);
    }
    onClose();
  };

  const steps: Step[] = mode === 'invoice' ? ['paste', 'map', 'preview'] : ['paste', 'preview'];
  const copy = MODE_COPY[mode];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">Import ED / Invoice / B/L</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bring copied document data into a declaration, then review before saving.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b bg-muted/20">
          {(Object.keys(MODE_COPY) as ImportWorkflowMode[]).map(key => {
            const Icon = MODE_COPY[key].icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleModeChange(key)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  mode === key ? 'border-primary bg-primary/10 text-primary' : 'bg-card hover:bg-muted/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{MODE_COPY[key].title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30 text-sm">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 ${step === s ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === s ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {i + 1}
                </div>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'paste' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">{copy.title}</h3>
                <p className="text-sm text-muted-foreground">{copy.description}</p>
              </div>

              <div className="flex items-center gap-4">
                {mode === 'invoice' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasHeader"
                      checked={hasHeader}
                      onChange={e => setHasHeader(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="hasHeader" className="font-normal">First row is a header</Label>
                  </div>
                )}
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload text/CSV
                </Button>
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.pdf" className="hidden" onChange={handleFileUpload} />
              </div>

              {parseError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {parseError}
                </div>
              )}

              <textarea
                className="w-full h-72 font-mono text-xs p-3 border rounded-lg bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={copy.placeholder}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />

              <p className="text-xs text-muted-foreground">
                For PDFs, open the file and copy the selectable text into this box. Scanned PDFs still need OCR before import.
              </p>
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Map each column from your file to the correct declaration field.
              </p>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4 items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium text-sm">{h}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {rows[0]?.[i] || ''}
                      </div>
                    </div>
                    <Select value={mapping[i]} onValueChange={v => {
                      const m = [...mapping];
                      m[i] = v;
                      setMapping(m);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MAPPABLE_FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {rows.length} data row{rows.length !== 1 ? 's' : ''} detected.
              </p>
            </div>
          )}

          {step === 'preview' && mode !== 'containers' && (
            <div className="space-y-4">
              {parseError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {parseError}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Review the items before importing. {previewItems.length} item{previewItems.length !== 1 ? 's' : ''} will be added.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border">#</th>
                      <th className="text-left p-2 border">Trade Name</th>
                      <th className="text-left p-2 border">HS Code</th>
                      <th className="text-left p-2 border">Description</th>
                      <th className="text-right p-2 border">Pkgs</th>
                      <th className="text-right p-2 border">Weight</th>
                      <th className="text-right p-2 border">Invoice</th>
                      <th className="text-left p-2 border">B/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.map((item, i) => (
                      <tr key={i} className="border-b hover:bg-muted/20">
                        <td className="p-2 border font-mono">{existingItemCount + i + 1}</td>
                        <td className="p-2 border">{item.tradeNameSearch || '—'}</td>
                        <td className="p-2 border font-mono">{item.hsCode || '—'}</td>
                        <td className="p-2 border max-w-[220px] truncate">{item.commercialDescription || item.descriptionOfGoods || '—'}</td>
                        <td className="p-2 border text-right">{item.numberOfPackages || '—'}</td>
                        <td className="p-2 border text-right">{item.grossWeight ? `${item.grossWeight} kg` : '—'}</td>
                        <td className="p-2 border text-right">{item.invoiceAmount ? `${item.invoiceCurrencyCode} ${item.invoiceAmount}` : '—'}</td>
                        <td className="p-2 border font-mono">{item.previousDocumentSummaryDeclaration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'preview' && mode === 'containers' && (
            <div className="space-y-4">
              {parseError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {parseError}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Review the containers before importing. {previewContainers.length} container{previewContainers.length !== 1 ? 's' : ''} will be added.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border">Container</th>
                      <th className="text-left p-2 border">Type</th>
                      <th className="text-left p-2 border">Item</th>
                      <th className="text-left p-2 border">Goods</th>
                      <th className="text-left p-2 border">Pkg Type</th>
                      <th className="text-right p-2 border">Pkgs</th>
                      <th className="text-right p-2 border">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewContainers.map((container, i) => (
                      <tr key={i} className="border-b hover:bg-muted/20">
                        <td className="p-2 border font-mono">{container.containerNumber || '—'}</td>
                        <td className="p-2 border">{container.containerType || '—'}</td>
                        <td className="p-2 border">{container.itemNumber || '—'}</td>
                        <td className="p-2 border max-w-[220px] truncate">{container.goodsDescription || '—'}</td>
                        <td className="p-2 border">{container.packagesType || '—'}</td>
                        <td className="p-2 border text-right">{container.packagesNumber || '—'}</td>
                        <td className="p-2 border text-right">{container.packagesWeight ? `${container.packagesWeight} kg` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t">
          <Button variant="outline" onClick={step === 'paste' ? onClose : () => setStep(step === 'preview' && mode === 'invoice' ? 'map' : 'paste')}>
            {step === 'paste' ? 'Cancel' : 'Back'}
          </Button>
          {step === 'paste' && (
            <Button onClick={handleParse} disabled={!rawText.trim()}>
              {mode === 'invoice' ? 'Parse Columns' : mode === 'ed' ? 'Extract Items' : 'Extract Containers'}
            </Button>
          )}
          {step === 'map' && (
            <Button onClick={handlePreview}>
              Preview Import
            </Button>
          )}
          {step === 'preview' && (
            <Button
              onClick={handleImport}
              className="gap-2"
              disabled={mode === 'containers' ? previewContainers.length === 0 : previewItems.length === 0}
            >
              <Check className="h-4 w-4" />
              Import {mode === 'containers' ? `${previewContainers.length} Containers` : `${previewItems.length} Items`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
