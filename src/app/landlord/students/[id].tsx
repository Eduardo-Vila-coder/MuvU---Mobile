import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { getStudentProfile } from '@/api/students';
import { RatingStars } from '@/components/ratings/RatingStars';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { colors, sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';

// EP 025 - the landlord checks who the student is before confirming
export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);
  const { data: student, loading, error, reload } = useFetch(
    (signal) => getStudentProfile(studentId, signal),
    [studentId],
  );

  if (loading) return <ScreenLoader message="Cargando estudiante..." />;
  if (error || !student) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No encontramos al estudiante'} onRetry={reload} />
      </View>
    );
  }

  const average = student.puntuacionPromedio;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{student.nombre}</Text>
              {student.verificado && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
            </View>
            <View style={styles.nameRow}>
              <Ionicons name="school-outline" size={16} color={colors.textMuted} />
              <Text style={sharedStyles.muted}>{student.universidadNombre}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.label}>Calificaciones que ha dado</Text>
        {average != null ? (
          <View style={styles.ratingRow}>
            <RatingStars value={average} size={20} />
            <Text style={styles.ratingValue}>{average.toFixed(1)}</Text>
            <Text style={sharedStyles.muted}>({student.totalCalificaciones})</Text>
          </View>
        ) : (
          <Text style={sharedStyles.muted}>Aún no ha calificado habitaciones</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  headerText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingValue: { fontSize: 16, fontWeight: '700', color: colors.text },
});