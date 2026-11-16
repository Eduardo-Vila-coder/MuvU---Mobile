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
import { colors, sharedStyles } from '../../../../constants/theme';
import { useFetch } from '../../../../hooks/useFetch';
import { useToast } from '../../../../hooks/useToast';
import type { RoomImage } from '../../../../types/room';
import { pickPhoto, type PhotoSource } from '../../../../utils/pickPhoto';

function getPhotoErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message === UPLOAD_UNAVAILABLE) {
    return 'Falta configurar Cloudinary para subir fotos.';
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
  const [saving, setSaving] = useState(false);

  // Camera or gallery -> Cloudinary (the user never sees the link) -> EP 017 saves it
  async function handleAddPhoto(source: PhotoSource) {
    const uri = await pickPhoto(source);
    if (!uri) return; // the user cancelled

    setSaving(true);
    try {
      await addRoomImage(roomId, { url: await uploadPhoto(uri) });
      showToast('Foto agregada');
      reload();
    } catch (err) {
      showToast(getPhotoErrorMessage(err), 'error');
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
        <Text style={sharedStyles.sectionTitle}>Agregar foto</Text>
        <Text style={sharedStyles.muted}>Fotos claras del cuarto, el baño y las áreas comunes ayudan a que te reserven.</Text>
        <Button title={saving ? 'Subiendo foto...' : 'Tomar foto'} onPress={() => handleAddPhoto('camera')} loading={saving} />
        <Button title="Elegir de la galería" variant="secondary" onPress={() => handleAddPhoto('library')} disabled={saving} />
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