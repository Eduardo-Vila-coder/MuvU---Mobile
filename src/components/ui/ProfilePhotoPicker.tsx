import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import axios from 'axios';
import { getErrorMessage } from '@/api/errors';
import { UPLOAD_UNAVAILABLE, uploadPhoto } from '@/api/photos';
import { useToast } from '@/hooks/useToast';
import { pickPhoto } from '@/utils/pickPhoto';
import { ActionLink } from './ActionLink';
import { Avatar } from './Avatar';

interface ProfilePhotoPickerProps {
  name: string;
  photo: string | null;
  onSave: (url: string) => Promise<void>; // '' removes the photo
}

// Camera (or gallery) -> Cloudinary -> saved right away with the profile endpoint
export function ProfilePhotoPicker({ name, photo, onSave }: ProfilePhotoPickerProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function save(getUrl: () => Promise<string>, successMessage: string) {
    setBusy(true);
    try {
      await onSave(await getUrl());
      showToast(successMessage);
    } catch (err) {
      let message = getErrorMessage(err); // HTTP errors (Cloudinary or our backend)
      if (!axios.isAxiosError(err) && err instanceof Error) {
        message = err.message === UPLOAD_UNAVAILABLE ? 'Falta configurar Cloudinary para subir fotos.' : err.message;
      }
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleChange() {
    const uri = await pickPhoto();
    if (!uri) return; // the user cancelled
    await save(() => uploadPhoto(uri), 'Foto de perfil actualizada');
  }

  return (
    <View style={styles.container}>
      <View>
        <Avatar name={name} src={photo} size="xl" />
        {busy && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#ffffff" />
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <ActionLink icon="camera-outline" label={photo ? 'Cambiar foto' : 'Agregar foto'} onPress={handleChange} disabled={busy} />
        {photo && (
          <ActionLink
            icon="trash-outline"
            label="Quitar"
            danger
            disabled={busy}
            onPress={() => save(async () => '', 'Foto de perfil eliminada')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10 },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  actions: { flexDirection: 'row', gap: 20 },
});
