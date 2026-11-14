import { useState, type ReactElement } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getNearbyRooms } from '@/api/rooms';
import { RoomCard } from '@/components/rooms/RoomCard';
import { RoomListSkeleton } from '@/components/rooms/RoomCardSkeleton';
import { UniversityPicker } from '@/components/UniversityPicker';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/ui/FormAlert';
import { PagedList } from '@/components/ui/PagedList';
import { colors, sharedStyles } from '@/constants/theme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { usePagedList } from '@/hooks/usePagedList';
import { useUniversities } from '@/hooks/useUniversities';
import type { Room } from '@/types/room';
import { findNearestUniversity } from '@/utils/geo';

const RADIUS_OPTIONS = [1, 3, 5, 10];
const DEFAULT_RADIUS = 5;

// EP 012 - rooms near a university. GPS picks the nearest one; manual choice as fallback
export default function NearbyScreen() {
  const { universities, loading: loadingUniversities, error: universitiesError } = useUniversities();
  const { loading: locating, errorMessage: locationError, requestLocation } = useCurrentLocation();
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);

  // GPS -> nearest university (Haversine in utils/geo)
  async function handleUseLocation() {
    setLocationInfo(null);
    const coords = await requestLocation();
    if (!coords) return; // the hook already explains why (permission denied, GPS off...)

    const nearest = findNearestUniversity(coords, universities);
    if (!nearest) return;
    setUniversityId(nearest.university.id);
    setLocationInfo(
      `La universidad más cercana es ${nearest.university.nombre} (a ${nearest.distance.toFixed(1)} km de ti).`,
    );
  }

  function handleSelectUniversity(id: number) {
    setUniversityId(id);
    setLocationInfo(null);
  }

  const filters = (
    <View style={sharedStyles.card}>
      <Button
        title={locating ? 'Buscando tu ubicación...' : 'Usar mi ubicación'}
        onPress={handleUseLocation}
        loading={locating}
        disabled={loadingUniversities || universities.length === 0}
      />
      {locationError && <FormAlert variant="info" message={locationError} />}
      {locationInfo && <FormAlert variant="info" message={locationInfo} />}

      <Text style={sharedStyles.label}>Universidad</Text>
      {loadingUniversities ? (
        <ActivityIndicator color={colors.primary} />
      ) : universitiesError ? (
        <FormAlert message={universitiesError} />
      ) : (
        <UniversityPicker
          universities={universities}
          selectedId={universityId}
          onSelect={handleSelectUniversity}
        />
      )}

      <Text style={sharedStyles.label}>Radio de búsqueda</Text>
      <View style={styles.chips}>
        {RADIUS_OPTIONS.map((radius) => (
          <Chip
            key={radius}
            label={`${radius} km`}
            selected={radius === radiusKm}
            onPress={() => setRadiusKm(radius)}
          />
        ))}
      </View>
    </View>
  );

  if (universityId === null) {
    return (
      <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
        {filters}
        <EmptyState
          icon="school-outline"
          title="Elige tu universidad"
          description="Usa tu ubicación o elígela de la lista. Te mostraremos las habitaciones más cercanas."
        />
      </ScrollView>
    );
  }

  // A new key restarts the list from page 0 when a filter changes
  return (
    <NearbyRoomsList
      key={`${universityId}-${radiusKm}`}
      universityId={universityId}
      radiusKm={radiusKm}
      header={filters}
      onWidenRadius={setRadiusKm}
    />
  );
}

interface NearbyRoomsListProps {
  universityId: number;
  radiusKm: number;
  header: ReactElement;
  onWidenRadius: (radius: number) => void;
}

function NearbyRoomsList({ universityId, radiusKm, header, onWidenRadius }: NearbyRoomsListProps) {
  const list = usePagedList<Room>((params, signal) =>
    getNearbyRooms({ ...params, universidadId: universityId, radioKm: radiusKm }, signal),
  );
  const widerRadius = RADIUS_OPTIONS.find((radius) => radius > radiusKm);

  return (
    <PagedList
      list={list}
      keyExtractor={(room) => String(room.id)}
      itemLabel="habitaciones"
      header={header}
      loadingPlaceholder={<RoomListSkeleton />}
      emptyState={
        <EmptyState
          icon="search-outline"
          title={`No hay habitaciones a menos de ${radiusKm} km`}
          description="Prueba con un radio de búsqueda mayor."
          action={
            widerRadius ? (
              <Button title={`Ampliar a ${widerRadius} km`} onPress={() => onWidenRadius(widerRadius)} />
            ) : undefined
          }
        />
      }
      renderItem={(room) => <RoomCard room={room} onPress={() => router.push(`/rooms/${room.id}`)} />}
    />
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});