import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage, getErrorStatus, mapFieldErrors } from '@/api/errors';
import { deleteLandlord, getLandlord, updateLandlord } from '@/api/landlords';
import { UPLOAD_UNAVAILABLE, uploadPhoto } from '@/api/photos';
import { RatingStars } from '@/components/ratings/RatingStars';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormAlert } from '@/components/ui/FormAlert';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TextField } from '@/components/ui/TextField';
import { colors, sharedStyles } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useForm, type FormErrors } from '@/hooks/useForm';
import { useLandlordId } from '@/hooks/useLandlordId';
import { useToast } from '@/hooks/useToast';
import type { Landlord } from '@/types/landlord';
import { pickPhoto } from '@/utils/pickPhoto';
import { validateName, validateUrl } from '@/utils/validators';

interface ProfileValues {
  name: string;
  dniPhotoUrl: string;
}

const SERVER_FIELDS: Record<string, keyof ProfileValues> = {
  nombre: 'name',
  dniFoto: 'dniPhotoUrl',
};

function validateProfile(values: ProfileValues): FormErrors<ProfileValues> {
  return {
    name: validateName(values.name),
    dniPhotoUrl: validateUrl(values.dniPhotoUrl, { required: false }),
  };
}

// EP 014 (data) + EP 015 (edit) + EP 040 (delete account)
export default function LandlordProfileScreen() {
  const landlordId = useLandlordId();
  const { data: landlord, loading, error, reload } = useFetch(
    (signal) => getLandlord(landlordId, signal),
    [landlordId],
  );

  // The admin may have verified the account from the web
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  if (loading && !landlord) return <ScreenLoader message="Cargando tu perfil..." />;
  if (!landlord) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No se pudo cargar tu perfil'} onRetry={reload} />
      </View>
    );
  }

  // Separate component so useForm starts with the loaded data
  return <ProfileContent landlord={landlord} onSaved={reload} />;
}

function ProfileContent({ landlord, onSaved }: { landlord: Landlord; onSaved: () => void }) {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { values, setValue, getError, validateAll, setServerErrors } = useForm(
    { name: landlord.nombre, dniPhotoUrl: '' },
    validateProfile,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Camera -> uploadPhoto (photo to URL) -> dniFoto field
  async function handleTakeDniPhoto() {
    const uri = await pickPhoto();
    if (!uri) return; // the user cancelled

    setUploading(true);
    try {
      setValue('dniPhotoUrl', await uploadPhoto(uri));
      showToast('Foto lista. Toca "Guardar cambios" para enviarla.', 'info');
    } catch (err) {
      const message =
        err instanceof Error && err.message === UPLOAD_UNAVAILABLE
          ? 'Aún no se pueden subir fotos desde el celular. Pega la URL de la foto de tu DNI.'
          : getErrorMessage(err);
      showToast(message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setFormError(null);
    if (!validateAll()) return;

    setSaving(true);
    try {
      await updateLandlord(landlord.id, {
        nombre: values.name.trim(),
        dniFoto: values.dniPhotoUrl.trim() || null, // empty -> the backend keeps the previous one
      });
      setValue('dniPhotoUrl', '');
      showToast('Perfil actualizado');
      onSaved();
    } catch (err) {
      setServerErrors(mapFieldErrors(err, SERVER_FIELDS));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // RequireRole sends the user to the login when the session is gone
  async function handleSignOut() {
    await signOut();
    showToast('Sesión cerrada', 'info');
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán tu cuenta y todas tus habitaciones. Esta acción no se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteAccount() },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteLandlord(landlord.id);
      await signOut();
      showToast('Tu cuenta fue eliminada', 'info');
    } catch (err) {
      setDeleting(false);
      const message =
        getErrorStatus(err) === 409
          ? 'No puedes eliminar tu cuenta porque tus habitaciones tienen reservas, calificaciones o pagos asociados.'
          : getErrorMessage(err);
      showToast(message, 'error');
    }
  }

  const hasRatings = landlord.totalCalificaciones > 0 && landlord.puntajePromedio != null;

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={sharedStyles.card}>
        <Text style={styles.name}>{landlord.nombre}</Text>
        <Text style={sharedStyles.muted}>{landlord.correo}</Text>

        {landlord.verificado ? (
          <View style={[styles.status, styles.verified]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={styles.verifiedText.color} />
            <Text style={[styles.statusText, styles.verifiedText]}>Cuenta verificada</Text>
          </View>
        ) : (
          <View style={[styles.status, styles.pending]}>
            <Ionicons name="hourglass-outline" size={18} color={styles.pendingText.color} />
            <Text style={[styles.statusText, styles.pendingText]}>
              Pendiente de verificación. Envía la foto de tu DNI abajo.
            </Text>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{landlord.cantidadHabitaciones}</Text>
            <Text style={sharedStyles.muted}>habitaciones</Text>
          </View>
          <View style={styles.stat}>
            {hasRatings ? (
              <>
                <RatingStars value={landlord.puntajePromedio ?? 0} />
                <Text style={sharedStyles.muted}>
                  {(landlord.puntajePromedio ?? 0).toFixed(1)} · {landlord.totalCalificaciones} calificaciones
                </Text>
              </>
            ) : (
              <Text style={sharedStyles.muted}>Sin calificaciones aún</Text>
            )}
          </View>
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>Editar perfil</Text>
        {formError && <FormAlert message={formError} />}
        <TextField
          label="Nombre"
          value={values.name}
          onChangeText={(text) => setValue('name', text)}
          error={getError('name')}
          autoComplete="name"
        />

        <Text style={sharedStyles.label}>Foto de tu DNI</Text>
        <Button title="Tomar foto del DNI" variant="secondary" onPress={handleTakeDniPhoto} loading={uploading} />
        <TextField
          label="O pega la URL de la foto"
          value={values.dniPhotoUrl}
          onChangeText={(text) => setValue('dniPhotoUrl', text)}
          error={getError('dniPhotoUrl')}
          hint="Si ya la enviaste antes, déjalo vacío para conservarla."
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button title={saving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} loading={saving} />
      </View>

      <View style={sharedStyles.card}>
        <Button title="Cerrar sesión" variant="secondary" onPress={handleSignOut} />
      </View>

      <View style={[sharedStyles.card, styles.dangerZone]}>
        <View style={styles.dangerTitleRow}>
          <Ionicons name="warning-outline" size={18} color={colors.dangerText} />
          <Text style={styles.dangerTitle}>Zona de peligro</Text>
        </View>
        <Text style={sharedStyles.muted}>
          Eliminar tu cuenta también borra todas tus habitaciones. No se puede si tienen reservas o calificaciones.
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
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 10 },
  statusText: { flex: 1, fontSize: 14, fontWeight: '500' },
  verified: { backgroundColor: '#f0fdf4' }, // green-50
  verifiedText: { color: '#15803d' }, // green-700
  pending: { backgroundColor: '#fffbeb' }, // amber-50
  pendingText: { color: '#b45309' }, // amber-700
  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  dangerZone: { borderColor: '#fecaca' }, // red-200
  dangerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: colors.dangerText },
});