import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomAddress } from '@/components/rooms/RoomAddress';
import { ActionLink } from '@/components/ui/ActionLink';
import { colors, sharedStyles } from '@/constants/theme';
import { PAYMENT_METHOD_LABELS, type AdPayment } from '@/types/payment';
import { formatDate } from '@/utils/dates';
import { formatPrice } from '@/utils/format';

interface AdPaymentCardProps {
  payment: AdPayment;
  active: boolean;
  onAdvertiseAgain: () => void;
}

// One row of the payment history (EP 035)
export function AdPaymentCard({ payment, active, onAdvertiseAgain }: AdPaymentCardProps) {
  return (
    <View style={sharedStyles.card}>
      <View style={styles.header}>
        <Text style={styles.amount}>{formatPrice(payment.monto)}</Text>
        <View style={[styles.badge, active ? styles.badgeActive : styles.badgeExpired]}>
          <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextExpired]}>
            {active ? 'Activo' : 'Vencido'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
        <View style={styles.rowContent}>
          <RoomAddress roomId={payment.habitacionId} />
        </View>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.info}>
          {formatDate(payment.fechaInicio)} → {formatDate(payment.fechaFin)}
        </Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="card-outline" size={16} color={colors.textMuted} />
        <Text style={styles.info}>{PAYMENT_METHOD_LABELS[payment.metodoPago]}</Text>
      </View>

      {!active && (
        <View style={styles.actions}>
          <ActionLink icon="sparkles-outline" label="Destacar de nuevo" onPress={onAdvertiseAgain} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  amount: { fontSize: 20, fontWeight: '800', color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: '#dcfce7' }, // green-100
  badgeExpired: { backgroundColor: '#f3f4f6' }, // gray-100
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextActive: { color: '#15803d' }, // green-700
  badgeTextExpired: { color: '#4b5563' }, // gray-600
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowContent: { flex: 1 },
  info: { fontSize: 14, color: colors.textSecondary },
  actions: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
});