import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Declaration, DeclarationHeader, DeclarationItem, DeclarationContainer, DeclarationVehicle } from '../types';
interface DeclarationContextType {
  declaration: Declaration | null;
  setDeclaration: (decl: Declaration | null) => void;
  updateDeclaration: (updates: Partial<Declaration>) => void;
  updateHeader: (updates: Partial<DeclarationHeader>) => void;
  addItem: () => void;
  updateItem: (id: string, updates: Partial<DeclarationItem>) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  addContainer: () => void;
  updateContainer: (id: string, updates: Partial<DeclarationContainer>) => void;
  deleteContainer: (id: string) => void;
  vehicles: DeclarationVehicle[];
  addVehicle: (vehicle: DeclarationVehicle) => void;
  updateVehicle: (id: string, updates: Partial<DeclarationVehicle>) => void;
  deleteVehicle: (id: string) => void;
}

const DeclarationContext = createContext<DeclarationContextType | undefined>(undefined);

export const useDeclaration = () => {
  const context = useContext(DeclarationContext);
  if (!context) {
    throw new Error('useDeclaration must be used within a DeclarationProvider');
  }
  return context;
};

export const DeclarationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [declaration, setDeclaration] = useState<Declaration | null>(null);

  const updateDeclaration = (updates: Partial<Declaration>) => {
    setDeclaration(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateHeader = (updates: Partial<DeclarationHeader>) => {
    setDeclaration(prev => prev ? { ...prev, header: { ...prev.header, ...updates } } : null);
  };

  const addItem = () => {
    setDeclaration(prev => {
      if (!prev) return null;
      const newItem: DeclarationItem = {
        id: Math.random().toString(36).substring(2, 9),
        itemNumber: prev.items.length + 1,
        tradeNameSearch: '',
        hsCode: '',
        commercialDescription: '',
        descriptionOfGoods: '',
        countryOfOriginCode: '',
        numberOfPackages: 0,
        kindOfPackagesCode: '',
        marks1: '',
        marks2: '',
        invoiceAmount: 0,
        invoiceCurrencyCode: 'USD',
        grossWeight: 0,
        netWeight: 0,
        extendedCustomsProcedure: '',
        nationalCustomsProcedure: '',
        preferenceCode: '',
        valuationMethodCode: '1',
        quotaNumber: '',
        previousDocumentSummaryDeclaration: '',
        previousDocumentSummaryDeclarationSubline: '',
        supplementaryUnits: [],
        attachedDocuments: [],
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const updateItem = (id: string, updates: Partial<DeclarationItem>) => {
    setDeclaration(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
      };
    });
  };

  const deleteItem = (id: string) => {
    setDeclaration(prev => {
      if (!prev) return null;
      const newItems = prev.items.filter(item => item.id !== id).map((item, index) => ({
        ...item,
        itemNumber: index + 1
      }));
      return { ...prev, items: newItems };
    });
  };

  const duplicateItem = (id: string) => {
    setDeclaration(prev => {
      if (!prev) return null;
      const itemToDuplicate = prev.items.find(item => item.id === id);
      if (!itemToDuplicate) return prev;
      
      const newItem = {
        ...itemToDuplicate,
        id: Math.random().toString(36).substring(2, 9),
        itemNumber: prev.items.length + 1
      };
      
      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const addContainer = () => {
    setDeclaration(prev => {
      if (!prev) return null;
      const newContainer: DeclarationContainer = {
        id: Math.random().toString(36).substring(2, 9),
        itemNumber: 0,
        containerNumber: '',
        containerType: '',
        emptyFullIndicator: 'F',
        goodsDescription: '',
        packagesType: '',
        packagesNumber: 0,
        packagesWeight: 0,
      };
      return { ...prev, containers: [...prev.containers, newContainer] };
    });
  };

  const updateContainer = (id: string, updates: Partial<DeclarationContainer>) => {
    setDeclaration(prev => {
      if (!prev) return null;
      return {
        ...prev,
        containers: prev.containers.map(c => c.id === id ? { ...c, ...updates } : c)
      };
    });
  };

  const deleteContainer = (id: string) => {
    setDeclaration(prev => {
      if (!prev) return null;
      return { ...prev, containers: prev.containers.filter(c => c.id !== id) };
    });
  };

  const addVehicle = (_vehicle: DeclarationVehicle) => {};
  const updateVehicle = (_id: string, _updates: Partial<DeclarationVehicle>) => {};
  const deleteVehicle = (_id: string) => {};

  return (
    <DeclarationContext.Provider value={{
      declaration,
      setDeclaration,
      updateDeclaration,
      updateHeader,
      addItem,
      updateItem,
      deleteItem,
      duplicateItem,
      addContainer,
      updateContainer,
      deleteContainer,
      vehicles: declaration?.vehicles ?? [],
      addVehicle,
      updateVehicle,
      deleteVehicle,
    }}>
      {children}
    </DeclarationContext.Provider>
  );
};
