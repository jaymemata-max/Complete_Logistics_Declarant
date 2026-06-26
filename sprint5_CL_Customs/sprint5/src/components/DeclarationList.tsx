import React, { useState, useEffect, useRef } from 'react';
import { useDeclaration } from '../store/DeclarationContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { listDeclarations, listTemplates, loadDeclaration } from '../lib/db';
import type { DeclarationSummary } from '../lib/db';
import type { Template, Declaration, DeclarationHeader } from '../types';
import { Plus, Search, RefreshCw, FileText, List, Receipt } from 'lucide-react';

// ── Colours ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT:      'bg-yellow-100 text-yellow-800',
  SUBMITTED:  'bg-blue-100 text-blue-800',
  REGISTERED: 'bg-green-100 text-green-800',
  REJECTED:   'bg-red-100 text-red-800',
};

const STATUS_BAR_COLORS: Record<string, string> = {
  DRAFT:      '#EAB308',
  SUBMITTED:  '#3B82F6',
  REGISTERED: '#22C55E',
  REJECTED:   '#EF4444',
};

const SHIPMENT_COLORS: Record<string, string> = {
  LCL:     'bg-purple-100 text-purple-800',
  FCL:     'bg-indigo-100 text-indigo-800',
  Air:     'bg-sky-100 text-sky-800',
  Alcohol: 'bg-orange-100 text-orange-800',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId() {
  return 'local-' + Math.random().toString(36).substring(2, 9);
}

function blankDeclaration(template: Template): Declaration {
  const header: DeclarationHeader = {
    ...template.headerSnapshot,
    declarationId: '',
    consigneeCode: '',
    consigneeName: '',
    manifestReferenceNumber: '',
    referenceYear: new Date().getFullYear().toString(),
    referenceNumber: '',
    invoiceAmount: 0,
    externalFreightAmount: 0,
    insuranceAmount: 0,
    otherCostAmount: 0,
    deductionAmount: 0,
    grossWeight: 0,
    totalNumberOfPackages: 0,
  };
  return {
    id: generateId(),
    status: 'DRAFT',
    shipmentType: template.headerSnapshot.shipmentType,
    header,
    items: [],
    containers: [],
    vehicles: [],
  };
}

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

function filterByPeriod(declarations: DeclarationSummary[], period: Period): DeclarationSummary[] {
  if (period === 'all') return declarations;
  const now = new Date();
  const cutoff = new Date();
  if (period === 'day')     cutoff.setDate(now.getDate() - 1);
  if (period === 'week')    cutoff.setDate(now.getDate() - 7);
  if (period === 'month')   cutoff.setMonth(now.getMonth() - 1);
  if (period === 'quarter') cutoff.setMonth(now.getMonth() - 3);
  if (period === 'year')    cutoff.setFullYear(now.getFullYear() - 1);
  return declarations.filter(d => new Date(d.createdAt) >= cutoff);
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

const MiniBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-16">
      {data.map(d => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-semibold text-foreground">{d.value}</span>
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 40, d.value > 0 ? 4 : 0)}px`,
              backgroundColor: d.color,
              minHeight: d.value > 0 ? '4px' : '0',
            }}
          />
          <span className="text-xs text-muted-foreground truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onOpenInvoices: () => void;
}

export const DeclarationList: React.FC<Props> = ({ onOpenInvoices }) => {
  const { setDeclaration } = useDeclaration();
  const [declarations, setDeclarations] = useState<DeclarationSummary[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingDecl, setLoadingDecl] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('year');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      listDeclarations().then(setDeclarations),
      listTemplates().then(setTemplates),
    ]).finally(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    Promise.all([
      listDeclarations().then(setDeclarations),
      listTemplates().then(setTemplates),
    ]).finally(() => setLoading(false));
  };

  // Dashboard data
  const periodDecls = filterByPeriod(declarations, period);
  const statusCounts = {
    DRAFT:      periodDecls.filter(d => d.status === 'DRAFT').length,
    SUBMITTED:  periodDecls.filter(d => d.status === 'SUBMITTED').length,
    REGISTERED: periodDecls.filter(d => d.status === 'REGISTERED').length,
    REJECTED:   periodDecls.filter(d => d.status === 'REJECTED').length,
  };
  const totalPeriod = periodDecls.length;
  const chartData = [
    { label: 'Draft',      value: statusCounts.DRAFT,      color: STATUS_BAR_COLORS.DRAFT },
    { label: 'Submitted',  value: statusCounts.SUBMITTED,  color: STATUS_BAR_COLORS.SUBMITTED },
    { label: 'Registered', value: statusCounts.REGISTERED, color: STATUS_BAR_COLORS.REGISTERED },
    { label: 'Rejected',   value: statusCounts.REJECTED,   color: STATUS_BAR_COLORS.REJECTED },
  ];

  // All-declarations list (filtered)
  const allFiltered = declarations.filter(d => {
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.consigneeName?.toLowerCase().includes(q) ||
      d.declarationId?.toLowerCase().includes(q) ||
      d.referenceNumber?.toLowerCase().includes(q) ||
      d.manifestReferenceNumber?.toLowerCase().includes(q) ||
      d.transportIdentity?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleOpenDeclaration = async (id: string) => {
    setLoadingDecl(id);
    const decl = await loadDeclaration(id);
    if (decl) setDeclaration(decl);
    setLoadingDecl(null);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('nl-AW', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '—';
    return `${currency || 'USD'} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const PERIODS: { value: Period; label: string }[] = [
    { value: 'day',     label: 'Today' },
    { value: 'week',    label: 'Week' },
    { value: 'month',   label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year',    label: 'Year' },
    { value: 'all',     label: 'All time' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md">
        {/* Logo — clickable, goes to home (no-op since we're already here, but sets declaration to null) */}
        <button
          className="flex flex-col leading-none text-left hover:opacity-80 transition-opacity"
          onClick={() => setDeclaration(null)}
        >
          <span className="font-bold text-white tracking-tight text-xl">Complete Logistics</span>
          <span className="font-black text-secondary tracking-widest text-xs uppercase mt-1" style={{ fontWeight: 900, letterSpacing: '0.15em' }}>
            DECLARANT
          </span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10"
            onClick={onOpenInvoices}
          >
            <Receipt className="h-4 w-4 mr-2" /> Invoices
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10"
            onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <List className="h-4 w-4 mr-2" /> All Declarations
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Dashboard ─────────────────────────────────────────────────── */}
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-base">Declaration Overview</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalPeriod} declaration{totalPeriod !== 1 ? 's' : ''} in selected period
                </p>
              </div>
              {/* Period selector */}
              <div className="flex border rounded-lg overflow-hidden text-xs">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      period === p.value
                        ? 'bg-primary text-white'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 items-end">
              {/* Status cards */}
              <div className="col-span-3 grid grid-cols-4 gap-3">
                {chartData.map(d => (
                  <div key={d.label} className="bg-muted/40 rounded-lg p-3 text-center">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: d.color }}
                    >
                      {d.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{d.label}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="col-span-2 pl-4 border-l">
                <MiniBarChart data={chartData} />
              </div>
            </div>
          </div>

          {/* ── New Declaration — always visible template cards ────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base">New Declaration</h2>
              <span className="text-xs text-muted-foreground">Choose a type to start</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.length === 0 ? (
                // Fallback skeleton while loading
                [1,2,3,4].map(i => (
                  <div key={i} className="border border-border rounded-xl p-5 bg-card animate-pulse h-24" />
                ))
              ) : templates.map(t => (
                <button
                  key={t.id}
                  className="border border-border rounded-xl p-5 bg-card text-left hover:shadow-md hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
                  onClick={() => setDeclaration(blankDeclaration(t))}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_COLORS[t.headerSnapshot.shipmentType] || 'bg-gray-100 text-gray-800'}`}>
                      {t.headerSnapshot.shipmentType}
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="font-semibold text-sm mt-2 group-hover:text-primary transition-colors">
                    {t.description}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.code}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── All Declarations list ──────────────────────────────────────── */}
          <div ref={listRef}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-base">Declarations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{declarations.length} total</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 w-64"
                    placeholder="Search consignee, reference, vessel..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={reload}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-1 mb-3 border-b border-border">
              {(['ALL', 'DRAFT', 'SUBMITTED', 'REGISTERED', 'REJECTED'] as const).map(s => {
                const count = s === 'ALL'
                  ? declarations.length
                  : declarations.filter(d => d.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      statusFilter === s
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                    <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Aangifte Nr.</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Importeur</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referentie</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vervoermiddel</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground w-16">Colli</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground w-32">Factuurwaarde</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Aangemaakt</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Verzonden</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Loading...</td>
                      </tr>
                    ) : allFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center">
                          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-muted-foreground">
                            {search || statusFilter !== 'ALL'
                              ? 'No declarations match your search.'
                              : 'No declarations yet. Use the templates above to create your first one.'}
                          </p>
                        </td>
                      </tr>
                    ) : allFiltered.map(d => (
                      <tr
                        key={d.id}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => handleOpenDeclaration(d.id)}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {loadingDecl === d.id
                            ? <span className="text-muted-foreground">Loading...</span>
                            : d.declarationId || <span className="text-muted-foreground italic">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                          {d.consigneeName || <span className="text-muted-foreground italic">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPMENT_COLORS[d.shipmentType] || 'bg-gray-100 text-gray-800'}`}>
                            {d.shipmentType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                          {d.referenceNumber || d.manifestReferenceNumber || '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[120px] truncate">
                          {d.transportIdentity || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {d.totalNumberOfPackages || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {formatAmount(d.invoiceAmount, d.invoiceCurrencyCode)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(d.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(d.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-800'}`}>
                            {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
