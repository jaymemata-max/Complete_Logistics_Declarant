import React, { useState } from 'react';
import { useDeclaration } from '../store/DeclarationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Save, FileText, Package, LayoutGrid, FileCode2, SplitSquareHorizontal, BookTemplate, CheckCircle2, XCircle, Car } from 'lucide-react';
import { HeaderTab } from './tabs/HeaderTab';
import { ItemsTab } from './tabs/ItemsTab';
import { ContainersTab } from './tabs/ContainersTab';
import { VehicleTab } from './tabs/VehicleTab';
import { SplitTab } from './tabs/SplitTab';
import { XmlPreviewTab } from './tabs/XmlPreviewTab';
import { saveDeclaration, updateDeclarationStatus, saveTemplate } from '../lib/db';

const STATUS_COLORS: Record<string, string> = {
  DRAFT:       'bg-yellow-100 text-yellow-800',
  SUBMITTED:   'bg-blue-100 text-blue-800',
  REGISTERED:  'bg-green-100 text-green-800',
  REJECTED:    'bg-red-100 text-red-800',
};

export const DeclarationWorkspace: React.FC = () => {
  const { declaration, setDeclaration, updateHeader } = useDeclaration();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  if (!declaration) return null;

  const isReadOnly = declaration.status === 'REGISTERED';

  const showMessage = (type: 'ok' | 'err', text: string) => {
    setSaveMsg({ type, text });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const id = await saveDeclaration({ ...declaration, status: 'DRAFT' });
    if (id) {
      setDeclaration({ ...declaration, id, status: 'DRAFT' });
      showMessage('ok', 'Declaration saved');
    } else {
      showMessage('err', 'Save failed — check console');
    }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Mark this declaration as submitted? This means you have uploaded the XML to ASYCUDAWorld. The status will change to Submitted.')) return;
    setSubmitting(true);

    // First save if it has local ID
    let id = declaration.id;
    if (id.startsWith('local-')) {
      const savedId = await saveDeclaration(declaration);
      if (!savedId) {
        showMessage('err', 'Could not save before submitting');
        setSubmitting(false);
        return;
      }
      id = savedId;
    }

    const ok = await updateDeclarationStatus(id, 'SUBMITTED');
    if (ok) {
      setDeclaration({ ...declaration, id, status: 'SUBMITTED', submittedAt: new Date() });
      showMessage('ok', 'Declaration submitted');
    } else {
      showMessage('err', 'Submit failed — check console');
    }
    setSubmitting(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateCode.trim() || !templateDesc.trim()) return;
    setSavingTemplate(true);
    const ok = await saveTemplate(templateCode.trim().toUpperCase(), templateDesc.trim(), declaration.header);
    setSavingTemplate(false);
    if (ok) {
      setShowTemplateModal(false);
      setTemplateCode('');
      setTemplateDesc('');
      showMessage('ok', 'Template saved');
    } else {
      showMessage('err', 'Template save failed');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 pr-6 border-r border-primary-foreground/20">
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white tracking-tight text-lg">Complete Logistics</span>
              <span className="font-medium text-secondary tracking-widest text-xs uppercase mt-1">Declarant</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeclaration(null)}
            className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {declaration.header.declarationId || 'New Declaration'}
            </h1>
            <p className="text-xs text-primary-foreground/80 font-medium">
              {declaration.header.shipmentType} • {declaration.header.typeOfDeclaration}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save message toast */}
          {saveMsg && (
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
              saveMsg.type === 'ok' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}>
              {saveMsg.type === 'ok'
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <XCircle className="h-3.5 w-3.5" />
              }
              {saveMsg.text}
            </div>
          )}

          {/* Save as template — manager only */}
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10 text-xs"
              onClick={() => setShowTemplateModal(true)}
            >
              Save as Template
            </Button>
          )}

          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              className="border-primary-foreground/20 text-white bg-transparent hover:bg-primary-foreground/10"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}

          {(declaration.status === 'DRAFT' || declaration.status === 'REJECTED') && (
            <Button
              size="sm"
              className="bg-white text-primary hover:bg-gray-100 shadow-sm font-semibold"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Mark as Submitted'}
            </Button>
          )}

          {isReadOnly && (
            <span className="text-xs text-green-300 font-medium px-3 py-1.5 bg-green-500/20 rounded-full">
              Read only — Registered
            </span>
          )}
        </div>
      </header>

      {/* Summary strip */}
      <div className="bg-card border-b border-border px-6 py-2 flex items-center gap-8 text-sm shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[declaration.status] || 'bg-gray-100 text-gray-800'}`}>
            {declaration.status.charAt(0) + declaration.status.slice(1).toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Items:</span>
          <span className="font-medium">{declaration.items.length}</span>
        </div>
        {declaration.header.containerFlag && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Containers:</span>
            <span className="font-medium">{declaration.containers.length}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Gross Weight:</span>
          <span className="font-medium">{declaration.header.grossWeight || 0} kg</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Invoice Total:</span>
          <span className="font-medium">
            {declaration.header.invoiceCurrencyCode} {declaration.header.invoiceAmount?.toLocaleString() || 0}
          </span>
        </div>
        {declaration.customsReferenceNumber && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Customs Ref:</span>
            <span className="font-medium font-mono text-xs">{declaration.customsReferenceNumber}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="header" className="h-full flex flex-col">
          <div className="border-b border-border bg-card px-6 pt-0">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              {[
                { value: 'header', icon: FileText, label: 'Header' },
                { value: 'items', icon: Package, label: 'Items' },
                { value: 'vehicles', icon: Car, label: 'Vehicles' },
                { value: 'containers', icon: LayoutGrid, label: 'Containers' },
                { value: 'split', icon: SplitSquareHorizontal, label: 'Split / Degroupage' },
                { value: 'xml', icon: FileCode2, label: 'XML Preview' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Icon className="h-4 w-4" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <TabsContent value="header" className="mt-0">
                <HeaderTab />
              </TabsContent>
              <TabsContent value="items" className="mt-0">
                <ItemsTab />
              </TabsContent>
              <TabsContent value="vehicles" className="mt-0">
                <VehicleTab />
              </TabsContent>
              <TabsContent value="containers" className="mt-0">
                <ContainersTab />
              </TabsContent>
              <TabsContent value="split" className="mt-0">
                <SplitTab />
              </TabsContent>
              <TabsContent value="xml" className="mt-0">
                <XmlPreviewTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Save as Template modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-1">Save as Template</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Saves the current header as a reusable template. Manager access only.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template code</Label>
                <Input
                  value={templateCode}
                  onChange={e => setTemplateCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REPULSE-BAY"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">Short identifier, no spaces. Used internally.</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={templateDesc}
                  onChange={e => setTemplateDesc(e.target.value)}
                  placeholder="e.g. Repulse Bay — Sea Miami"
                  maxLength={60}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                className="flex-1"
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateCode.trim() || !templateDesc.trim()}
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </Button>
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
