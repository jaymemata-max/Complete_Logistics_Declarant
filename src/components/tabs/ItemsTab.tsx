import React, { useState, useEffect } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Copy, ChevronRight, ChevronDown, Upload } from 'lucide-react';
import { ImportItemsModal } from '../ImportItemsModal';
import type { DeclarationItem } from '../../types';

// ── Commodity master search ───────────────────────────────────────────────────

interface CommodityRecord {
  keyword: string;
  hs_code: string;
  commercial_description: string;
  goods_description: string;
  marks_1: string;
  package_code: string;
  supp_unit_code: string;
}

interface SearchDropdownProps {
  value: string;
  onSelect: (record: CommodityRecord) => void;
}

const CommoditySearch: React.FC<SearchDropdownProps> = ({ value, onSelect }) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CommodityRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const handleInput = (q: string) => {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('commodity_master')
        .select('keyword, hs_code, commercial_description, goods_description, marks_1, package_code, supp_unit_code')
        .or(`keyword.ilike.%${q}%,hs_code.ilike.%${q}%,commercial_description.ilike.%${q}%`)
        .limit(12);
      setResults(data || []);
      setOpen((data || []).length > 0);
      setLoading(false);
    }, 250);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Input
        value={query}
        onChange={e => handleInput(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search trade name or HS code..."
      />
      {loading && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '13px', color: '#888' }}>
          Searching...
        </div>
      )}
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, maxHeight: '240px', overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f1f1' }}
              onMouseDown={() => { onSelect(r); setQuery(r.keyword); setOpen(false); }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8f8f8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.keyword}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{r.hs_code} — {r.commercial_description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main ItemsTab ─────────────────────────────────────────────────────────────

export const ItemsTab: React.FC = () => {
  const { declaration, addItem, updateItem, deleteItem, duplicateItem, updateDeclaration } = useDeclaration();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [cpcCodes, setCpcCodes] = useState<{ code: string; extended: string; national: string; description: string }[]>([]);
  const [packageTypes, setPackageTypes] = useState<{ code: string; description: string }[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('cpc_codes').select('code, extended, national, description').order('code').then(r => setCpcCodes(r.data || [])),
      supabase.from('package_types').select('code, description').order('code').then(r => setPackageTypes(r.data || [])),
      supabase.from('countries').select('code, name').order('code').then(r => setCountries(r.data || [])),
    ]);
  }, []);

  if (!declaration) return null;

  const handleCommoditySelect = (itemId: string, record: CommodityRecord) => {
    updateItem(itemId, {
      tradeNameSearch: record.keyword,
      hsCode: record.hs_code,
      commercialDescription: record.commercial_description,
      descriptionOfGoods: record.goods_description,
      marks1: record.marks_1 || '',
      kindOfPackagesCode: record.package_code || '',
    });
  };

  const handleCpcSelect = (itemId: string, cpcCode: string) => {
    const cpc = cpcCodes.find(c => c.code === cpcCode);
    if (cpc) updateItem(itemId, {
      extendedCustomsProcedure: cpc.extended,
      nationalCustomsProcedure: cpc.national,
    });
  };

  const addSu = (itemId: string, units: any[]) => {
    const newSu = { id: Math.random().toString(36).substring(2, 9), rank: units.length + 1, code: '', quantity: 0 };
    updateItem(itemId, { supplementaryUnits: [...units, newSu] });
  };

  const updateSu = (itemId: string, units: any[], idx: number, field: string, val: any) => {
    const updated = units.map((u, i) => i === idx ? { ...u, [field]: val } : u);
    updateItem(itemId, { supplementaryUnits: updated });
  };

  const removeSu = (itemId: string, units: any[], suId: string) => {
    updateItem(itemId, { supplementaryUnits: units.filter(u => u.id !== suId) });
  };

  const addDoc = (itemId: string, docs: any[]) => {
    const newDoc = { id: Math.random().toString(36).substring(2, 9), documentCode: '', documentName: '', referenceNumber: '', documentDate: '' };
    updateItem(itemId, { attachedDocuments: [...docs, newDoc] });
  };

  const updateDoc = (itemId: string, docs: any[], idx: number, field: string, val: string) => {
    const updated = docs.map((d, i) => i === idx ? { ...d, [field]: val } : d);
    updateItem(itemId, { attachedDocuments: updated });
  };

  const removeDoc = (itemId: string, docs: any[], docId: string) => {
    updateItem(itemId, { attachedDocuments: docs.filter(d => d.id !== docId) });
  };

  const cpcValue = (item: any) =>
    item.extendedCustomsProcedure && item.nationalCustomsProcedure
      ? `${item.extendedCustomsProcedure}-${item.nationalCustomsProcedure}`
      : '';

  return (
    <div className="space-y-4 pb-12">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Declaration Items</h2>
          <p className="text-sm text-muted-foreground">{declaration.items.length} item{declaration.items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import Items
          </Button>
          <Button onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {showImport && (
        <ImportItemsModal
          existingItemCount={declaration.items.length}
          onImport={(newItems) => {
            const startNumber = declaration.items.length + 1;
            const itemsToAdd = newItems.map((item, i) => ({
              ...item,
              id: Math.random().toString(36).substring(2, 9),
              itemNumber: startNumber + i,
              supplementaryUnits: [],
              attachedDocuments: [],
            })) as DeclarationItem[];
            updateDeclaration({ items: [...declaration.items, ...itemsToAdd] });
            setShowImport(false);
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      <div className="space-y-3">
        {declaration.items.map((item) => {
          const isExpanded = expandedItemId === item.id;
          return (
            <Card key={item.id} className="overflow-hidden">

              {/* Row header */}
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded
                    ? <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    : <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  }
                  <div className="font-mono bg-primary/10 text-primary px-2 py-1 rounded text-sm font-semibold">
                    Item {item.itemNumber}
                  </div>
                  <div>
                    <span className="font-semibold">{item.tradeNameSearch || 'New Item'}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {item.hsCode ? `HS: ${item.hsCode}` : 'No HS Code'}
                    </span>
                    {item.extendedCustomsProcedure && (
                      <span className="text-muted-foreground ml-2 text-xs font-mono">
                        CPC: {item.extendedCustomsProcedure}-{item.nationalCustomsProcedure}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => duplicateItem(item.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="p-6 border-t space-y-6 bg-card">

                  {/* ── Row 1: Classification + Packaging ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Classification */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Classification</h3>

                      <div className="space-y-2">
                        <Label>Trade Name Search</Label>
                        <CommoditySearch
                          value={item.tradeNameSearch}
                          onSelect={(r) => handleCommoditySelect(item.id, r)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>HS Code (Field 33)</Label>
                          <Input
                            value={item.hsCode}
                            onChange={e => updateItem(item.id, { hsCode: e.target.value })}
                            placeholder="e.g. 84714100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CPC — Procedure (Field 37)</Label>
                          <Select value={cpcValue(item)} onValueChange={v => handleCpcSelect(item.id, v)}>
                            <SelectTrigger><SelectValue placeholder="Select CPC" /></SelectTrigger>
                            <SelectContent>
                              {cpcCodes.map(c => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.code} — {c.description?.substring(0, 50)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Commercial Description</Label>
                        <Input
                          value={item.commercialDescription}
                          onChange={e => updateItem(item.id, { commercialDescription: e.target.value })}
                          maxLength={44}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description of Goods</Label>
                        <Input
                          value={item.descriptionOfGoods}
                          onChange={e => updateItem(item.id, { descriptionOfGoods: e.target.value })}
                          maxLength={88}
                        />
                      </div>

                      {/* Field 36 + 39 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Field 36 — Prefer.</Label>
                          <Input
                            value={item.preferenceCode || ''}
                            onChange={e => updateItem(item.id, { preferenceCode: e.target.value })}
                            placeholder="Preference code"
                            maxLength={17}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Field 39 — Contingent</Label>
                          <Input
                            value={item.quotaNumber || ''}
                            onChange={e => updateItem(item.id, { quotaNumber: e.target.value })}
                            placeholder="Quota reference"
                            maxLength={17}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Packaging & Valuation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Packaging & Valuation</h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>No. Packages (Field 31)</Label>
                          <Input
                            type="number"
                            value={item.numberOfPackages}
                            onChange={e => updateItem(item.id, { numberOfPackages: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Package Type</Label>
                          <Select value={item.kindOfPackagesCode} onValueChange={v => updateItem(item.id, { kindOfPackagesCode: v })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {packageTypes.map(p => (
                                <SelectItem key={p.code} value={p.code}>{p.code} — {p.description}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Marks 1</Label>
                          <Input value={item.marks1} onChange={e => updateItem(item.id, { marks1: e.target.value })} maxLength={35} />
                        </div>
                        <div className="space-y-2">
                          <Label>Marks 2</Label>
                          <Input value={item.marks2} onChange={e => updateItem(item.id, { marks2: e.target.value })} maxLength={35} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Gross Weight kg (Field 35)</Label>
                          <Input
                            type="number"
                            value={item.grossWeight}
                            onChange={e => updateItem(item.id, { grossWeight: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Net Weight kg (Field 38)</Label>
                          <Input
                            type="number"
                            value={item.netWeight}
                            onChange={e => updateItem(item.id, { netWeight: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                          <Label>Invoice Amount (Field 42)</Label>
                          <Input
                            type="number"
                            value={item.invoiceAmount}
                            onChange={e => updateItem(item.id, { invoiceAmount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Input
                            value={item.invoiceCurrencyCode}
                            onChange={e => updateItem(item.id, { invoiceCurrencyCode: e.target.value.toUpperCase().slice(0, 3) })}
                            maxLength={3}
                            placeholder="USD"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Origin Country (Field 34)</Label>
                          <Select value={item.countryOfOriginCode} onValueChange={v => updateItem(item.id, { countryOfOriginCode: v })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {countries.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>W.M. Code (Field 43)</Label>
                          <Select
                            value={item.valuationMethodCode || '1'}
                            onValueChange={v => updateItem(item.id, { valuationMethodCode: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 — Transaction value</SelectItem>
                              <SelectItem value="2">2 — Identical goods</SelectItem>
                              <SelectItem value="3">3 — Similar goods</SelectItem>
                              <SelectItem value="4">4 — Deductive</SelectItem>
                              <SelectItem value="5">5 — Computed</SelectItem>
                              <SelectItem value="6">6 — Fall-back</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Row 2: Field 40 + Field 41 ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">

                    {/* Field 40 — Previous Document */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Field 40 — Summiere aangifte / Voorafgaand document
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>B/L or AWB number</Label>
                          <Input
                            value={item.previousDocumentSummaryDeclaration}
                            onChange={e => updateItem(item.id, { previousDocumentSummaryDeclaration: e.target.value })}
                            maxLength={26}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>S/L (subline)</Label>
                          <Input
                            value={item.previousDocumentSummaryDeclarationSubline}
                            onChange={e => updateItem(item.id, { previousDocumentSummaryDeclarationSubline: e.target.value })}
                            maxLength={4}
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Field 41 — Aanvullende eenheden */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Field 41 — Aanvullende eenheden
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSu(item.id, item.supplementaryUnits)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Unit
                        </Button>
                      </div>
                      {item.supplementaryUnits.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No supplementary units.</p>
                      ) : (
                        <div className="space-y-2">
                          {item.supplementaryUnits.map((su, idx) => (
                            <div key={su.id} className="flex gap-2 items-end">
                              <div className="space-y-1 w-24">
                                <Label className="text-xs">Code (AN3)</Label>
                                <Input
                                  value={su.code}
                                  maxLength={3}
                                  onChange={e => updateSu(item.id, item.supplementaryUnits, idx, 'code', e.target.value.toUpperCase())}
                                  placeholder="PCE"
                                />
                              </div>
                              <div className="space-y-1 flex-1">
                                <Label className="text-xs">Quantity</Label>
                                <Input
                                  type="number"
                                  value={su.quantity}
                                  onChange={e => updateSu(item.id, item.supplementaryUnits, idx, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => removeSu(item.id, item.supplementaryUnits, su.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Row 3: Field 44 — Bijzondere vermeldingen ── */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Field 44 — Bijzondere vermeldingen / Vergunning- en andere documentnummer
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Supporting documents, certificates, permits
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addDoc(item.id, item.attachedDocuments || [])}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Document
                      </Button>
                    </div>

                    {(!item.attachedDocuments || item.attachedDocuments.length === 0) ? (
                      <p className="text-sm text-muted-foreground italic">No documents attached.</p>
                    ) : (
                      <div className="space-y-2">
                        {/* Header row */}
                        <div className="grid grid-cols-12 gap-2 px-1">
                          <div className="col-span-1"><Label className="text-xs">Code</Label></div>
                          <div className="col-span-4"><Label className="text-xs">Name / Description</Label></div>
                          <div className="col-span-4"><Label className="text-xs">Reference number</Label></div>
                          <div className="col-span-2"><Label className="text-xs">Date</Label></div>
                          <div className="col-span-1"></div>
                        </div>
                        {(item.attachedDocuments || []).map((doc, idx) => (
                          <div key={doc.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1">
                              <Input
                                value={doc.documentCode}
                                maxLength={4}
                                onChange={e => updateDoc(item.id, item.attachedDocuments, idx, 'documentCode', e.target.value.toUpperCase())}
                                placeholder="INV"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={doc.documentName}
                                maxLength={70}
                                onChange={e => updateDoc(item.id, item.attachedDocuments, idx, 'documentName', e.target.value)}
                                placeholder="Commercial Invoice"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={doc.referenceNumber}
                                maxLength={30}
                                onChange={e => updateDoc(item.id, item.attachedDocuments, idx, 'referenceNumber', e.target.value)}
                                placeholder="INV-2026-001"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="date"
                                value={doc.documentDate || ''}
                                onChange={e => updateDoc(item.id, item.attachedDocuments, idx, 'documentDate', e.target.value)}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => removeDoc(item.id, item.attachedDocuments, doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </CardContent>
              )}
            </Card>
          );
        })}

        {declaration.items.length === 0 && (
          <div className="text-center p-12 border rounded-xl bg-card border-dashed">
            <p className="text-muted-foreground">No items added yet.</p>
            <Button variant="outline" className="mt-4" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" /> Add First Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
