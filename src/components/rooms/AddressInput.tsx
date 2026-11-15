import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, sharedStyles } from '@/constants/theme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { GoogleMap } from '../maps/GoogleMap';
import type { MapPoint, MapState } from '../maps/types';
import { Button } from '../ui/Button';
import { FormAlert } from '../ui/FormAlert';

interface AddressInputProps {
  value: string;
  coordinates: MapPoint | null;
  onChange: (address: string, coordinates: MapPoint) => void;
  error?: string;
}

// The search, pin and confirmation live in the same card, so publishing stays on one screen.
export function AddressInput({ value, coordinates, onChange, error }: AddressInputProps) {
  const [locationRequest, setLocationRequest] = useState<MapState['locationRequest']>();
  const { requestLocation, loading, errorMessage } = useCurrentLocation();
  const state = useMemo<MapState>(() => ({
    picker: true, address: value, center: coordinates ?? undefined, locationRequest,
  }), [value, coordinates, locationRequest]);

  async function locate() {
    const coords = await requestLocation();
    if (coords) setLocationRequest({ lat: coords.latitude, lng: coords.longitude, id: Date.now() });
  }

  return (
    <View style={styles.field}>
      <Text style={sharedStyles.label}>Dirección</Text>
      <Text style={value ? styles.address : sharedStyles.muted}>
        {value || 'Busca tu dirección o confirma el punto exacto en el mapa.'}
      </Text>
      <Button title="Usar mi ubicación" onPress={locate} loading={loading} />
      {errorMessage && <FormAlert variant="info" message={errorMessage} />}
      {!!error && <FormAlert message={error} />}
      <GoogleMap height={420} state={state} onEvent={(event) => {
        if (event.type === 'address') onChange(event.address, event.point);
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  address: { color: colors.text, fontSize: 15 },
});
