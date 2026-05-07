import React, { useState, useEffect } from 'react';
import { useDeclaration } from '../../store/DeclarationContext';
import { generateAsycudaXml } from '../../utils/xmlGenerator';
import { validateDeclarationForSubmit } from '../../utils/declarationRules';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Download, Check, AlertTriangle } from 'lucide-react';

export const XmlPreviewTab: React.FC = () => {
  const { declaration } = useDeclaration();
  const [xmlContent, setXmlContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (declaration) {
      const generatedXml = generateAsycudaXml(declaration);
      setXmlContent(generatedXml);
      setErrors(validateDeclarationForSubmit(declaration));

      const newWarnings: string[] = [];
      declaration.items.forEach(item => {
        if (item.hsCode && /[^\d.\s-]/.test(item.hsCode)) newWarnings.push(`Item ${item.itemNumber}: HS Code can only use digits, dots, spaces, or hyphens`);
      });
      if (declaration.header.containerFlag && declaration.header.totalNumberOfPackages) {
        const totalContainerPackages = declaration.containers.reduce((sum, container) => sum + (container.packagesNumber || 0), 0);
        if (totalContainerPackages > 0 && totalContainerPackages !== declaration.header.totalNumberOfPackages) {
          newWarnings.push(`Container packages (${totalContainerPackages}) do not match header total packages (${declaration.header.totalNumberOfPackages}). Confirm against the B/L before submission.`);
        }
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
    if (errors.length > 0) {
      alert(`XML is blocked until these errors are fixed:\n\n${errors.slice(0, 8).join('\n')}`);
      return;
    }

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const rawName = declaration?.header.declarationId
      || declaration?.header.referenceNumber
      || declaration?.customsReferenceNumber
      || declaration?.id
      || `draft-${new Date().toISOString().slice(0, 10)}`;
    const fileName = rawName.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'declaration';
    a.download = `${fileName}.xml`;
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

      {errors.length > 0 && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 border border-red-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">XML Blockers</h3>
            <p className="text-sm mt-1">Fix these before downloading XML or marking the declaration submitted.</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              {errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        </div>
      )}

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
