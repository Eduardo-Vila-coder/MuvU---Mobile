import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, sharedStyles } from '@/constants/theme';
import { Button } from '../ui/Button';
import { FormAlert } from '../ui/FormAlert';
import { MapSurface } from './MapSurface';
import type { MapEvent, MapState } from './types';

export function GoogleMap({ state, onEvent, height = 340 }: {
  state: MapState;
  onEvent?: (event: MapEvent) => void;
  height?: number;
}) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  if (!apiKey) return <FormAlert variant="info" message="Falta configurar la clave de Google Maps para mostrar el mapa y buscar direcciones." />;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.error}>
          <FormAlert message={error} />
          <Button title="Reintentar mapa" variant="secondary" onPress={() => {
            setError(null); setLoading(true); setAttempt((value) => value + 1);
          }} />
        </View>
      ) : (
        <View style={{ height }}>
          <MapSurface key={attempt} apiKey={apiKey} state={state} onEvent={(event) => {
            if (event.type === 'ready') setLoading(false);
            if (event.type === 'error') { setError(event.message); setLoading(false); }
            onEvent?.(event);
          }} />
          {loading && <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
            <Text style={sharedStyles.muted}>Cargando mapa…</Text>
          </View>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  loading: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface },
  error: { padding: 12, gap: 12 },
});
