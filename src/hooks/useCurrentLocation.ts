import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../types/location';

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Returns the coordinates (or null) so the caller can use them right away
  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setErrorMessage('Activa el GPS de tu celular para usar esta función.');
        return null;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('No diste permiso de ubicación. Puedes elegir tu universidad manualmente.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({});
      const result = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(result);
      return result;
    } catch {
      setErrorMessage('No pudimos obtener tu ubicación. Inténtalo de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, loading, errorMessage, requestLocation };
}