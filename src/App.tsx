/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DeclarationProvider, useDeclaration } from './store/DeclarationContext';
import { DeclarationList } from './components/DeclarationList';
import { DeclarationWorkspace } from './components/DeclarationWorkspace';

const AppContent: React.FC = () => {
  const { declaration } = useDeclaration();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {declaration ? <DeclarationWorkspace /> : <DeclarationList />}
    </div>
  );
};

export default function App() {
  return (
    <DeclarationProvider>
      <AppContent />
    </DeclarationProvider>
  );
}
