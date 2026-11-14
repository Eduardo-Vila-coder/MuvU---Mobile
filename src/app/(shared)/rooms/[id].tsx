import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { getRoomById } from '@/api/rooms';
import { RequireRole } from '@/components/auth/RequireRole';
import { RoomRatings } from '@/components/ratings/RoomRatings';
import { RoomGallery } from '@/components/rooms/RoomGallery';
import { RoomRouteMap } from '@/components/rooms/RoomRouteMap';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { colors, sharedStyles, stackScreenOptions } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { formatArea, formatPrice } from '@/utils/format';

// Shared by both roles. The root Stack hides headers, so this screen turns its own on
export default function RoomDetailRoute() {
  return (
    <RequireRole allowedRoles={['ESTUDIANTE', 'ARRENDADOR']}>
      <Stack.Screen options={{ ...stackScreenOptions, headerShown: true, title: 'Detalle de la habitación' }} />
      <RoomDetailScreen />
    </RequireRole>
  );
}

// EP 009 (room) + EP 011 (reviews)
function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { user } = useAuth();
  const { data: room, loading, error, errorStatus, reload } = useFetch(
    (signal) => getRoomById(roomId, signal),
    [roomId],
  );

  if (loading) return <ScreenLoader message="Cargando habitación..." />;

  // 404 (doesn't exist) or 400 (id is not a number)
  if (errorStatus === 404 || errorStatus === 400 || !Number.isInteger(roomId)) {
    return (
      <View style={sharedStyles.centered}>
        <EmptyState
          icon="search-outline"
          title="Esta habitación no existe"
          description="Puede que haya sido eliminada o que el enlace sea incorrecto."
          action={<Button title="Volver" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  if (error || !room) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No se pudo cargar la habitación'} onRetry={reload} />
      </View>
    );
  }

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <RoomGallery images={room.imagenes} />

      <View style={sharedStyles.card}>
        <Text style={styles.price}>
          {formatPrice(room.precio)}
          <Text style={styles.perMonth}> /mes</Text>
        </Text>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.address}>{room.direccion}</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={sharedStyles.muted}>Área</Text>
            <Text style={styles.statValue}>{formatArea(room.area)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={sharedStyles.muted}>Fotos</Text>
            <Text style={styles.statValue}>{room.imagenes.length}</Text>
          </View>
        </View>
        {user?.role === 'ARRENDADOR' && (
          <Text style={[sharedStyles.muted, styles.note]}>Solo los estudiantes pueden reservar habitaciones.</Text>
        )}
        {/* Lote B: "Reservar" button for students */}
      </View>

      <RoomRouteMap latitude={room.latitud} longitude={room.longitud} />
      <RoomRatings roomId={room.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  price: { fontSize: 28, fontWeight: '800', color: colors.text },
  perMonth: { fontSize: 15, fontWeight: '400', color: colors.textMuted },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  address: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  stats: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  stat: { flex: 1, gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  note: { textAlign: 'center' },
});