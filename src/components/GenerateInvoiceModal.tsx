import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createInvoice } from '../lib/db';
import type { InvoiceLine } from '../lib/db';
import { X, Plus, Trash2, FileText } from 'lucide-react';

interface Props {
  declarationId: string;
  consigneeName: string;
  declarationDisplay: string;
  onCreated: (invoiceId: string) => void;
  onClose: () => void;
}

const DEFAULT_LINES = [
  { description: 'Brokerage fee / Aangifte kosten', quantity: 1, unitPrice: 125.00, amount: 125.00 },
  { description: 'Handling fee', quantity: 1, unitPrice: 25.00, amount: 25.00 },
];

export const GenerateInvoiceModal: React.FC<Props> = ({
  declarationId, consigneeName, declarationDisplay, onCreated, onClose
}) => {
  const [lines, setLines] = useState<(Omit<InvoiceLine, 'id'> & { tempId: string })[]>(
    DEFAULT_LINES.map((l, i) => ({ ...l, tempId: String(i) }))
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  const total = lines.reduce((s, l) => s + l.amount, 0);

  const updateLine = (tempId: string, field: keyof Omit<InvoiceLine, 'id'>, val: any) => {
    setLines(prev => prev.map(l => {
      if (l.tempId !== tempId) return l;
      const updated = { ...l, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.amount = (field === 'quantity' ? val : l.quantity) *
                         (field === 'unitPrice' ? val : l.unitPrice);
      }
      return updated;
    }));
  };

  const addLine = () => {
    setLines(prev => [...prev, {
      tempId: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    }]);
  };

  const removeLine = (tempId: string) => {
    setLines(prev => prev.filter(l => l.tempId !== tempId));
  };

  const handleCreate = async () => {
    if (lines.length === 0) return;
    setSaving(true);
    const invoiceLines = lines.map(({ tempId, ...l }) => l);
    const id = await createInvoice(declarationId, invoiceLines, dueDate);
    setSaving(false);
    if (id) onCreated(id);
  };

  const fmt = (n: number) => `USD ${n.toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Generate Invoice</h2>
              <p className="text-sm text-muted-foreground">
                {consigneeName} — {declarationDisplay}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Due date */}
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-48" />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {lines.map(line => (
              <div key={line.tempId} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    value={line.description}
                    onChange={e => updateLine(line.tempId, 'description', e.target.value)}
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={line.quantity}
                    onChange={e => updateLine(line.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={line.unitPrice}
                    onChange={e => updateLine(line.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="text-right"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2 text-right font-medium text-sm pr-2">
                  {fmt(line.amount)}
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeLine(line.tempId)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addLine} className="w-full mt-1">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Line
            </Button>
          </div>

          {/* Total */}
          <div className="flex justify-end border-t pt-3">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold text-primary">{fmt(total)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || lines.length === 0}>
            {saving ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
};
