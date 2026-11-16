import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage, getErrorStatus, mapFieldErrors } from '@/api/errors';
import { deleteLandlord, getLandlord, updateLandlord } from '@/api/landlords';
import { UPLOAD_UNAVAILABLE, uploadPhoto } from '@/api/photos';
import { RatingStars } from '@/components/ratings/RatingStars';
import { ActionLink } from '@/components/ui/ActionLink';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormAlert } from '@/components/ui/FormAlert';
import { ProfilePhotoPicker } from '@/components/ui/ProfilePhotoPicker';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TextField } from '@/components/ui/TextField';
import { colors, sharedStyles } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useForm, type FormErrors } from '@/hooks/useForm';
import { useLandlordId } from '@/hooks/useLandlordId';
import { useToast } from '@/hooks/useToast';
import type { Landlord } from '@/types/landlord';
import { pickPhoto, type PhotoSource } from '@/utils/pickPhoto';
import { normalizePhone, validateName, validatePhone, validateUrl } from '@/utils/validators';

interface ProfileValues {
  name: string;
  dniPhotoUrl: string;
  phone: string;
}

const SERVER_FIELDS: Record<string, keyof ProfileValues> = {
  nombre: 'name',
  dniFoto: 'dniPhotoUrl',
  telefono: 'phone',
};

function validateProfile(values: ProfileValues): FormErrors<ProfileValues> {
  return {
    name: validateName(values.name),
    dniPhotoUrl: validateUrl(values.dniPhotoUrl, { required: false }),
    phone: validatePhone(values.phone),
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
    { name: landlord.nombre, dniPhotoUrl: '', phone: landlord.telefono ?? '' },
    validateProfile,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Camera or gallery -> Cloudinary -> kept in the form (the user only sees the thumbnail)
  async function handlePickDniPhoto(source: PhotoSource) {
    const uri = await pickPhoto(source);
    if (!uri) return; // the user cancelled

    setUploading(true);
    try {
      setValue('dniPhotoUrl', await uploadPhoto(uri));
      showToast('Foto lista. Toca "Guardar cambios" para enviarla.', 'info');
    } catch (err) {
      const message =
        err instanceof Error && err.message === UPLOAD_UNAVAILABLE
          ? 'Falta configurar Cloudinary para subir fotos.'
          : getErrorMessage(err);
      showToast(message, 'error');
    } finally {
      setUploading(false);
    }
  }

  // Profile photo: saved right away (dniFoto null = the backend keeps the current DNI)
  async function handleSavePhoto(url: string) {
    await updateLandlord(landlord.id, { nombre: landlord.nombre, dniFoto: null, fotoPerfil: url });
    onSaved();
  }

  async function handleSave() {
    setFormError(null);
    if (!validateAll()) return;

    setSaving(true);
    try {
      await updateLandlord(landlord.id, {
        nombre: values.name.trim(),
        dniFoto: values.dniPhotoUrl.trim() || null, // empty -> the backend keeps the previous one
        telefono: normalizePhone(values.phone), // '' = no phone
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
        <ProfilePhotoPicker name={landlord.nombre} photo={landlord.fotoPerfil} onSave={handleSavePhoto} />
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
        <TextField
          label="Celular (opcional)"
          value={values.phone}
          onChangeText={(text) => setValue('phone', text)}
          error={getError('phone')}
          hint="Solo se comparte con la otra parte cuando se confirma una reserva"
          placeholder="987 654 321"
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={15}
        />

        <Text style={sharedStyles.label}>Foto de tu DNI</Text>
        <Text style={sharedStyles.muted}>
          El administrador la revisa para verificar tu cuenta. Si ya la enviaste, no hace falta volver a hacerlo.
        </Text>
        {values.dniPhotoUrl ? (
          <View style={styles.dniBox}>
            <Image source={{ uri: values.dniPhotoUrl }} style={styles.dniPreview} resizeMode="contain" />
            <Text style={styles.dniReady}>Foto lista. Toca “Guardar cambios” para enviarla.</Text>
            <View style={styles.dniActions}>
              <ActionLink icon="camera-outline" label="Cambiar" onPress={() => handlePickDniPhoto('camera')} disabled={uploading} />
              <ActionLink icon="close-circle-outline" label="Quitar" danger onPress={() => setValue('dniPhotoUrl', '')} />
            </View>
          </View>
        ) : uploading ? (
          <View style={styles.dniUploading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={sharedStyles.muted}>Subiendo foto...</Text>
          </View>
        ) : (
          <>
            <Button title="Tomar foto del DNI" variant="secondary" onPress={() => handlePickDniPhoto('camera')} />
            <Button title="Elegir de la galería" variant="secondary" onPress={() => handlePickDniPhoto('library')} />
          </>
        )}
        {getError('dniPhotoUrl') ? <Text style={styles.error}>{getError('dniPhotoUrl')}</Text> : null}

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
  dniBox: { gap: 8 },
  dniPreview: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12, backgroundColor: colors.background },
  dniReady: { fontSize: 13, color: '#15803d' }, // green-700
  dniActions: { flexDirection: 'row', gap: 20 },
  dniUploading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  error: { fontSize: 13, color: colors.danger },
  dangerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: colors.dangerText },
});