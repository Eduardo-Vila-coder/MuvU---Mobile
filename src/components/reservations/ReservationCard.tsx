import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStudentProfile } from '@/api/students';
import { RoomAddress } from '@/components/rooms/RoomAddress';
import { colors, sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import type { Reservation } from '@/types/reservation';
import { countNights, formatDate } from '@/utils/dates';
import { ReservationStatusBadge } from './ReservationStatusBadge';

interface ReservationCardProps {
  reservation: Reservation;
  showStudent?: boolean; // landlord view: who made the request
  actions?: ReactNode;
}

function InfoRow({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

// EP 025 - name and university of the student
function StudentName({ studentId }: { studentId: number }) {
  const { data: student, loading } = useFetch((signal) => getStudentProfile(studentId, signal), [studentId]);

  if (loading) return <Text style={sharedStyles.muted}>Cargando estudiante...</Text>;
  return (
    <Text style={styles.info}>
      {student ? `${student.nombre} · ${student.universidadNombre}` : `Estudiante #${studentId}`}
    </Text>
  );
}

// Shared by students and landlords: `actions` is the only part that changes
export function ReservationCard({ reservation, showStudent = false, actions }: ReservationCardProps) {
  const nights = countNights(reservation.fecha_inicio, reservation.fecha_fin);

  return (
    <View style={sharedStyles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Reserva #{reservation.id}</Text>
        <ReservationStatusBadge status={reservation.estado} />
      </View>

      <InfoRow icon="location-outline">
        <RoomAddress roomId={reservation.habitacionId} />
      </InfoRow>

      <InfoRow icon="calendar-outline">
        <Text style={styles.info}>
          {formatDate(reservation.fecha_inicio)} → {formatDate(reservation.fecha_fin)} · {nights}{' '}
          {nights === 1 ? 'noche' : 'noches'}
        </Text>
      </InfoRow>

      {showStudent && (
        <InfoRow icon="person-outline">
          <StudentName studentId={reservation.estudianteId} />
        </InfoRow>
      )}

      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowContent: { flex: 1 },
  info: { fontSize: 14, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
});