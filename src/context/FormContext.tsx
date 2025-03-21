import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Backtest } from '../types';

// Define the context interface
interface FormContextType {
  duplicateBacktest: (backtest: Backtest) => void;
  pendingDuplicate: Backtest | null;
  clearDuplicate: () => void;
}

// Create the context with default values
const FormContext = createContext<FormContextType>({
  duplicateBacktest: () => {},
  pendingDuplicate: null,
  clearDuplicate: () => {},
});

// Custom hook for using the context
export const useForm = () => useContext(FormContext);

// Provider component
export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingDuplicate, setPendingDuplicate] = useState<Backtest | null>(null);

  const duplicateBacktest = (backtest: Backtest) => {
    setPendingDuplicate(backtest);
  };

  const clearDuplicate = () => {
    setPendingDuplicate(null);
  };

  return (
    <FormContext.Provider
      value={{
        pendingDuplicate,
        duplicateBacktest,
        clearDuplicate,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}; 