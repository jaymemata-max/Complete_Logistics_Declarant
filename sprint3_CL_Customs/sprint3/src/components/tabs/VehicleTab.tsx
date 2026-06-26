import React, { useState } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Plus, Trash2, Car } from 'lucide-react';
import type { DeclarationVehicle } from '../../types';

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

const FUEL_TYPES = [
  { value: 'G', label: 'G — Gasoline' },
  { value: 'D', label: 'D — Diesel' },
  { value: 'E', label: 'E — Electric' },
  { value: 'H', label: 'H — Hybrid' },
  { value: 'O', label: 'O — Other' },
];

const TRANSMISSION_TYPES = [
  { value: 'A', label: 'A — Automatic' },
  { value: 'M', label: 'M — Manual' },
];

export const VehicleTab: React.FC = () => {
  const { declaration, updateDeclaration } = useDeclaration();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!declaration) return null;

  const vehicles = declaration.vehicles || [];
  const items = declaration.items;

  // Only items that don't already have a vehicle linked
  const linkedItemIds = new Set(vehicles.map(v => v.itemId));
  const availableItems = items.filter(i => !linkedItemIds.has(i.id));

  const addVehicle = () => {
    if (items.length === 0) return;
    // Find first item without a vehicle
    const targetItem = availableItems[0];
    if (!targetItem) return;

    const newVehicle: DeclarationVehicle = {
      id: genId(),
      itemId: targetItem.id,
      vinNumber: '',
      stockNumber: '',
      make: '',
      model: '',
      year: '',
      color: '',
      engineType: '',
      engineNumber: '',
      fuelType: 'G',
      transmission: 'A',
      invoiceValue: 0,
      invoiceCurrency: 'USD',
      grossWeight: 0,
      netWeight: 0,
    };
    updateDeclaration({ vehicles: [...vehicles, newVehicle] });
    setExpandedId(newVehicle.id);
  };

  const updateVehicle = (id: string, updates: Partial<DeclarationVehicle>) => {
    updateDeclaration({
      vehicles: vehicles.map(v => v.id === id ? { ...v, ...updates } : v),
    });
  };

  const deleteVehicle = (id: string) => {
    updateDeclaration({ vehicles: vehicles.filter(v => v.id !== id) });
  };

  const getItemLabel = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return 'Unknown item';
    return `Item ${item.itemNumber}${item.tradeNameSearch ? ' — ' + item.tradeNameSearch : ''}`;
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Vehicle Declarations</h2>
          <p className="text-sm text-muted-foreground">
            Each vehicle is linked to one declaration item. {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} added.
          </p>
        </div>
        <Button
          onClick={addVehicle}
          disabled={availableItems.length === 0 && items.length > 0}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      {/* No items warning */}
      {items.length === 0 && (
        <div className="text-center p-12 border rounded-xl bg-card border-dashed">
          <Car className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Add items in the Items tab first.</p>
          <p className="text-sm text-muted-foreground mt-1">Each vehicle must be linked to a declaration item.</p>
        </div>
      )}

      {/* All items have vehicles */}
      {items.length > 0 && availableItems.length === 0 && vehicles.length > 0 && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-200">
          All items have a vehicle linked. Add more items in the Items tab to add more vehicles.
        </div>
      )}

      {/* Vehicle list */}
      <div className="space-y-3">
        {vehicles.map(v => {
          const isExpanded = expandedId === v.id;
          return (
            <Card key={v.id} className="overflow-hidden">
              {/* Row header */}
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : v.id)}
              >
                <div className="flex items-center gap-4">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-semibold">
                      {v.make && v.model ? `${v.make} ${v.model}` : 'New Vehicle'}
                      {v.year ? ` (${v.year})` : ''}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs font-mono">
                      {v.vinNumber || 'No VIN'}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      → {getItemLabel(v.itemId)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteVehicle(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="p-6 border-t space-y-6 bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Vehicle identity */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Vehicle Identity
                      </h3>

                      <div className="space-y-2">
                        <Label>Linked to Item</Label>
                        <Select
                          value={v.itemId}
                          onValueChange={val => updateVehicle(v.id, { itemId: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {/* Show current item + available items */}
                            {items
                              .filter(i => i.id === v.itemId || !linkedItemIds.has(i.id))
                              .map(i => (
                                <SelectItem key={i.id} value={i.id}>
                                  Item {i.itemNumber}{i.tradeNameSearch ? ' — ' + i.tradeNameSearch : ''}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>VIN Number</Label>
                        <Input
                          value={v.vinNumber}
                          onChange={e => updateVehicle(v.id, { vinNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. 1HGBH41JXMN109186"
                          maxLength={25}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Stock / Invoice Number</Label>
                        <Input
                          value={v.stockNumber}
                          onChange={e => updateVehicle(v.id, { stockNumber: e.target.value })}
                          maxLength={15}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Make</Label>
                          <Input
                            value={v.make}
                            onChange={e => updateVehicle(v.id, { make: e.target.value })}
                            placeholder="Toyota"
                            maxLength={15}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Model</Label>
                          <Input
                            value={v.model}
                            onChange={e => updateVehicle(v.id, { model: e.target.value })}
                            placeholder="Hilux"
                            maxLength={25}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Input
                            value={v.year}
                            onChange={e => updateVehicle(v.id, { year: e.target.value })}
                            placeholder="2024"
                            maxLength={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input
                            value={v.color}
                            onChange={e => updateVehicle(v.id, { color: e.target.value })}
                            placeholder="White"
                            maxLength={15}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technical + Valuation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Technical Details & Valuation
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Engine Type</Label>
                          <Input
                            value={v.engineType}
                            onChange={e => updateVehicle(v.id, { engineType: e.target.value })}
                            placeholder="2.4L"
                            maxLength={15}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Engine Number</Label>
                          <Input
                            value={v.engineNumber}
                            onChange={e => updateVehicle(v.id, { engineNumber: e.target.value })}
                            maxLength={15}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Fuel Type</Label>
                          <Select
                            value={v.fuelType}
                            onValueChange={val => updateVehicle(v.id, { fuelType: val as any })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FUEL_TYPES.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Transmission</Label>
                          <Select
                            value={v.transmission}
                            onValueChange={val => updateVehicle(v.id, { transmission: val as any })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TRANSMISSION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                          <Label>Invoice Value</Label>
                          <Input
                            type="number"
                            value={v.invoiceValue}
                            onChange={e => updateVehicle(v.id, { invoiceValue: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Input
                            value={v.invoiceCurrency}
                            onChange={e => updateVehicle(v.id, { invoiceCurrency: e.target.value.toUpperCase().slice(0, 3) })}
                            maxLength={3}
                            placeholder="USD"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Gross Weight (kg)</Label>
                          <Input
                            type="number"
                            value={v.grossWeight}
                            onChange={e => updateVehicle(v.id, { grossWeight: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Net Weight (kg)</Label>
                          <Input
                            type="number"
                            value={v.netWeight}
                            onChange={e => updateVehicle(v.id, { netWeight: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
