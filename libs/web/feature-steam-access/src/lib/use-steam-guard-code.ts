'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  requestSteamGuardCode,
} from '@gamestore/web/data-access';
import {
  generateSteamGuardCode,
  secondsUntilNextTotpWindow,
} from './steam-guard-totp';

export type UseSteamGuardCodeResult = {
  code: string | null;
  expiresInSeconds: number | null;
  loading: boolean;
  error: string | null;
  cooldownSeconds: number | null;
};

export function useSteamGuardCode(
  licenseKey: string | undefined,
): UseSteamGuardCodeResult {
  const [code, setCode] = useState<string | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [sharedSecret, setSharedSecret] = useState<string | null>(null);
  const licenseKeyRef = useRef(licenseKey);
  licenseKeyRef.current = licenseKey;

  const applyLiveCode = useCallback(async (secret: string) => {
    const nextCode = await generateSteamGuardCode(secret);
    setCode((current) => (current === nextCode ? current : nextCode));
    setExpiresInSeconds(secondsUntilNextTotpWindow());
  }, []);

  const fetchInitialCode = useCallback(async () => {
    const key = licenseKeyRef.current?.trim();
    if (!key) {
      return;
    }

    setLoading(true);
    setError(null);
    setCooldownSeconds(null);

    try {
      const response = await requestSteamGuardCode(key);
      setSharedSecret(response.sharedSecret);
      await applyLiveCode(response.sharedSecret);
    } catch (err) {
      setSharedSecret(null);
      if (err instanceof ApiError && err.status === 429) {
        const match = err.body.match(/(\d+)\s+seconds/i);
        const seconds = match ? Number.parseInt(match[1], 10) : 60;
        setCooldownSeconds(seconds);
        setError(`Cooldown active — try again in ${seconds}s`);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Could not load Steam Guard code',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [applyLiveCode]);

  useEffect(() => {
    setSharedSecret(null);
    setCode(null);
    setExpiresInSeconds(null);
    void fetchInitialCode();
  }, [licenseKey, fetchInitialCode]);

  useEffect(() => {
    if (!sharedSecret) {
      return;
    }

    const tick = () => {
      void applyLiveCode(sharedSecret);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [sharedSecret, applyLiveCode]);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden && licenseKeyRef.current?.trim()) {
        if (sharedSecret) {
          void applyLiveCode(sharedSecret);
          return;
        }
        void fetchInitialCode();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sharedSecret, applyLiveCode, fetchInitialCode]);

  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCooldownSeconds((current) => {
        if (current === null || current <= 1) {
          void fetchInitialCode();
          return null;
        }
        setError(`Cooldown active — try again in ${current - 1}s`);
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cooldownSeconds, fetchInitialCode]);

  return {
    code,
    expiresInSeconds,
    loading,
    error,
    cooldownSeconds,
  };
}
