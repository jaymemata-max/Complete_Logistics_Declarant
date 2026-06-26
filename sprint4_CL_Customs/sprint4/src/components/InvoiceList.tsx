import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { listInvoices, markInvoicePaid, deleteInvoice } from '../lib/db';
import type { InvoiceSummary } from '../lib/db';
import { ArrowLeft, Search, RefreshCw, FileText, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  onBack: () => void;
  onOpenInvoice: (id: string) => void;
}

export const InvoiceList: React.FC<Props> = ({ onBack, onOpenInvoice }) => {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  const load = () => {
    setLoading(true);
    listInvoices().then(setInvoices).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(inv => {
    const matchFilter = filter === 'ALL' || (filter === 'PAID' ? inv.paid : !inv.paid);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      inv.consigneeName?.toLowerCase().includes(q) ||
      inv.declarationDisplay?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalUnpaid = invoices.filter(i => !i.paid).reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter(i => i.paid).reduce((s, i) => s + i.total, 0);

  const fmt = (n: number) => `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('nl-AW', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white tracking-tight text-xl">Complete Logistics</span>
            <span className="font-medium text-secondary tracking-widest text-xs uppercase mt-1">Invoices</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-4">
              <div className="text-sm text-muted-foreground">Total invoices</div>
              <div className="text-2xl font-bold mt-1">{invoices.length}</div>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-yellow-500" /> Outstanding
              </div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{fmt(totalUnpaid)}</div>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Collected
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">{fmt(totalPaid)}</div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search consignee or declaration..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              {(['ALL', 'UNPAID', 'PAID'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Table */}
          <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Consignee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Declaration</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No invoices found.</p>
                      <p className="text-sm text-muted-foreground mt-1">Generate invoices from the declaration workspace.</p>
                    </td>
                  </tr>
                ) : filtered.map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => onOpenInvoice(inv.id)}>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-3 font-medium">{inv.consigneeName || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{inv.declarationDisplay || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.dueDate ? fmtDate(inv.dueDate) : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmt(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.paid ? 'Paid' : 'Outstanding'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={async () => {
                          await markInvoicePaid(inv.id, !inv.paid);
                          load();
                        }}
                      >
                        {inv.paid ? 'Mark Unpaid' : 'Mark Paid'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
