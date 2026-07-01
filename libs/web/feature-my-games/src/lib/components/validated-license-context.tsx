'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LicenseGameSummary } from '@gamestore/web/data-access';

export type MyGamesStep = 'enter' | 'pick-game' | 'credentials';

type ValidatedLicenseContextValue = {
  licenseKey?: string;
  validatedGame?: LicenseGameSummary;
  licenseStatus?: string;
  step: MyGamesStep;
  setLicenseKey: (licenseKey: string | undefined) => void;
  setValidatedLicense: (payload: {
    licenseKey: string;
    status: string;
    game: LicenseGameSummary;
  }) => void;
  setStep: (step: MyGamesStep) => void;
  reset: () => void;
};

const ValidatedLicenseContext =
  createContext<ValidatedLicenseContextValue | null>(null);

export function ValidatedLicenseProvider({ children }: { children: ReactNode }) {
  const [licenseKey, setLicenseKeyState] = useState<string | undefined>();
  const [validatedGame, setValidatedGame] = useState<
    LicenseGameSummary | undefined
  >();
  const [licenseStatus, setLicenseStatus] = useState<string | undefined>();
  const [step, setStep] = useState<MyGamesStep>('enter');

  const setLicenseKey = useCallback((key: string | undefined) => {
    setLicenseKeyState(key);
  }, []);

  const setValidatedLicense = useCallback(
    (payload: {
      licenseKey: string;
      status: string;
      game: LicenseGameSummary;
    }) => {
      setLicenseKeyState(payload.licenseKey);
      setValidatedGame(payload.game);
      setLicenseStatus(payload.status);
    },
    [],
  );

  const reset = useCallback(() => {
    setLicenseKeyState(undefined);
    setValidatedGame(undefined);
    setLicenseStatus(undefined);
    setStep('enter');
  }, []);

  const value = useMemo(
    () => ({
      licenseKey,
      validatedGame,
      licenseStatus,
      step,
      setLicenseKey,
      setValidatedLicense,
      setStep,
      reset,
    }),
    [
      licenseKey,
      validatedGame,
      licenseStatus,
      step,
      setLicenseKey,
      setValidatedLicense,
      reset,
    ],
  );

  return (
    <ValidatedLicenseContext.Provider value={value}>
      {children}
    </ValidatedLicenseContext.Provider>
  );
}

export function useValidatedLicense() {
  const context = useContext(ValidatedLicenseContext);
  if (!context) {
    throw new Error(
      'useValidatedLicense must be used within ValidatedLicenseProvider',
    );
  }
  return context;
}
