import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getErrorMessage } from '../../../../api/errors';
import { addRoomImage, deleteImage } from '../../../../api/images';
import { UPLOAD_UNAVAILABLE, uploadPhoto } from '../../../../api/photos';
import { getRoomImages } from '../../../../api/rooms';
import { ActionLink } from '../../../../components/ui/ActionLink';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { TextField } from '../../../../components/ui/TextField';
import { colors, sharedStyles } from '../../../../constants/theme';
import { useFetch } from '../../../../hooks/useFetch';
import { useForm, type FormErrors } from '../../../../hooks/useForm';
import { useToast } from '../../../../hooks/useToast';
import type { RoomImage } from '../../../../types/room';
import { pickPhoto } from '../../../../utils/pickPhoto';
import { validateUrl } from '../../../../utils/validators';

interface UrlValues {
  url: string;
}

const INITIAL_VALUES: UrlValues = { url: '' };

function validateUrlForm(values: UrlValues): FormErrors<UrlValues> {
  return { url: validateUrl(values.url) };
}

function getPhotoErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message === UPLOAD_UNAVAILABLE) {
    return 'Aún no se pueden subir fotos desde el celular. Pega la URL de una imagen ya publicada.';
  }
  return getErrorMessage(err);
}

// EP 010 (list) + EP 017 (add) + EP 018 (delete)
export default function RoomImagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { showToast } = useToast();
  const { data: images, error, reload } = useFetch(
    (signal) => getRoomImages(roomId, signal),
    [roomId],
  );
  const { values, setValue, getError, validateAll, setServerErrors, reset } = useForm(
    INITIAL_VALUES,
    validateUrlForm,
  );
  const [saving, setSaving] = useState(false);

  async function saveUrl(url: string) {
    await addRoomImage(roomId, { url });
    showToast('Imagen agregada');
    reload();
  }

  // Camera -> uploadPhoto (photo to URL) -> EP 017
  async function handleTakePhoto() {
    const uri = await pickPhoto();
    if (!uri) return; // the user cancelled

    setSaving(true);
    try {
      await saveUrl(await uploadPhoto(uri));
    } catch (err) {
      showToast(getPhotoErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  // Manual URL (same as the web)
  async function handleAddUrl() {
    if (!validateAll()) return;

    setSaving(true);
    try {
      await saveUrl(values.url.trim());
      reset();
    } catch (err) {
      setServerErrors({ url: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(image: RoomImage) {
    Alert.alert('Eliminar imagen', '¿Seguro que quieres eliminar esta imagen?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(image.id) },
    ]);
  }

  async function handleDelete(imageId: number) {
    try {
      await deleteImage(imageId);
      showToast('Imagen eliminada');
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  function renderGallery() {
    if (error) return <ErrorState message={error} onRetry={reload} />;
    if (!images) return <ActivityIndicator size="large" color={colors.primary} />;
    if (images.length === 0) {
      return (
        <EmptyState
          icon="images-outline"
          title="Aún no hay imágenes"
          description="Agrega fotos para que los estudiantes vean tu habitación."
        />
      );
    }
    return (
      <View style={styles.gallery}>
        {images.map((image) => (
          <View key={image.id} style={sharedStyles.card}>
            <Image source={{ uri: image.url }} style={styles.photo} resizeMode="cover" />
            <ActionLink icon="trash-outline" label="Eliminar" danger onPress={() => confirmDelete(image)} />
          </View>
        ))}
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
        <Text style={sharedStyles.sectionTitle}>Agregar imagen</Text>
        <Button title="Tomar foto" onPress={handleTakePhoto} loading={saving} />
        <Text style={sharedStyles.muted}>O pega la URL de una imagen ya publicada:</Text>
        <TextField
          label="URL de la imagen"
          value={values.url}
          onChangeText={(text) => setValue('url', text)}
          error={getError('url')}
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Agregar URL" variant="secondary" onPress={handleAddUrl} disabled={saving} />
      </View>

      <Text style={sharedStyles.sectionTitle}>Imágenes de la habitación</Text>
      {renderGallery()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gallery: { gap: 16 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.border },
});