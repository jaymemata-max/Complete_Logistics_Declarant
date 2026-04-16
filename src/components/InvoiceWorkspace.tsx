import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { loadInvoice, markInvoicePaid, deleteInvoice } from '../lib/db';
import type { InvoiceDetail, InvoiceLine } from '../lib/db';
import { ArrowLeft, Printer, CheckCircle2, Trash2, Plus } from 'lucide-react';

interface Props {
  invoiceId: string;
  onBack: () => void;
  onDeleted: () => void;
}

export const InvoiceWorkspace: React.FC<Props> = ({ invoiceId, onBack, onDeleted }) => {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice(invoiceId).then(inv => {
      setInvoice(inv);
      setLoading(false);
    });
  }, [invoiceId]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-muted-foreground">Loading invoice...</div>
  );

  if (!invoice) return (
    <div className="flex items-center justify-center h-screen text-muted-foreground">Invoice not found.</div>
  );

  const fmt = (n: number) => `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('nl-AW', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handlePrint = () => window.print();

  const handleTogglePaid = async () => {
    await markInvoicePaid(invoice.id, !invoice.paid);
    setInvoice(prev => prev ? { ...prev, paid: !prev.paid } : null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    await deleteInvoice(invoice.id);
    onDeleted();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header — hidden when printing */}
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <span className="font-bold text-white text-lg">Invoice</span>
            <span className="text-primary-foreground/70 ml-2 text-sm">{invoice.declarationDisplay}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/20 text-white bg-transparent hover:bg-primary-foreground/10"
            onClick={handleTogglePaid}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {invoice.paid ? 'Mark Outstanding' : 'Mark Paid'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/20 text-white bg-transparent hover:bg-primary-foreground/10"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground/60 hover:text-red-300 hover:bg-primary-foreground/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Invoice document */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
        <div className="max-w-3xl mx-auto bg-card border rounded-xl shadow-sm p-8 print:shadow-none print:border-none print:rounded-none" id="invoice-document">

          {/* Letterhead */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-2xl font-bold text-primary">Complete Logistics</div>
              <div className="text-sm text-muted-foreground mt-1">Customs Declarant — Aruba</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-muted-foreground/40">INVOICE</div>
              <div className="mt-2 space-y-1 text-sm">
                <div><span className="text-muted-foreground">Date:</span> <strong>{fmtDate(invoice.invoiceDate)}</strong></div>
                {invoice.dueDate && (
                  <div><span className="text-muted-foreground">Due:</span> <strong>{fmtDate(invoice.dueDate)}</strong></div>
                )}
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${invoice.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {invoice.paid ? 'PAID' : 'OUTSTANDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="mb-8 p-4 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bill to</div>
            <div className="font-semibold">{invoice.consigneeName || '—'}</div>
            {invoice.declarationDisplay && (
              <div className="text-sm text-muted-foreground mt-1">
                Declaration: <span className="font-mono">{invoice.declarationDisplay}</span>
              </div>
            )}
          </div>

          {/* Line items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-16">Qty</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-32">Unit Price</th>
                <th className="text-right py-2 font-medium text-muted-foreground w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map(line => (
                <tr key={line.id} className="border-b border-border/50">
                  <td className="py-3">{line.description}</td>
                  <td className="py-3 text-right">{line.quantity}</td>
                  <td className="py-3 text-right">{fmt(line.unitPrice)}</td>
                  <td className="py-3 text-right font-medium">{fmt(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                <span>Subtotal</span>
                <span>{fmt(invoice.lines.reduce((s, l) => s + l.amount, 0))}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t text-xs text-muted-foreground text-center">
            Complete Logistics — Customs Declarant — Aruba
          </div>
        </div>
      </div>
    </div>
  );
};
