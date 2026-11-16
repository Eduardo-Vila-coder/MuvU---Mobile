import * as ImagePicker from 'expo-image-picker';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.7,
};

export type PhotoSource = 'camera' | 'library';

// 'camera': camera first (with no permission or no camera, the gallery). 'library': straight to the gallery.
// Returns the local photo URI, or null if the user cancelled
export async function pickPhoto(source: PhotoSource = 'camera'): Promise<string | null> {
  let result: ImagePicker.ImagePickerResult | null = null;

  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      try {
        result = await ImagePicker.launchCameraAsync(OPTIONS);
      } catch {
        result = null; // no camera (emulator): use the gallery
      }
    }
  }
  // The gallery needs no permission request
  result ??= await ImagePicker.launchImageLibraryAsync(OPTIONS);

  return result.canceled ? null : result.assets[0].uri;
}
