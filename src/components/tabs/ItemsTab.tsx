import React, { useState } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { MOCK_TRADE_NAMES, MOCK_CPC, MOCK_PACKAGE_TYPES, MOCK_COUNTRIES } from '../../data/mockData';
import { Plus, Trash2, Copy, ChevronRight, ChevronDown } from 'lucide-react';

export const ItemsTab: React.FC = () => {
  const { declaration, addItem, updateItem, deleteItem, duplicateItem } = useDeclaration();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (!declaration) return null;

  const handleTradeNameSelect = (itemId: string, tradeName: string) => {
    const tradeData = MOCK_TRADE_NAMES.find(t => t.tradeName === tradeName);
    if (tradeData) {
      updateItem(itemId, {
        tradeNameSearch: tradeName,
        hsCode: tradeData.hsCode,
        commercialDescription: tradeData.commercialDescription,
        descriptionOfGoods: tradeData.descriptionOfGoods,
        marks1: tradeData.marks,
        kindOfPackagesCode: tradeData.packageCode,
      });
    } else {
      updateItem(itemId, { tradeNameSearch: tradeName });
    }
  };

  const handleCpcSelect = (itemId: string, cpcCode: string) => {
    const cpcData = MOCK_CPC.find(c => c.code === cpcCode);
    if (cpcData) {
      updateItem(itemId, {
        extendedCustomsProcedure: cpcData.extended,
        nationalCustomsProcedure: cpcData.national,
      });
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Declaration Items</h2>
          <p className="text-sm text-muted-foreground">Manage goods items for this declaration</p>
        </div>
        <Button onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {declaration.items.map((item) => {
          const isExpanded = expandedItemId === item.id;
          const cpcValue = item.extendedCustomsProcedure && item.nationalCustomsProcedure 
            ? `${item.extendedCustomsProcedure}-${item.nationalCustomsProcedure}` 
            : '';

          return (
            <Card key={item.id} className="overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  <div className="font-mono bg-primary/10 text-primary px-2 py-1 rounded text-sm font-semibold">
                    Item {item.itemNumber}
                  </div>
                  <div>
                    <span className="font-semibold">{item.tradeNameSearch || 'New Item'}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{item.hsCode ? `HS: ${item.hsCode}` : 'No HS Code'}</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Classification */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Classification</h3>
                      
                      <div className="space-y-2">
                        <Label>Trade Name Search</Label>
                        <Select value={item.tradeNameSearch} onValueChange={(v) => handleTradeNameSelect(item.id, v)}>
                          <SelectTrigger><SelectValue placeholder="Search trade name..." /></SelectTrigger>
                          <SelectContent>
                            {MOCK_TRADE_NAMES.map(t => <SelectItem key={t.tradeName} value={t.tradeName}>{t.tradeName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>HS Code</Label>
                          <Input value={item.hsCode} onChange={(e) => updateItem(item.id, { hsCode: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Procedure Code (CPC)</Label>
                          <Select value={cpcValue} onValueChange={(v) => handleCpcSelect(item.id, v)}>
                            <SelectTrigger><SelectValue placeholder="Select CPC" /></SelectTrigger>
                            <SelectContent>
                              {MOCK_CPC.map(c => <SelectItem key={c.code} value={c.code}>{c.code} | {c.description}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Commercial Description</Label>
                        <Input value={item.commercialDescription} onChange={(e) => updateItem(item.id, { commercialDescription: e.target.value })} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description of Goods</Label>
                        <Input value={item.descriptionOfGoods} onChange={(e) => updateItem(item.id, { descriptionOfGoods: e.target.value })} />
                      </div>
                    </div>

                    {/* Packaging & Valuation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Packaging & Valuation</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Number of Packages</Label>
                          <Input type="number" value={item.numberOfPackages} onChange={(e) => updateItem(item.id, { numberOfPackages: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Package Type</Label>
                          <Select value={item.kindOfPackagesCode} onValueChange={(v) => updateItem(item.id, { kindOfPackagesCode: v })}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {MOCK_PACKAGE_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Marks 1</Label>
                          <Input value={item.marks1} onChange={(e) => updateItem(item.id, { marks1: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Marks 2</Label>
                          <Input value={item.marks2} onChange={(e) => updateItem(item.id, { marks2: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gross Weight</Label>
                          <Input type="number" value={item.grossWeight} onChange={(e) => updateItem(item.id, { grossWeight: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Net Weight</Label>
                          <Input type="number" value={item.netWeight} onChange={(e) => updateItem(item.id, { netWeight: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Invoice Amount</Label>
                          <Input type="number" value={item.invoiceAmount} onChange={(e) => updateItem(item.id, { invoiceAmount: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Origin Country</Label>
                          <Select value={item.countryOfOriginCode} onValueChange={(v) => updateItem(item.id, { countryOfOriginCode: v })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {MOCK_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Previous Document & Supplementary Units */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Previous Document</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Summary Declaration</Label>
                          <Input value={item.previousDocumentSummaryDeclaration} onChange={(e) => updateItem(item.id, { previousDocumentSummaryDeclaration: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Subline</Label>
                          <Input value={item.previousDocumentSummaryDeclarationSubline} onChange={(e) => updateItem(item.id, { previousDocumentSummaryDeclarationSubline: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Supplementary Units</h3>
                        <Button variant="outline" size="sm" onClick={() => {
                          const newSu = { id: Math.random().toString(36).substring(2, 9), rank: item.supplementaryUnits.length + 1, code: '', quantity: 0 };
                          updateItem(item.id, { supplementaryUnits: [...item.supplementaryUnits, newSu] });
                        }}>
                          <Plus className="h-3 w-3 mr-1" /> Add Unit
                        </Button>
                      </div>
                      
                      {item.supplementaryUnits.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No supplementary units added.</p>
                      ) : (
                        <div className="space-y-2">
                          {item.supplementaryUnits.map((su, idx) => (
                            <div key={su.id} className="flex gap-2 items-end">
                              <div className="space-y-1 flex-1">
                                <Label className="text-xs">Code</Label>
                                <Input value={su.code} onChange={(e) => {
                                  const newSu = [...item.supplementaryUnits];
                                  newSu[idx].code = e.target.value;
                                  updateItem(item.id, { supplementaryUnits: newSu });
                                }} />
                              </div>
                              <div className="space-y-1 flex-1">
                                <Label className="text-xs">Quantity</Label>
                                <Input type="number" value={su.quantity} onChange={(e) => {
                                  const newSu = [...item.supplementaryUnits];
                                  newSu[idx].quantity = parseFloat(e.target.value) || 0;
                                  updateItem(item.id, { supplementaryUnits: newSu });
                                }} />
                              </div>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                const newSu = item.supplementaryUnits.filter(u => u.id !== su.id);
                                updateItem(item.id, { supplementaryUnits: newSu });
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
