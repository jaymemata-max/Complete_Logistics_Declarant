import React from 'react';
import { useDeclaration } from '../store/DeclarationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { ArrowLeft, Save, FileText, Package, LayoutGrid, FileCode2, SplitSquareHorizontal } from 'lucide-react';
import { HeaderTab } from './tabs/HeaderTab';
import { ItemsTab } from './tabs/ItemsTab';
import { ContainersTab } from './tabs/ContainersTab';
import { SplitTab } from './tabs/SplitTab';
import { XmlPreviewTab } from './tabs/XmlPreviewTab';

export const DeclarationWorkspace: React.FC = () => {
  const { declaration, setDeclaration } = useDeclaration();

  if (!declaration) return null;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 pr-6 border-r border-primary-foreground/20">
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white tracking-tight text-lg">Complete Logistics</span>
              <span className="font-medium text-secondary tracking-widest text-xs uppercase mt-1">Declarant</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDeclaration(null)} className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">{declaration.header.declarationId || 'New Declaration'}</h1>
            <p className="text-xs text-primary-foreground/80 font-medium">{declaration.header.shipmentType} • {declaration.header.typeOfDeclaration}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-primary-foreground/20 text-white bg-transparent hover:bg-primary-foreground/10">
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button size="sm" className="bg-white text-primary hover:bg-gray-100 shadow-sm font-semibold">
            Submit Declaration
          </Button>
        </div>
      </header>

      {/* Summary Strip */}
      <div className="bg-card border-b border-border px-6 py-2 flex items-center gap-8 text-sm shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">Draft</span>
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
          <span className="font-medium">{declaration.header.invoiceAmount || 0} {declaration.header.invoiceCurrency}</span>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="header" className="flex-1 flex flex-col w-full h-full">
          <div className="px-6 bg-card border-b border-border">
            <TabsList className="h-12 bg-transparent border-none p-0 gap-6">
              <TabsTrigger value="header" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">
                <FileText className="h-4 w-4 mr-2" /> Header
              </TabsTrigger>
              <TabsTrigger value="items" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">
                <Package className="h-4 w-4 mr-2" /> Items
              </TabsTrigger>
              {declaration.header.containerFlag && (
                <TabsTrigger value="containers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">
                  <LayoutGrid className="h-4 w-4 mr-2" /> Containers
                </TabsTrigger>
              )}
              <TabsTrigger value="split" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">
                <SplitSquareHorizontal className="h-4 w-4 mr-2" /> Split / Degroupage
              </TabsTrigger>
              <TabsTrigger value="xml" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">
                <FileCode2 className="h-4 w-4 mr-2" /> XML Preview
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-background p-6">
            <div className="max-w-6xl mx-auto">
              <TabsContent value="header" className="m-0 h-full outline-none">
                <HeaderTab />
              </TabsContent>
              <TabsContent value="items" className="m-0 h-full outline-none">
                <ItemsTab />
              </TabsContent>
              {declaration.header.containerFlag && (
                <TabsContent value="containers" className="m-0 h-full outline-none">
                  <ContainersTab />
                </TabsContent>
              )}
              <TabsContent value="split" className="m-0 h-full outline-none">
                <SplitTab />
              </TabsContent>
              <TabsContent value="xml" className="m-0 h-full outline-none">
                <XmlPreviewTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
};
