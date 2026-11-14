import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRooms } from '@/api/rooms';
import { RoomCard } from '@/components/rooms/RoomCard';
import { RoomListSkeleton } from '@/components/rooms/RoomCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PagedList } from '@/components/ui/PagedList';
import { colors, sharedStyles } from '@/constants/theme';
import { usePagedList } from '@/hooks/usePagedList';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/hooks/useToast';
import type { Room } from '@/types/room';

// EP 008 - all rooms (featured first) + accelerometer: shake to reload
export default function RoomsScreen() {
  const { showToast } = useToast();
  const list = usePagedList<Room>((params, signal) => getRooms(params, signal));
  const { reload } = list;

  // Must be stable: useShake re-subscribes when it changes
  const handleShake = useCallback(() => {
    reload();
    showToast('Actualizando habitaciones...', 'info');
  }, [reload, showToast]);
  const { isAvailable } = useShake(handleShake); // only listens while this tab is visible

  const header = (
    <View style={styles.header}>
      <Text style={sharedStyles.muted}>Las habitaciones destacadas aparecen primero.</Text>
      <View style={styles.hint}>
        <Ionicons
          name={isAvailable ? 'phone-portrait-outline' : 'arrow-down-outline'}
          size={16}
          color={colors.info}
        />
        {/* Fallback: without accelerometer, pull to refresh */}
        <Text style={styles.hintText}>
          {isAvailable ? 'Agita el celular para recargar la lista.' : 'Desliza hacia abajo para recargar la lista.'}
        </Text>
      </View>
    </View>
  );

  return (
    <PagedList
      list={list}
      keyExtractor={(room) => String(room.id)}
      itemLabel="habitaciones"
      header={header}
      loadingPlaceholder={<RoomListSkeleton />}
      emptyState={
        <EmptyState
          icon="bed-outline"
          title="Aún no hay habitaciones publicadas"
          description="Vuelve más tarde o agita el celular para recargar."
        />
      }
      renderItem={(room) => <RoomCard room={room} onPress={() => router.push(`/rooms/${room.id}`)} />}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.primaryLight,
  },
  hintText: { flex: 1, fontSize: 13, color: colors.info },
});