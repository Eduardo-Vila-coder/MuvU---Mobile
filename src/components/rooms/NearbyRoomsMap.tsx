import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getRoomImages } from '@/api/rooms';
import { sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import type { Room } from '@/types/room';
import type { University } from '@/types/university';
import { formatPrice } from '@/utils/format';
import { GoogleMap } from '../maps/GoogleMap';
import type { MapState, TravelMode } from '../maps/types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { RoomCard } from './RoomCard';
import { RoomGallery } from './RoomGallery';

export function NearbyRoomsMap({ rooms, university, radiusKm, hasMore, onLoadMore, loadingMore }: {
  rooms: Room[];
  university: University;
  radiusKm: number;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<TravelMode>('DRIVING');
  const [times, setTimes] = useState<{ key: string; values: Partial<Record<TravelMode, string | null>> }>({ key: '', values: {} });
  const selected = rooms.find((room) => room.id === selectedId);
  const state = useMemo<MapState>(() => ({
    rooms: rooms.map((room) => ({ id: room.id, lat: room.latitud, lng: room.longitud, address: room.direccion, price: formatPrice(room.precio) })),
    center: { lat: university.latitud, lng: university.longitud },
    centerTitle: university.nombre, radiusKm,
    origin: selected ? { lat: selected.latitud, lng: selected.longitud } : undefined,
    destination: selected ? { lat: university.latitud, lng: university.longitud } : undefined,
    travelMode: mode,
  }), [rooms, university, radiusKm, selected, mode]);
  const routeKey = JSON.stringify([state.origin, state.destination]);

  return (
    <View style={styles.container}>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>Habitaciones en el mapa</Text>
        <Text style={sharedStyles.muted}>Radio de {radiusKm} km · {rooms.length} habitaciones cargadas. Toca un marcador para ver la habitación y su ruta.</Text>
        <GoogleMap state={state} onEvent={(event) => {
          if (event.type === 'error') setTimes({ key: routeKey, values: { DRIVING: null, TRANSIT: null, WALKING: null } });
          if (event.type === 'room' && rooms.some((room) => room.id === event.id)) router.push(`/rooms/${event.id}`);
          if (event.type === 'selectRoom') setSelectedId(event.id);
          if (event.type === 'route' && event.key === routeKey) setTimes((previous) => ({ key: routeKey,
            values: { ...(previous.key === routeKey ? previous.values : {}), [event.mode]: event.duration },
          }));
        }} />
        {selected && !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && <View style={styles.chips}>
          {([{ value: 'DRIVING', label: 'Automóvil' }, { value: 'TRANSIT', label: 'Transporte público' },
            { value: 'WALKING', label: 'A pie' }] as const).map((item) => {
            const duration = times.key === routeKey ? times.values[item.value] : undefined;
            return <Chip key={item.value} selected={mode === item.value} onPress={() => setMode(item.value)}
              label={`${item.label}: ${duration === undefined ? 'Calculando…' : duration ?? 'Sin ruta'}`} />;
          })}
        </View>}
        {hasMore && <Button title="Cargar más habitaciones en el mapa" variant="secondary" onPress={onLoadMore} loading={loadingMore} />}
      </View>
      {selected && <SelectedMapRoom key={selected.id} room={selected} />}
    </View>
  );
}

function SelectedMapRoom({ room }: { room: Room }) {
  const { data: images } = useFetch((signal) => getRoomImages(room.id, signal), [room.id]);
  return <View style={styles.container}>
    {!!images?.length && <RoomGallery images={images} />}
    <RoomCard room={room} onPress={() => router.push(`/rooms/${room.id}`)}
      actions={<Button title="Ver habitación" onPress={() => router.push(`/rooms/${room.id}`)} />} />
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
