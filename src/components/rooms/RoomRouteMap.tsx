import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, sharedStyles } from '@/constants/theme';
import { useUniversities } from '@/hooks/useUniversities';
import { distanceKm } from '@/utils/geo';
import { GoogleMap } from '../maps/GoogleMap';
import { isMapPoint, type MapState, type TravelMode } from '../maps/types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { FormAlert } from '../ui/FormAlert';

const MODES: { value: TravelMode; label: string; url: string }[] = [
  { value: 'DRIVING', label: 'Automóvil', url: 'driving' },
  { value: 'TRANSIT', label: 'Transporte público', url: 'transit' },
  { value: 'WALKING', label: 'A pie', url: 'walking' },
];

export function RoomRouteMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { universities, loading, error } = useUniversities();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<TravelMode>('DRIVING');
  const [routeTimes, setRouteTimes] = useState<{
    key: string; values: Partial<Record<TravelMode, string | null>>;
  }>({ key: '', values: {} });
  const [linkError, setLinkError] = useState<string | null>(null);
  const closest = useMemo(() => universities
    .filter((u) => isMapPoint({ lat: u.latitud, lng: u.longitud }))
    .map((university) => ({ university, distance: distanceKm({ latitude, longitude }, {
      latitude: university.latitud, longitude: university.longitud,
    }) }))
    .sort((a, b) => a.distance - b.distance).slice(0, 5), [universities, latitude, longitude]);
  const selected = (closest.find(({ university }) => university.id === selectedId) ?? closest[0])?.university;
  const state = useMemo<MapState>(() => ({
    origin: { lat: latitude, lng: longitude },
    destination: selected ? { lat: selected.latitud, lng: selected.longitud } : undefined,
    centerTitle: selected?.nombre, travelMode: mode,
  }), [latitude, longitude, selected, mode]);
  const routeKey = JSON.stringify([state.origin, state.destination]);

  async function openMaps() {
    const origin = `${latitude},${longitude}`;
    const destination = selected ? `${selected.latitud},${selected.longitud}` : origin;
    const url = selected
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${MODES.find((item) => item.value === mode)?.url}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(origin)}`;
    try { setLinkError(null); await Linking.openURL(url); }
    catch { setLinkError('No se pudo abrir Google Maps. Inténtalo otra vez.'); }
  }

  if (!isMapPoint(state.origin)) return <FormAlert variant="info" message="Esta habitación no tiene una ubicación válida." />;

  return (
    <View style={sharedStyles.card}>
      <Text style={sharedStyles.sectionTitle}>Ubicación y rutas</Text>
      {loading && <ActivityIndicator color={colors.primary} />}
      {error && <FormAlert message="No se pudieron cargar las universidades. Puedes consultar la ubicación de la habitación." />}
      {!loading && !error && !closest.length && <Text style={sharedStyles.muted}>Todavía no hay universidades para calcular rutas.</Text>}
      {!!closest.length && <>
        <Text style={sharedStyles.label}>Universidades más cercanas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {closest.map(({ university, distance }) => <Chip key={university.id}
            label={`${university.nombre} · ${distance.toFixed(1)} km`}
            selected={university.id === selected?.id} onPress={() => setSelectedId(university.id)} />)}
        </ScrollView>
        <Text style={sharedStyles.muted}>Distancias en línea recta. Los tiempos dependen del trayecto.</Text>
      </>}
      <GoogleMap state={state} onEvent={(event) => {
        if (event.type === 'error') setRouteTimes({ key: routeKey, values: { DRIVING: null, TRANSIT: null, WALKING: null } });
        if (event.type === 'route' && event.key === routeKey) setRouteTimes((previous) => ({ key: routeKey,
          values: { ...(previous.key === routeKey ? previous.values : {}), [event.mode]: event.duration },
        }));
      }} />
      {selected && !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && <View style={styles.chips}>
        {MODES.map((item) => {
          const duration = routeTimes.key === routeKey ? routeTimes.values[item.value] : undefined;
          const time = duration === undefined ? 'Calculando…' : duration ?? 'Sin ruta';
          return <Chip key={item.value} label={`${item.label}: ${time}`}
            selected={mode === item.value} onPress={() => setMode(item.value)} />;
        })}
      </View>}
      {linkError && <FormAlert message={linkError} />}
      <Button title="Abrir en Google Maps" variant="secondary" onPress={openMaps} />
    </View>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
