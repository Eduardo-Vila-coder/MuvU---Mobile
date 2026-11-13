import { StyleSheet, Text } from 'react-native';
import { getRoomById } from '@/api/rooms';
import { colors, sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';

// Reservations and payments only bring the room id: load its address (EP 009)
export function RoomAddress({ roomId }: { roomId: number }) {
  const { data: room, loading } = useFetch((signal) => getRoomById(roomId, signal), [roomId]);

  if (loading) return <Text style={sharedStyles.muted}>Cargando dirección...</Text>;
  return (
    <Text style={styles.text} numberOfLines={2}>
      {room ? room.direccion : `Habitación #${roomId}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, color: colors.textSecondary },
});