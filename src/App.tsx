/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DeclarationProvider, useDeclaration } from './store/DeclarationContext';
import { DeclarationList } from './components/DeclarationList';
import { DeclarationWorkspace } from './components/DeclarationWorkspace';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceWorkspace } from './components/InvoiceWorkspace';

const AppContent: React.FC = () => {
  const { declaration } = useDeclaration();
  const [view, setView] = useState<'declarations' | 'invoices' | 'invoice-detail'>('declarations');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  if (declaration) return <DeclarationWorkspace />;

  if (view === 'invoice-detail' && selectedInvoiceId) {
    return (
      <InvoiceWorkspace
        invoiceId={selectedInvoiceId}
        onBack={() => setView('invoices')}
        onDeleted={() => { setSelectedInvoiceId(null); setView('invoices'); }}
      />
    );
  }

  if (view === 'invoices') {
    return (
      <InvoiceList
        onBack={() => setView('declarations')}
        onOpenInvoice={(id) => { setSelectedInvoiceId(id); setView('invoice-detail'); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <DeclarationList onOpenInvoices={() => setView('invoices')} />
    </div>
  );
};

export default function App() {
  return (
    <DeclarationProvider>
      <AppContent />
    </DeclarationProvider>
  );
}
