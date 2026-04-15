import React from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';

export const SplitTab: React.FC = () => {
  const { declaration, updateHeader } = useDeclaration();

  if (!declaration) return null;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-200">
        <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium">Mockup Note: Split / Degroupage</h3>
          <p className="text-sm mt-1">
            The exact business rules for splitting and degroupage remain unclear from the provided materials. 
            This tab demonstrates where this workflow would live. 
            <br/><br/>
            <strong>TODO:</strong> Implement actual split logic, validate previous document behavior, and determine how split items affect the main declaration totals.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Split / Degroupage Configuration</CardTitle>
          <CardDescription>Manage how this shipment is split across multiple declarations</CardDescription>
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
            <Label htmlFor="splitsFlag" className="font-normal text-base">This declaration is part of a split shipment</Label>
          </div>

          {declaration.header.splitsFlag && (
            <div className="p-6 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="font-medium">Split Details</h4>
              <p className="text-sm text-muted-foreground">
                When a shipment is split, the previous document reference must be carefully managed to ensure the total quantities across all split declarations do not exceed the original manifest.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-muted-foreground">Original Manifest Packages</Label>
                  <div className="font-mono mt-1 text-lg">1,000</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Allocated to this Declaration</Label>
                  <div className="font-mono mt-1 text-lg">{declaration.header.totalNumberOfPackages}</div>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" disabled>
                  Calculate Remaining Balance
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
