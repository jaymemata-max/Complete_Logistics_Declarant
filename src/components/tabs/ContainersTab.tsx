import React from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { MOCK_PACKAGE_TYPES } from '../../data/mockData';

export const ContainersTab: React.FC = () => {
  const { declaration, addContainer, updateContainer, deleteContainer } = useDeclaration();

  if (!declaration) return null;

  return (
    <div className="space-y-4 pb-12">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Containers</h2>
          <p className="text-sm text-muted-foreground">Manage shipping containers for this FCL declaration</p>
        </div>
        <Button onClick={addContainer}>
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
                  <Label>Linked Item Numbers</Label>
                  <Input 
                    placeholder="e.g. 1, 2, 3" 
                    value={container.linkedItemNumbers.join(', ')} 
                    onChange={(e) => {
                      const nums = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                      updateContainer(container.id, { linkedItemNumbers: nums });
                    }} 
                  />
                  <p className="text-xs text-muted-foreground">Comma separated item numbers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Packages Type</Label>
                  <Select value={container.packagesType} onValueChange={(v) => updateContainer(container.id, { packagesType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {MOCK_PACKAGE_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
            <Button variant="outline" className="mt-4" onClick={addContainer}>
              <Plus className="h-4 w-4 mr-2" /> Add First Container
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
