import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ReservationStatus } from '@/types/reservation';

interface StatusConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  color: string;
}

// Same colors as the web badge (Tailwind)
const STATUS_CONFIG: Record<ReservationStatus, StatusConfig> = {
  PENDIENTE: { label: 'Pendiente', icon: 'time-outline', background: '#fef3c7', color: '#92400e' }, // amber-100 / amber-800
  CONFIRMADO: { label: 'Confirmada', icon: 'checkmark-circle-outline', background: '#dcfce7', color: '#166534' }, // green-100 / green-800
  CANCELADO: { label: 'Cancelada', icon: 'close-circle-outline', background: '#e5e7eb', color: '#374151' }, // gray-200 / gray-700
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { label, icon, background, color } = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: { fontSize: 12, fontWeight: '700' },
});