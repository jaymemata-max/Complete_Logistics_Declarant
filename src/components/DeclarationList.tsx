import React, { useState, useEffect } from 'react';
import { useDeclaration } from '../store/DeclarationContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { listDeclarations, listTemplates, loadDeclaration } from '../lib/db';
import type { DeclarationSummary } from '../lib/db';
import type { Template, Declaration, DeclarationHeader } from '../types';
import { Plus, Search, FileText, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT:       'bg-yellow-100 text-yellow-800',
  SUBMITTED:   'bg-blue-100 text-blue-800',
  REGISTERED:  'bg-green-100 text-green-800',
  REJECTED:    'bg-red-100 text-red-800',
};

const SHIPMENT_COLORS: Record<string, string> = {
  LCL:     'bg-purple-100 text-purple-800',
  FCL:     'bg-indigo-100 text-indigo-800',
  Air:     'bg-sky-100 text-sky-800',
  Alcohol: 'bg-orange-100 text-orange-800',
};

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

interface DeclarationListProps {
  onOpenInvoices: () => void;
}

export const DeclarationList: React.FC<DeclarationListProps> = ({ onOpenInvoices }) => {
  const { setDeclaration } = useDeclaration();
  const [declarations, setDeclarations] = useState<DeclarationSummary[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingDecl, setLoadingDecl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listDeclarations().then(setDeclarations),
      listTemplates().then(setTemplates),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = declarations.filter(d => {
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

  const handleNewFromTemplate = (template: Template) => {
    setDeclaration(blankDeclaration(template));
    setShowTemplates(false);
  };

  const statusCounts = {
    ALL: declarations.length,
    DRAFT: declarations.filter(d => d.status === 'DRAFT').length,
    SUBMITTED: declarations.filter(d => d.status === 'SUBMITTED').length,
    REGISTERED: declarations.filter(d => d.status === 'REGISTERED').length,
    REJECTED: declarations.filter(d => d.status === 'REJECTED').length,
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('nl-AW', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '—';
    return `${currency || 'USD'} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md">
        <div className="flex items-center gap-2 ml-2">
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white tracking-tight text-xl">Complete Logistics</span>
            <span className="font-medium text-secondary tracking-widest text-xs uppercase mt-1">Declarant</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/20 text-white bg-transparent hover:bg-primary-foreground/10"
            onClick={onOpenInvoices}
          >
            Invoices
          </Button>
          <Button
            size="sm"
            className="bg-white text-primary hover:bg-gray-100 shadow-sm font-semibold"
            onClick={() => setShowTemplates(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> New Declaration
          </Button>
        </div>
      </header>

      {/* Template picker modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold mb-1">New Declaration</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose a template to start from</p>
            <div className="space-y-2">
              {templates.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleNewFromTemplate(t)}
                >
                  <div>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.code}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${SHIPMENT_COLORS[t.headerSnapshot.shipmentType] || 'bg-gray-100 text-gray-800'}`}>
                    {t.headerSnapshot.shipmentType}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setShowTemplates(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">

          {/* Title + search */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Declarations</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{declarations.length} total</p>
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setLoading(true);
                  listDeclarations().then(setDeclarations).finally(() => setLoading(false));
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-border">
            {(['ALL', 'DRAFT', 'SUBMITTED', 'REGISTERED', 'REJECTED'] as const).map(s => (
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
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {statusCounts[s]}
                </span>
              </button>
            ))}
          </div>

          {/* Table — matching VD column layout */}
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
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground w-20">Colli</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground w-32">Factuurwaarde</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">Aangemaakt</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">Verzonden</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          {search || statusFilter !== 'ALL'
                            ? 'No declarations match your search.'
                            : 'No declarations yet. Click New Declaration to start.'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map(d => (
                    <tr
                      key={d.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleOpenDeclaration(d.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                        {loadingDecl === d.id ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          d.declarationId || <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                        {d.consigneeName || <span className="text-muted-foreground italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${SHIPMENT_COLORS[d.shipmentType] || 'bg-gray-100 text-gray-800'}`}>
                          {d.shipmentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                        {d.referenceNumber || d.manifestReferenceNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                        {d.transportIdentity || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {d.totalNumberOfPackages || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {formatAmount(d.invoiceAmount, d.invoiceCurrencyCode)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(d.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-800'}`}>
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
      </main>
    </div>
  );
};
