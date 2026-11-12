import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sharedStyles } from '../../constants/theme';
import type { Room } from '../../types/room';
import { formatArea, formatPrice } from '../../utils/format';

interface RoomCardProps {
  room: Room;
  onPress?: () => void;
  actions?: ReactNode; // buttons under the info (landlord: edit, delete...)
}

// Shared by students and landlords: `actions` is the only part that changes
export function RoomCard({ room, onPress, actions }: RoomCardProps) {
  return (
    <View style={sharedStyles.card}>
      <TouchableOpacity activeOpacity={0.8} disabled={!onPress} onPress={onPress} style={styles.info}>
        {room.esDestacada && (
          <View style={styles.badge}>
            <Ionicons name="star" size={12} color={colors.featuredText} />
            <Text style={styles.badgeText}>Destacada</Text>
          </View>
        )}
        <Text style={styles.price}>{formatPrice(room.precio)}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.address}>{room.direccion}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="resize-outline" size={16} color={colors.textMuted} />
          <Text style={sharedStyles.muted}>{formatArea(room.area)}</Text>
          {room.distanciaKm !== null && (
            <Text style={sharedStyles.muted}>· a {room.distanciaKm} km de la universidad</Text>
          )}
        </View>
      </TouchableOpacity>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  info: { gap: 6 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.featured,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.featuredText },
  price: { fontSize: 22, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  address: { flex: 1, fontSize: 15, color: colors.textSecondary },
});