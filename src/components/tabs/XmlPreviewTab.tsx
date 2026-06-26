import React, { useState, useEffect } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { generateAsycudaXml } from '../../utils/xmlGenerator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Download, Check, AlertTriangle } from 'lucide-react';

export const XmlPreviewTab: React.FC = () => {
  const { declaration } = useDeclaration();
  const [xmlContent, setXmlContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (declaration) {
      const generatedXml = generateAsycudaXml(declaration);
      setXmlContent(generatedXml);
      
      // Basic validation
      const newWarnings: string[] = [];
      const { header, items, containers } = declaration;

      // Header Validation
      if (!header.typeOfDeclaration) newWarnings.push('Header: Missing Type of Declaration');
      if (!header.generalProcedureCode) newWarnings.push('Header: Missing General Procedure Code');
      if (!header.customsClearanceOfficeCode) newWarnings.push('Header: Missing Customs Clearance Office Code');
      if (!header.manifestReferenceNumber) newWarnings.push('Header: Missing Manifest Reference Number');
      if (!header.consigneeCode && !header.consigneeName) newWarnings.push('Header: Consignee Code or Name is required');
      if (!header.declarantCode && !header.declarantName) newWarnings.push('Header: Declarant Code or Name is required');
      if (!header.exportCountryCode) newWarnings.push('Header: Missing Export Country Code');
      if (!header.destinationCountryCode) newWarnings.push('Header: Missing Destination Country Code');
      if (!header.tradingCountry) newWarnings.push('Header: Missing Trading Country');
      if (!header.transportIdentity) newWarnings.push('Header: Missing Transport Identity');
      if (!header.transportNationality) newWarnings.push('Header: Missing Transport Nationality');
      if (!header.deliveryTermsCode) newWarnings.push('Header: Missing Delivery Terms Code');
      if (!header.invoiceAmount || header.invoiceAmount <= 0) newWarnings.push('Header: Total Invoice Amount must be greater than 0');
      if (!header.grossWeight || header.grossWeight <= 0) newWarnings.push('Header: Total Gross Weight must be greater than 0');
      if (!header.totalNumberOfPackages || header.totalNumberOfPackages <= 0) newWarnings.push('Header: Total Number of Packages must be greater than 0');

      if (items.length === 0) newWarnings.push('Declaration has no items');
      if (header.containerFlag && containers.length === 0) newWarnings.push('Container flag is true but no containers added');

      // Structural Validation
      let totalItemPackages = 0;
      let totalItemGrossWeight = 0;
      let totalItemInvoiceAmount = 0;

      // Item Validation
      items.forEach(item => {
        if (!item.hsCode) newWarnings.push(`Item ${item.itemNumber}: Missing HS Code`);
        if (!item.previousDocumentSummaryDeclaration) newWarnings.push(`Item ${item.itemNumber}: Missing Previous Document`);
        if (!item.commercialDescription) newWarnings.push(`Item ${item.itemNumber}: Missing Commercial Description`);
        if (!item.descriptionOfGoods) newWarnings.push(`Item ${item.itemNumber}: Missing Description of Goods`);
        if (!item.countryOfOriginCode) newWarnings.push(`Item ${item.itemNumber}: Missing Country of Origin Code`);
        if (!item.numberOfPackages || item.numberOfPackages <= 0) newWarnings.push(`Item ${item.itemNumber}: Number of Packages must be greater than 0`);
        if (!item.kindOfPackagesCode) newWarnings.push(`Item ${item.itemNumber}: Missing Package Type`);
        if (!item.grossWeight || item.grossWeight <= 0) newWarnings.push(`Item ${item.itemNumber}: Gross Weight must be greater than 0`);
        if (!item.netWeight || item.netWeight <= 0) newWarnings.push(`Item ${item.itemNumber}: Net Weight must be greater than 0`);
        if (item.netWeight && item.grossWeight && item.netWeight > item.grossWeight) newWarnings.push(`Item ${item.itemNumber}: Net Weight cannot be greater than Gross Weight`);
        if (!item.invoiceAmount || item.invoiceAmount <= 0) newWarnings.push(`Item ${item.itemNumber}: Invoice Amount must be greater than 0`);
        if (!item.extendedCustomsProcedure) newWarnings.push(`Item ${item.itemNumber}: Missing Extended Customs Procedure`);
        if (!item.nationalCustomsProcedure) newWarnings.push(`Item ${item.itemNumber}: Missing National Customs Procedure`);

        totalItemPackages += item.numberOfPackages || 0;
        totalItemGrossWeight += item.grossWeight || 0;
        totalItemInvoiceAmount += item.invoiceAmount || 0;
      });

      // Container Validation
      let totalContainerPackages = 0;
      if (header.containerFlag) {
        containers.forEach((container, index) => {
          const containerNum = index + 1;
          if (!container.containerNumber) newWarnings.push(`Container ${containerNum}: Missing Container Number`);
          if (!container.containerType) newWarnings.push(`Container ${containerNum}: Missing Container Type`);
          if (!container.emptyFullIndicator) newWarnings.push(`Container ${containerNum}: Missing Empty/Full Indicator`);
          if (!container.packagesNumber || container.packagesNumber <= 0) newWarnings.push(`Container ${containerNum}: Packages Number must be greater than 0`);
          if (!container.packagesWeight || container.packagesWeight <= 0) newWarnings.push(`Container ${containerNum}: Packages Weight must be greater than 0`);
          
          totalContainerPackages += container.packagesNumber || 0;
        });
      }

      // Cross-checks
      if (header.totalNumberOfPackages && totalItemPackages !== header.totalNumberOfPackages) {
        newWarnings.push(`Mismatch: Header Total Packages (${header.totalNumberOfPackages}) does not match sum of Item Packages (${totalItemPackages})`);
      }
      if (header.grossWeight && Math.abs(totalItemGrossWeight - header.grossWeight) > 0.1) {
        newWarnings.push(`Mismatch: Header Gross Weight (${header.grossWeight}) does not match sum of Item Gross Weights (${totalItemGrossWeight.toFixed(2)})`);
      }
      if (header.invoiceAmount && Math.abs(totalItemInvoiceAmount - header.invoiceAmount) > 0.1) {
        newWarnings.push(`Mismatch: Header Invoice Amount (${header.invoiceAmount}) does not match sum of Item Invoice Amounts (${totalItemInvoiceAmount.toFixed(2)})`);
      }
      if (header.containerFlag && header.totalNumberOfPackages && totalContainerPackages !== header.totalNumberOfPackages) {
        newWarnings.push(`Mismatch: Header Total Packages (${header.totalNumberOfPackages}) does not match sum of Container Packages (${totalContainerPackages})`);
      }

      setWarnings(newWarnings);
    }
  }, [declaration]);

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `declaration_${declaration?.header.declarationId || 'new'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!declaration) return null;

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">XML Preview</h2>
          <p className="text-sm text-muted-foreground">Generated ASYCUDA submission XML</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied' : 'Copy XML'}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-start gap-3 border border-amber-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Validation Warnings</h3>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <Card className="flex-1 flex flex-col min-h-[500px] shadow-sm border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-muted/50">
          <CardTitle className="text-sm font-mono text-muted-foreground">asycuda_submission.xml</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto bg-card">
          <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap">
            {xmlContent}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
