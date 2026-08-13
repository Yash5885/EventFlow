import { useEffect, useState } from 'react';

export function useCountdownTimer(expiresAt?: string | null) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => getRemainingSeconds(expiresAt));

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      setRemainingSeconds(getRemainingSeconds(expiresAt));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return remainingSeconds;
}

function getRemainingSeconds(expiresAt?: string | null) {
  if (!expiresAt) {
    return null;
  }

  const expiryTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryTime)) {
    return null;
  }

  return Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
}
