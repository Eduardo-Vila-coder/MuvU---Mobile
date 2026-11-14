import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { getRoomById } from '@/api/rooms';
import { ReservationForm } from '@/components/reservations/ReservationForm';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { colors, sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice } from '@/utils/format';

// EP 009 (room summary) + ReservationForm (EP 021)
export default function ReserveScreen() {
  const { roomId: roomIdParam } = useLocalSearchParams<{ roomId: string }>();
  const roomId = Number(roomIdParam);
  const { data: room, loading, error, reload } = useFetch(
    (signal) => getRoomById(roomId, signal),
    [roomId],
  );

  if (loading) return <ScreenLoader message="Cargando habitación..." />;
  if (error || !room) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No encontramos la habitación'} onRetry={reload} />
      </View>
    );
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={sharedStyles.card}>
        <View style={styles.row}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.address}>{room.direccion}</Text>
        </View>
        <Text style={styles.price}>
          {formatPrice(room.precio)}
          <Text style={sharedStyles.muted}> /mes</Text>
        </Text>
      </View>

      <ReservationForm roomId={room.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  address: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  price: { fontSize: 22, fontWeight: '800', color: colors.text },
});