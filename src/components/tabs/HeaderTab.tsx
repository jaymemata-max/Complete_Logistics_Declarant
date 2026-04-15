import React from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MOCK_COUNTRIES, MOCK_OFFICES, MOCK_LOADING_PLACES, MOCK_LOCATIONS, MOCK_TRANSPORT_MODES } from '../../data/mockData';

export const HeaderTab: React.FC = () => {
  const { declaration, updateHeader } = useDeclaration();

  if (!declaration) return null;
  const { header } = declaration;

  const handleChange = (field: keyof typeof header, value: any) => {
    updateHeader({ [field]: value });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic details of the declaration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Declaration Type</Label>
                <Select value={header.typeOfDeclaration} onValueChange={(v) => handleChange('typeOfDeclaration', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IM">IM - Import</SelectItem>
                    <SelectItem value="EX">EX - Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Procedure Code</Label>
                <Input value={header.generalProcedureCode} onChange={(e) => handleChange('generalProcedureCode', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Manifest Reference Number</Label>
              <Input value={header.manifestReferenceNumber} onChange={(e) => handleChange('manifestReferenceNumber', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Packages</Label>
                <Input type="number" value={header.totalNumberOfPackages} onChange={(e) => handleChange('totalNumberOfPackages', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Clearance Office</Label>
                <Select value={header.customsClearanceOfficeCode} onValueChange={(v) => handleChange('customsClearanceOfficeCode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_OFFICES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="containerFlag" 
                checked={header.containerFlag} 
                onChange={(e) => handleChange('containerFlag', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="containerFlag" className="font-normal">Shipment uses containers</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traders</CardTitle>
            <CardDescription>Consignee and Declarant information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Consignee Code</Label>
              <Input value={header.consigneeCode} onChange={(e) => handleChange('consigneeCode', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Consignee Name</Label>
              <Input value={header.consigneeName} onChange={(e) => handleChange('consigneeName', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Declarant Code</Label>
                <Input value={header.declarantCode} onChange={(e) => handleChange('declarantCode', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Declarant Name</Label>
                <Input value={header.declarantName} onChange={(e) => handleChange('declarantName', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geography & Transport</CardTitle>
            <CardDescription>Routing and transport details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Export Country</Label>
                <Select value={header.exportCountryCode} onValueChange={(v) => handleChange('exportCountryCode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Select value={header.destinationCountryCode} onValueChange={(v) => handleChange('destinationCountryCode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trading Country</Label>
                <Select value={header.tradingCountry} onValueChange={(v) => handleChange('tradingCountry', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>Transport Identity</Label>
                <Input value={header.transportIdentity} onChange={(e) => handleChange('transportIdentity', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Transport Nationality</Label>
                <Select value={header.transportNationality} onValueChange={(v) => handleChange('transportNationality', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Place of Loading</Label>
                <Select value={header.placeOfLoadingCode} onValueChange={(v) => handleChange('placeOfLoadingCode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_LOADING_PLACES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location of Goods</Label>
                <Select value={header.locationOfGoods} onValueChange={(v) => handleChange('locationOfGoods', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_LOCATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial & Valuation</CardTitle>
            <CardDescription>Totals and terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivery Terms Code</Label>
                <Select value={header.deliveryTermsCode} onValueChange={(v) => handleChange('deliveryTermsCode', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="EXW">EXW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Place</Label>
                <Input value={header.deliveryTermsPlace} onChange={(e) => handleChange('deliveryTermsPlace', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>Total Invoice Amount</Label>
                <div className="flex gap-2">
                  <Input type="number" value={header.invoiceAmount} onChange={(e) => handleChange('invoiceAmount', parseFloat(e.target.value))} className="flex-1" />
                  <Input value={header.invoiceCurrencyCode} onChange={(e) => handleChange('invoiceCurrencyCode', e.target.value)} className="w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>External Freight</Label>
                <div className="flex gap-2">
                  <Input type="number" value={header.externalFreightAmount} onChange={(e) => handleChange('externalFreightAmount', parseFloat(e.target.value))} className="flex-1" />
                  <Input value={header.externalFreightCurrencyCode} onChange={(e) => handleChange('externalFreightCurrencyCode', e.target.value)} className="w-20" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Insurance</Label>
                <div className="flex gap-2">
                  <Input type="number" value={header.insuranceAmount} onChange={(e) => handleChange('insuranceAmount', parseFloat(e.target.value))} className="flex-1" />
                  <Input value={header.insuranceCurrencyCode} onChange={(e) => handleChange('insuranceCurrencyCode', e.target.value)} className="w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total Gross Weight</Label>
                <Input type="number" value={header.grossWeight} onChange={(e) => handleChange('grossWeight', parseFloat(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
