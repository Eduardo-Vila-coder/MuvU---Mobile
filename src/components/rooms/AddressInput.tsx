import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export function AddressInput({ value, coordinates, onChange, error }: AddressInputProps) {
  const [open, setOpen] = useState(false);
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
      {!!value && <Text style={styles.address}>{value}</Text>}
      <Button title={value ? 'Cambiar ubicación en el mapa' : 'Seleccionar dirección en el mapa'} variant="secondary"
        onPress={() => { setLocationRequest(undefined); setOpen(true); }} />
      <Text style={sharedStyles.muted}>Busca una dirección o confirma un punto en el mapa.</Text>
      {!!error && <FormAlert message={error} />}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={sharedStyles.screen}>
          <View style={styles.header}>
            <Text style={sharedStyles.sectionTitle}>Ubicación de la habitación</Text>
            <Button title="Cerrar" variant="secondary" onPress={() => setOpen(false)} />
          </View>
          <ScrollView contentContainerStyle={sharedStyles.content} keyboardShouldPersistTaps="handled">
            <Button title="Usar mi ubicación" onPress={locate} loading={loading} />
            {errorMessage && <FormAlert variant="info" message={errorMessage} />}
            {open && <GoogleMap height={470} state={state} onEvent={(event) => {
              if (event.type === 'address') {
                onChange(event.address, event.point);
                setOpen(false);
              }
            }} />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  address: { color: colors.text, fontSize: 15 },
  header: { padding: 16, gap: 12, borderBottomWidth: 1, borderColor: colors.border },
});
