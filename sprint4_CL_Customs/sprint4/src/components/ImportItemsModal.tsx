import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Upload, ChevronRight, Check } from 'lucide-react';
import type { DeclarationItem } from '../types';

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
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

// ── Field mapping options ─────────────────────────────────────────────────────

const MAPPABLE_FIELDS = [
  { value: 'skip',              label: '— Skip —' },
  { value: 'tradeNameSearch',   label: 'Trade Name' },
  { value: 'hsCode',            label: 'HS Code' },
  { value: 'commercialDescription', label: 'Commercial Description' },
  { value: 'descriptionOfGoods',    label: 'Description of Goods' },
  { value: 'numberOfPackages',  label: 'Number of Packages' },
  { value: 'kindOfPackagesCode', label: 'Package Type' },
  { value: 'marks1',            label: 'Marks 1' },
  { value: 'grossWeight',       label: 'Gross Weight (kg)' },
  { value: 'netWeight',         label: 'Net Weight (kg)' },
  { value: 'invoiceAmount',     label: 'Invoice Amount' },
  { value: 'invoiceCurrencyCode', label: 'Currency' },
  { value: 'countryOfOriginCode', label: 'Country of Origin' },
  { value: 'extendedCustomsProcedure', label: 'CPC Extended' },
  { value: 'nationalCustomsProcedure', label: 'CPC National' },
  { value: 'previousDocumentSummaryDeclaration', label: 'B/L Number' },
];

// Auto-detect likely field from column header
function guessField(header: string): string {
  const h = header.toLowerCase();
  if (h.includes('hs') || h.includes('tariff') || h.includes('code')) return 'hsCode';
  if (h.includes('trade') || h.includes('keyword')) return 'tradeNameSearch';
  if (h.includes('commercial') || h.includes('omschrijv')) return 'commercialDescription';
  if (h.includes('description') || h.includes('goods') || h.includes('goederen')) return 'descriptionOfGoods';
  if (h.includes('qty') || h.includes('colli') || h.includes('package') || h.includes('aantal')) return 'numberOfPackages';
  if (h.includes('gross') || h.includes('bruto')) return 'grossWeight';
  if (h.includes('net') || h.includes('netto')) return 'netWeight';
  if (h.includes('invoice') || h.includes('price') || h.includes('amount') || h.includes('waarde')) return 'invoiceAmount';
  if (h.includes('curr') || h.includes('valuta')) return 'invoiceCurrencyCode';
  if (h.includes('origin') || h.includes('oorsprong') || h.includes('country')) return 'countryOfOriginCode';
  if (h.includes('mark')) return 'marks1';
  if (h.includes('b/l') || h.includes('bol') || h.includes('vrachtbrief')) return 'previousDocumentSummaryDeclaration';
  return 'skip';
}

function buildItem(row: string[], mapping: string[], existingCount: number): Partial<DeclarationItem> {
  const item: any = {
    id: Math.random().toString(36).substring(2, 9),
    itemNumber: existingCount + 1,
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
    previousDocumentSummaryDeclarationSubline: '1',
    supplementaryUnits: [],
    attachedDocuments: [],
  };
  mapping.forEach((field, colIdx) => {
    if (field === 'skip' || !row[colIdx]) return;
    const val = row[colIdx];
    if (['numberOfPackages', 'grossWeight', 'netWeight', 'invoiceAmount'].includes(field)) {
      item[field] = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    } else {
      item[field] = val;
    }
  });
  return item;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  existingItemCount: number;
  onImport: (items: Partial<DeclarationItem>[]) => void;
  onClose: () => void;
}

type Step = 'paste' | 'map' | 'preview';

export const ImportItemsModal: React.FC<Props> = ({ existingItemCount, onImport, onClose }) => {
  const [step, setStep] = useState<Step>('paste');
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [previewItems, setPreviewItems] = useState<Partial<DeclarationItem>[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const parsed = parseCSV(rawText);
    if (parsed.length === 0) return;
    const hdrs = hasHeader ? parsed[0] : parsed[0].map((_, i) => `Column ${i + 1}`);
    const dataRows = hasHeader ? parsed.slice(1) : parsed;
    setHeaders(hdrs);
    setRows(dataRows);
    setMapping(hdrs.map(h => guessField(h)));
    setStep('map');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawText(ev.target?.result as string || '');
    reader.readAsText(file);
  };

  const handlePreview = () => {
    const items = rows.map((row, i) =>
      buildItem(row, mapping, existingItemCount + i)
    );
    setPreviewItems(items);
    setStep('preview');
  };

  const handleImport = () => {
    onImport(previewItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">Import Items from Packing List</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Paste CSV data or upload a .csv file from your supplier
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30 text-sm">
          {(['paste', 'map', 'preview'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 ${step === s ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === s ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {i + 1}
                </div>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step 1: Paste */}
          {step === 'paste' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
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
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload CSV file
                </Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </div>

              <textarea
                className="w-full h-64 font-mono text-xs p-3 border rounded-lg bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={'Paste CSV data here. Example:\nDescription,HS Code,Qty,Weight,Price\nLaptops,84714100,8,60,2752.00\nMonitors,85285100,9,60,1161.00'}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />

              <p className="text-xs text-muted-foreground">
                Supports comma-separated (.csv) and tab-separated (.tsv) formats.
                For Excel files: File → Save As → CSV, then upload or paste.
              </p>
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Map each column from your file to the correct declaration field.
                Fields auto-detected based on column headers.
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

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review the items before importing. {previewItems.length} item{previewItems.length !== 1 ? 's' : ''} will be added to the declaration.
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
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.map((item, i) => (
                      <tr key={i} className="border-b hover:bg-muted/20">
                        <td className="p-2 border font-mono">{existingItemCount + i + 1}</td>
                        <td className="p-2 border">{item.tradeNameSearch || '—'}</td>
                        <td className="p-2 border font-mono">{item.hsCode || '—'}</td>
                        <td className="p-2 border max-w-[200px] truncate">{item.commercialDescription || item.descriptionOfGoods || '—'}</td>
                        <td className="p-2 border text-right">{item.numberOfPackages || '—'}</td>
                        <td className="p-2 border text-right">{item.grossWeight ? `${item.grossWeight} kg` : '—'}</td>
                        <td className="p-2 border text-right">{item.invoiceAmount ? `${item.invoiceCurrencyCode} ${item.invoiceAmount}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t">
          <Button variant="outline" onClick={step === 'paste' ? onClose : () => setStep(step === 'preview' ? 'map' : 'paste')}>
            {step === 'paste' ? 'Cancel' : 'Back'}
          </Button>
          {step === 'paste' && (
            <Button onClick={handleParse} disabled={!rawText.trim()}>
              Parse Data
            </Button>
          )}
          {step === 'map' && (
            <Button onClick={handlePreview}>
              Preview Import
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleImport} className="gap-2">
              <Check className="h-4 w-4" />
              Import {previewItems.length} Items
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
