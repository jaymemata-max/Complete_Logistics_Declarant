import React from 'react';
import { useDeclaration } from '../store/DeclarationContext';
import { Button } from './ui/button';
import { PRESETS } from '../data/mockData';
import { FileText, Package, LayoutGrid, FileCode2, Settings, Plus, SplitSquareHorizontal } from 'lucide-react';

export const DeclarationList: React.FC = () => {
  const { loadPreset } = useDeclaration();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between bg-primary text-primary-foreground z-10 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex flex-col leading-none ml-2">
            <span className="font-bold text-white tracking-tight text-xl">Complete Logistics</span>
            <span className="font-medium text-secondary tracking-widest text-xs uppercase mt-1">Declarant</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Declarations</h1>
              <p className="text-muted-foreground mt-1">Manage your customs declarations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.keys(PRESETS).map(presetKey => (
              <div key={presetKey} className="border border-border rounded-xl p-6 bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col items-start group" onClick={() => loadPreset(presetKey)}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1 text-foreground">New {presetKey}</h3>
                <p className="text-sm text-muted-foreground">Start from {presetKey} preset</p>
              </div>
            ))}
          </div>

          <div className="border border-border rounded-xl bg-card shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Declarations</h2>
            </div>
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>No recent declarations found.</p>
              <p className="text-sm mt-1">Select a preset above to start a new declaration.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
