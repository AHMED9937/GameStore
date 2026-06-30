'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type ValidatedLicenseContextValue = {
  licenseKey?: string;
  setLicenseKey: (licenseKey: string | undefined) => void;
};

const ValidatedLicenseContext =
  createContext<ValidatedLicenseContextValue | null>(null);

export function ValidatedLicenseProvider({ children }: { children: ReactNode }) {
  const [licenseKey, setLicenseKey] = useState<string | undefined>();

  return (
    <ValidatedLicenseContext.Provider value={{ licenseKey, setLicenseKey }}>
      {children}
    </ValidatedLicenseContext.Provider>
  );
}

export function useValidatedLicense() {
  const context = useContext(ValidatedLicenseContext);
  if (!context) {
    throw new Error('useValidatedLicense must be used within ValidatedLicenseProvider');
  }
  return context;
}
