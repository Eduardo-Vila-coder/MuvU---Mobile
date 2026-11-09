import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router'; // React Navigation hook, re-exported by Expo Router
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.8; // total acceleration in g (a phone at rest is ~1 g)
const COOLDOWN_MS = 1500; // ignore new shakes for 1.5 s

// Calls onShake when the user shakes the phone. onShake must be stable (useCallback)
export function useShake(onShake: () => void) {
  const [isAvailable, setIsAvailable] = useState(false);
  const lastShakeRef = useRef(0);
  const isFocused = useIsFocused(); // React Navigation: only listen while the screen is visible

  useEffect(() => {
    if (!isFocused) return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
    let active = true;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!active) return;
        setIsAvailable(available);
        if (!available) return; // fallback: pull to refresh still works

        Accelerometer.setUpdateInterval(200);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const force = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (force > SHAKE_THRESHOLD && now - lastShakeRef.current > COOLDOWN_MS) {
            lastShakeRef.current = now;
            onShake();
          }
        });
      })
      .catch(() => {
        if (active) setIsAvailable(false);
      });

    return () => {
      active = false;
      subscription?.remove(); // cleanup: stop listening
    };
  }, [onShake, isFocused]);

  return { isAvailable };
}