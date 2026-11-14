import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getErrorMessage, getErrorStatus } from '@/api/errors';
import { deleteStudent, getStudent } from '@/api/students';
import { ProfileForm } from '@/components/students/ProfileForm';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormAlert } from '@/components/ui/FormAlert';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { colors, sharedStyles } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { useUniversities } from '@/hooks/useUniversities';
import type { Student } from '@/types/student';
import type { University } from '@/types/university';

// EP 031 (data) + EP 032 (edit, in ProfileForm) + EP 033 (delete account)
export default function StudentProfileScreen() {
  const { user } = useAuth();
  const studentId = user?.id ?? 0;
  const { data: student, loading, error, reload } = useFetch(
    (signal) => getStudent(studentId, signal),
    [studentId],
  );
  const { universities, loading: loadingUniversities, error: universitiesError } = useUniversities();

  if ((loading && !student) || loadingUniversities) return <ScreenLoader message="Cargando tu perfil..." />;
  if (!student) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No se pudo cargar tu perfil'} onRetry={reload} />
      </View>
    );
  }

  return (
    <ProfileContent
      student={student}
      universities={universities}
      universitiesError={universitiesError}
      onSaved={reload}
    />
  );
}

interface ProfileContentProps {
  student: Student;
  universities: University[];
  universitiesError: string | null;
  onSaved: () => void;
}

function ProfileContent({ student, universities, universitiesError, onSaved }: ProfileContentProps) {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  // The backend returns the university NAME, the form needs its ID
  const initialUniversityId = universities.find((u) => u.nombre === student.universidadNombre)?.id ?? null;

  // RequireRole sends the user to the login when the session is gone
  async function handleSignOut() {
    await signOut();
    showToast('Sesión cerrada', 'info');
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta',
      'Perderás el acceso a MuvU con este correo. Esta acción no se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteAccount() },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteStudent(student.id);
      await signOut();
      showToast('Tu cuenta fue eliminada', 'info');
    } catch (err) {
      setDeleting(false);
      const message =
        getErrorStatus(err) === 409
          ? 'No puedes eliminar tu cuenta porque tienes reservas o calificaciones registradas.'
          : getErrorMessage(err);
      showToast(message, 'error');
    }
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={sharedStyles.card}>
        <Text style={styles.name}>{student.nombre}</Text>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
          <Text style={sharedStyles.muted}>{student.correo}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="school-outline" size={16} color={colors.textMuted} />
          <Text style={sharedStyles.muted}>{student.universidadNombre}</Text>
        </View>
        {student.verificado ? (
          <View style={[styles.status, styles.verified]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={styles.verifiedText.color} />
            <Text style={[styles.statusText, styles.verifiedText]}>Cuenta verificada</Text>
          </View>
        ) : (
          <View style={[styles.status, styles.pending]}>
            <Ionicons name="hourglass-outline" size={18} color={styles.pendingText.color} />
            <Text style={[styles.statusText, styles.pendingText]}>Cuenta sin verificar</Text>
          </View>
        )}
      </View>

      {universitiesError && <FormAlert message={universitiesError} />}
      <ProfileForm
        student={student}
        universities={universities}
        initialUniversityId={initialUniversityId}
        onSaved={onSaved}
      />

      <View style={sharedStyles.card}>
        <Button title="Mis reseñas" variant="secondary" onPress={() => router.push('/student/reviews')} />
        <Button title="Cerrar sesión" variant="secondary" onPress={handleSignOut} />
      </View>

      <View style={[sharedStyles.card, styles.dangerZone]}>
        <View style={styles.row}>
          <Ionicons name="warning-outline" size={18} color={colors.dangerText} />
          <Text style={styles.dangerTitle}>Zona de peligro</Text>
        </View>
        <Text style={sharedStyles.muted}>
          Eliminar tu cuenta es permanente. No se puede si tienes reservas o calificaciones.
        </Text>
        <Button
          title={deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
          variant="danger"
          onPress={confirmDeleteAccount}
          loading={deleting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 10 },
  statusText: { flex: 1, fontSize: 14, fontWeight: '500' },
  verified: { backgroundColor: '#f0fdf4' }, // green-50
  verifiedText: { color: '#15803d' }, // green-700
  pending: { backgroundColor: '#fffbeb' }, // amber-50
  pendingText: { color: '#b45309' }, // amber-700
  dangerZone: { borderColor: '#fecaca' }, // red-200
  dangerTitle: { fontSize: 16, fontWeight: '700', color: colors.dangerText },
});