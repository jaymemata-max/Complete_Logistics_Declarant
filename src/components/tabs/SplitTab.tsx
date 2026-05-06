import React from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

export const SplitTab: React.FC = () => {
  const { declaration, updateHeader, updateDeclaration } = useDeclaration();

  if (!declaration) return null;

  const items = declaration.items;
  const itemsWithSubline = items.filter(i => i.previousDocumentSummaryDeclarationSubline?.trim()).length;
  const previousDocuments = Array.from(new Set(
    items.map(i => i.previousDocumentSummaryDeclaration?.trim()).filter(Boolean)
  ));
  const missingSubline = declaration.header.splitsFlag
    ? items.filter(i => !i.previousDocumentSummaryDeclarationSubline?.trim())
    : [];

  const setDefaultSublines = () => {
    updateDeclaration({
      items: items.map(item => ({
        ...item,
        previousDocumentSummaryDeclarationSubline:
          item.previousDocumentSummaryDeclarationSubline?.trim() || '1',
      })),
    });
  };

  const copyFirstPreviousDocumentToBlanks = () => {
    const firstPreviousDocument = items.find(i => i.previousDocumentSummaryDeclaration?.trim())
      ?.previousDocumentSummaryDeclaration;

    if (!firstPreviousDocument) return;

    updateDeclaration({
      items: items.map(item => ({
        ...item,
        previousDocumentSummaryDeclaration:
          item.previousDocumentSummaryDeclaration?.trim() || firstPreviousDocument,
      })),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <Card>
        <CardHeader>
          <CardTitle>Split / Degroupage</CardTitle>
          <CardDescription>Manage Field 40 house B/L and subline references</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="splitsFlag"
              checked={declaration.header.splitsFlag}
              onChange={(e) => updateHeader({ splitsFlag: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="splitsFlag" className="font-normal text-base">
              This declaration uses split B/L sublines
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <Label className="text-xs text-muted-foreground">Items</Label>
              <div className="font-mono mt-1 text-lg">{items.length}</div>
            </div>
            <div className="rounded-lg border p-4">
              <Label className="text-xs text-muted-foreground">Items with S/L</Label>
              <div className="font-mono mt-1 text-lg">{itemsWithSubline}</div>
            </div>
            <div className="rounded-lg border p-4">
              <Label className="text-xs text-muted-foreground">Previous documents</Label>
              <div className="font-mono mt-1 text-lg">{previousDocuments.length}</div>
            </div>
          </div>

          {declaration.header.splitsFlag && missingSubline.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {missingSubline.length} item{missingSubline.length !== 1 ? 's' : ''} missing S/L. Split declarations should carry a subline in Field 40.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={setDefaultSublines} disabled={items.length === 0}>
              Set S/L = 1 on blanks
            </Button>
            <Button variant="outline" onClick={copyFirstPreviousDocumentToBlanks} disabled={previousDocuments.length === 0}>
              Copy first B/L to blanks
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-3">Item</th>
                  <th className="text-left font-medium p-3">B/L or AWB</th>
                  <th className="text-left font-medium p-3">S/L</th>
                  <th className="text-left font-medium p-3">Packages</th>
                  <th className="text-left font-medium p-3">Gross kg</th>
                  <th className="text-left font-medium p-3">Goods</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 font-mono">{item.itemNumber}</td>
                    <td className="p-3">{item.previousDocumentSummaryDeclaration || '-'}</td>
                    <td className="p-3 font-mono">{item.previousDocumentSummaryDeclarationSubline || '-'}</td>
                    <td className="p-3 font-mono">{item.numberOfPackages || 0}</td>
                    <td className="p-3 font-mono">{item.grossWeight || 0}</td>
                    <td className="p-3">{item.descriptionOfGoods || item.commercialDescription || item.tradeNameSearch || '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                      No items added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
