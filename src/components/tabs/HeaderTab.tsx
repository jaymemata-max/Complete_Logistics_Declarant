import React, { useState, useEffect, useRef } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import type { Importer, Vessel } from '../../types';

// ── Generic searchable dropdown ───────────────────────────────────────────────

interface SearchDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  onSearch: (q: string) => Promise<{ label: string; sub?: string; value: string }[]>;
  onSelect: (value: string, label: string, raw: any) => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  label, value, placeholder, onSearch, onSelect
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<{ label: string; sub?: string; value: string; raw: any }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const handleInput = (q: string) => {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const res = await onSearch(q);
      setResults(res as any);
      setOpen(res.length > 0);
      setLoading(false);
    }, 250);
  };

  const handleSelect = (item: any) => {
    setQuery(item.label);
    setOpen(false);
    onSelect(item.value, item.label, item.raw);
  };

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={e => handleInput(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {loading && (
        <div className="absolute top-full left-0 right-0 bg-card border rounded-lg p-2 text-sm text-muted-foreground z-50">
          Searching...
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-card border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map(item => (
            <div
              key={item.value}
              className="px-3 py-2 hover:bg-muted cursor-pointer"
              onMouseDown={() => handleSelect(item)}
            >
              <div className="font-medium text-sm">{item.label}</div>
              {item.sub && <div className="text-xs text-muted-foreground">{item.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Supabase search functions ─────────────────────────────────────────────────

async function searchImporters(q: string) {
  const { data } = await supabase
    .from('importers')
    .select('asycuda_code, name, address1, default_duty_terms')
    .or(`name.ilike.%${q}%,asycuda_code.ilike.%${q}%`)
    .limit(10);
  return (data || []).map((r: any) => ({
    value: r.asycuda_code,
    label: r.name,
    sub: `${r.asycuda_code}${r.address1 ? ' · ' + r.address1 : ''}`,
    raw: r,
  }));
}

async function searchVessels(q: string) {
  const { data } = await supabase
    .from('vessels')
    .select('id, name, nationality, typical_voyage_from')
    .ilike('name', `%${q}%`)
    .limit(10);
  return (data || []).map((r: any) => ({
    value: r.name,
    label: r.name,
    sub: `${r.nationality || ''}${r.typical_voyage_from ? ' · from ' + r.typical_voyage_from : ''}`,
    raw: r,
  }));
}

// ── HeaderTab ─────────────────────────────────────────────────────────────────

export const HeaderTab: React.FC = () => {
  const { declaration, updateHeader } = useDeclaration();
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [offices, setOffices] = useState<{ code: string; place: string }[]>([]);
  const [locations, setLocations] = useState<{ code: string; place: string }[]>([]);
  const [entrepots, setEntrepots] = useState<{ code: string; description: string }[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<{ code: string; description: string }[]>([]);
  const [loadingPorts, setLoadingPorts] = useState<{ code: string; description: string }[]>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<{ code: string; description: string }[]>([]);

  useEffect(() => {
    // Load all small reference tables on mount
    Promise.all([
      supabase.from('countries').select('code, name').order('code').then(r => setCountries(r.data || [])),
      supabase.from('locations_of_goods').select('code, place').order('code').then(r => setLocations(r.data || [])),
      supabase.from('entrepots').select('code, description').order('code').then(r => setEntrepots(r.data || [])),
      supabase.from('payment_accounts').select('code, description').order('code').then(r => setPaymentAccounts(r.data || [])),
      supabase.from('delivery_terms').select('code, description').order('code').then(r => setDeliveryTerms(r.data || [])),
      // Port of loading — filter to Aruba ports only (AWXXX)
      supabase.from('ports').select('code, description').ilike('code', 'AW%').order('code').then(r => setLoadingPorts(r.data || [])),
      // Offices — from locations_of_goods or a fixed list for now
    ]);
  }, []);

  if (!declaration) return null;
  const { header } = declaration;
  const h = (field: keyof typeof header, value: any) => updateHeader({ [field]: value });

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic details of the declaration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Declaration Type</Label>
                <Select value={header.typeOfDeclaration} onValueChange={v => h('typeOfDeclaration', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IM">IM - Import</SelectItem>
                    <SelectItem value="EX">EX - Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Procedure Code</Label>
                <Input value={header.generalProcedureCode} onChange={e => h('generalProcedureCode', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Manifest Reference Number</Label>
              <Input value={header.manifestReferenceNumber} onChange={e => h('manifestReferenceNumber', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Packages</Label>
                <Input type="number" value={header.totalNumberOfPackages} onChange={e => h('totalNumberOfPackages', parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Clearance Office</Label>
                <Select value={header.customsClearanceOfficeCode} onValueChange={v => h('customsClearanceOfficeCode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HK02">HK02 - Harbour</SelectItem>
                    <SelectItem value="LV01">LV01 - Airport</SelectItem>
                    <SelectItem value="HI01">HI01 - Harbour Import</SelectItem>
                    <SelectItem value="OR01">OR01 - Oranjestad</SelectItem>
                    <SelectItem value="SN01">SN01 - San Nicolas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="containerFlag"
                checked={header.containerFlag}
                onChange={e => h('containerFlag', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="containerFlag" className="font-normal">Shipment uses containers</Label>
            </div>
          </CardContent>
        </Card>

        {/* Traders */}
        <Card>
          <CardHeader>
            <CardTitle>Traders</CardTitle>
            <CardDescription>Consignee and Declarant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchDropdown
              label="Consignee"
              value={header.consigneeName}
              placeholder="Search by name or ASYCUDA code..."
              onSearch={searchImporters}
              onSelect={(code, name, raw) => updateHeader({
                consigneeCode: code,
                consigneeName: name,
                ...(raw.default_duty_terms && header.deliveryTermsCode === ''
                  ? { deliveryTermsCode: raw.default_duty_terms }
                  : {}),
              })}
            />
            {header.consigneeCode && (
              <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded">
                ASYCUDA code: <span className="font-mono font-medium">{header.consigneeCode}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Declarant Code</Label>
                <Input value={header.declarantCode} onChange={e => h('declarantCode', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Declarant Name</Label>
                <Input value={header.declarantName} onChange={e => h('declarantName', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reference Year</Label>
                <Input value={header.referenceYear} onChange={e => h('referenceYear', e.target.value)} maxLength={4} />
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input value={header.referenceNumber} onChange={e => h('referenceNumber', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geography */}
        <Card>
          <CardHeader>
            <CardTitle>Geography</CardTitle>
            <CardDescription>Countries and routing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                ['Export Country', 'exportCountryCode'],
                ['Destination', 'destinationCountryCode'],
                ['Trading Country', 'tradingCountry'],
              ].map(([lbl, field]) => (
                <div key={field} className="space-y-2">
                  <Label>{lbl}</Label>
                  <Select value={(header as any)[field]} onValueChange={v => h(field as any, v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country First Destination</Label>
                <Select value={header.countryFirstDestination} onValueChange={v => h('countryFirstDestination', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Place of Loading</Label>
                <Select value={header.placeOfLoadingCode} onValueChange={v => h('placeOfLoadingCode', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {loadingPorts.map(p => (
                      <SelectItem key={p.code} value={p.code}>{p.code} — {p.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transport */}
        <Card>
          <CardHeader>
            <CardTitle>Transport</CardTitle>
            <CardDescription>Vessel / aircraft and delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchDropdown
              label="Transport Identity (Field 18)"
              value={header.transportIdentity}
              placeholder="Search vessel name..."
              onSearch={searchVessels}
              onSelect={(name, _, raw: Vessel) => updateHeader({
                transportIdentity: raw.name,
                transportNationality: raw.nationality || '',
                borderTransportIdentity: raw.name,
                borderTransportNationality: raw.nationality || '',
                ...(raw.typicalVoyageFrom && !header.placeOfLoadingCode
                  ? { placeOfLoadingCode: raw.typicalVoyageFrom }
                  : {}),
              })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transport Nationality</Label>
                <Select value={header.transportNationality} onValueChange={v => h('transportNationality', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Border Transport Mode</Label>
                <Select value={header.borderTransportMode} onValueChange={v => h('borderTransportMode', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Sea</SelectItem>
                    <SelectItem value="4">4 — Air</SelectItem>
                    <SelectItem value="3">3 — Road</SelectItem>
                    <SelectItem value="2">2 — Rail</SelectItem>
                    <SelectItem value="8">8 — Inland waterway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Border Office Code</Label>
                <Select value={header.borderOfficeCode} onValueChange={v => h('borderOfficeCode', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HI01">HI01 - Harbour Import</SelectItem>
                    <SelectItem value="HI02">HI02 - Harbour Import 2</SelectItem>
                    <SelectItem value="LV01">LV01 - Airport</SelectItem>
                    <SelectItem value="OR01">OR01 - Oranjestad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Terms</Label>
                <Select value={header.deliveryTermsCode} onValueChange={v => h('deliveryTermsCode', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {deliveryTerms.map(d => (
                      <SelectItem key={d.code} value={d.code}>{d.code} — {d.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivery Terms Place</Label>
              <Input value={header.deliveryTermsPlace} onChange={e => h('deliveryTermsPlace', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Location of Goods */}
        <Card>
          <CardHeader>
            <CardTitle>Location of Goods</CardTitle>
            <CardDescription>Fields 30 and 30a</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Field 30 — Plaats van de goederen</Label>
              <Select value={header.locationOfGoods} onValueChange={v => h('locationOfGoods', v)}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.code} — {l.place}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Field 30a — Aanvullende plaats van de goederen</Label>
              <Input
                value={header.locationOfGoodsAddress}
                onChange={e => h('locationOfGoodsAddress', e.target.value.slice(0, 60))}
                placeholder="Additional location details (max 60 chars)"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {header.locationOfGoodsAddress?.length || 0}/60
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Financial</CardTitle>
            <CardDescription>Values, costs and payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ['Invoice', 'invoiceAmount', 'invoiceCurrencyCode'],
              ['External Freight', 'externalFreightAmount', 'externalFreightCurrencyCode'],
              ['Insurance', 'insuranceAmount', 'insuranceCurrencyCode'],
              ['Other Cost', 'otherCostAmount', 'otherCostCurrencyCode'],
              ['Deduction', 'deductionAmount', 'deductionCurrencyCode'],
            ].map(([label, amtField, currField]) => (
              <div key={amtField} className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    value={(header as any)[amtField]}
                    onChange={e => h(amtField as any, parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Currency</Label>
                  <Input
                    value={(header as any)[currField]}
                    onChange={e => h(currField as any, e.target.value.toUpperCase().slice(0, 3))}
                    maxLength={3}
                    placeholder="USD"
                  />
                </div>
              </div>
            ))}
            <div className="space-y-2 pt-2 border-t">
              <Label>Gross Weight (kg)</Label>
              <Input type="number" value={header.grossWeight} onChange={e => h('grossWeight', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field 48 — Rekeninghoudernummer</Label>
                <Select value={header.deferredPaymentReference} onValueChange={v => h('deferredPaymentReference', v)}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {paymentAccounts.map(a => (
                      <SelectItem key={a.code} value={a.code}>{a.code} — {a.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Field 49 — Identificatie entrepot</Label>
                <Select value={header.warehouseIdentification} onValueChange={v => h('warehouseIdentification', v)}>
                  <SelectTrigger><SelectValue placeholder="Select entrepot" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {entrepots.map(e => (
                      <SelectItem key={e.code} value={e.code}>{e.code} — {e.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Financial Transaction Code 1</Label>
                <Input value={header.financialTransactionCode1} onChange={e => h('financialTransactionCode1', e.target.value)} maxLength={1} />
              </div>
              <div className="space-y-2">
                <Label>Financial Transaction Code 2</Label>
                <Input value={header.financialTransactionCode2} onChange={e => h('financialTransactionCode2', e.target.value)} maxLength={1} />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
