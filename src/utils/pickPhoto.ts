import * as ImagePicker from 'expo-image-picker';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.7,
};

// Camera first; with no permission or no camera, the gallery. Returns the photo URI or null
export async function pickPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  let result: ImagePicker.ImagePickerResult | null = null;

  if (permission.granted) {
    try {
      result = await ImagePicker.launchCameraAsync(OPTIONS);
    } catch {
      result = null; // no camera (emulator): use the gallery
    }
  }
  // The gallery needs no permission request
  result ??= await ImagePicker.launchImageLibraryAsync(OPTIONS);

  return result.canceled ? null : result.assets[0].uri;
}