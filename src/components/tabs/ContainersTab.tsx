import React, { useEffect, useState } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const describeItem = (item: any) =>
  item?.descriptionOfGoods || item?.commercialDescription || item?.tradeNameSearch || '';

export const ContainersTab: React.FC = () => {
  const { declaration, addContainer, updateContainer, deleteContainer, updateDeclaration } = useDeclaration();
  const [packageTypes, setPackageTypes] = useState<{ code: string; description: string }[]>([]);

  useEffect(() => {
    supabase
      .from('package_types')
      .select('code, description')
      .order('code')
      .then(r => setPackageTypes(r.data || []));
  }, []);

  if (!declaration) return null;

  const buildContainerFromItem = (item: any) => ({
    id: Math.random().toString(36).substring(2, 9),
    itemNumber: item?.itemNumber || 0,
    containerNumber: '',
    containerType: '',
    emptyFullIndicator: 'F',
    goodsDescription: describeItem(item),
    packagesType: item?.kindOfPackagesCode || '',
    packagesNumber: item?.numberOfPackages || 0,
    packagesWeight: item?.grossWeight || 0,
  });

  const handleAddContainer = () => {
    if (declaration.items.length === 1) {
      updateDeclaration({ containers: [...declaration.containers, buildContainerFromItem(declaration.items[0])] });
      return;
    }
    addContainer();
  };

  const handleItemLink = (containerId: string, itemNumber: number) => {
    const item = declaration.items.find(i => i.itemNumber === itemNumber);
    updateContainer(containerId, {
      itemNumber,
      goodsDescription: describeItem(item),
      packagesType: item?.kindOfPackagesCode || '',
      packagesNumber: item?.numberOfPackages || 0,
      packagesWeight: item?.grossWeight || 0,
    });
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Containers</h2>
          <p className="text-sm text-muted-foreground">Manage shipping containers for this FCL declaration</p>
        </div>
        <Button onClick={handleAddContainer}>
          <Plus className="h-4 w-4 mr-2" /> Add Container
        </Button>
      </div>

      <div className="space-y-4">
        {declaration.containers.map((container, index) => (
          <Card key={container.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Container {index + 1}</CardTitle>
                <CardDescription>{container.containerNumber || 'New Container'}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteContainer(container.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Container Number</Label>
                  <Input value={container.containerNumber} onChange={(e) => updateContainer(container.id, { containerNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Container Type</Label>
                  <Select value={container.containerType} onValueChange={(v) => updateContainer(container.id, { containerType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20DC">20' Dry</SelectItem>
                      <SelectItem value="40DC">40' Dry</SelectItem>
                      <SelectItem value="40HC">40' High Cube</SelectItem>
                      <SelectItem value="45HC">45' High Cube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Empty/Full Indicator</Label>
                  <Select value={container.emptyFullIndicator} onValueChange={(v) => updateContainer(container.id, { emptyFullIndicator: v })}>
                    <SelectTrigger><SelectValue placeholder="Select indicator" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Full</SelectItem>
                      <SelectItem value="E">Empty</SelectItem>
                      <SelectItem value="L">LCL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Goods Description</Label>
                  <Input value={container.goodsDescription} onChange={(e) => updateContainer(container.id, { goodsDescription: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Item Number</Label>
                  <Select
                    value={container.itemNumber ? String(container.itemNumber) : '0'}
                    onValueChange={(v) => handleItemLink(container.id, parseInt(v) || 0)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">— Not linked —</SelectItem>
                      {declaration.items.map(item => (
                        <SelectItem key={item.id} value={String(item.itemNumber)}>
                          Item {item.itemNumber} — {item.tradeNameSearch || item.commercialDescription || 'No description'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Auto-fills goods and package details from the item; edit below if needed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Packages Type</Label>
                  <Select value={container.packagesType} onValueChange={(v) => updateContainer(container.id, { packagesType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {packageTypes.map(p => (
                        <SelectItem key={p.code} value={p.code}>{p.code} — {p.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Packages Number</Label>
                  <Input type="number" value={container.packagesNumber} onChange={(e) => updateContainer(container.id, { packagesNumber: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Packages Weight</Label>
                  <Input type="number" value={container.packagesWeight} onChange={(e) => updateContainer(container.id, { packagesWeight: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {declaration.containers.length === 0 && (
          <div className="text-center p-12 border rounded-xl bg-card border-dashed">
            <p className="text-muted-foreground">No containers added yet.</p>
            <Button variant="outline" className="mt-4" onClick={handleAddContainer}>
              <Plus className="h-4 w-4 mr-2" /> Add First Container
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
