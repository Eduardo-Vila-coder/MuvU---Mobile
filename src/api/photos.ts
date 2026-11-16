import axios from 'axios';

// Message used to recognize "not configured" without a custom Error class
export const UPLOAD_UNAVAILABLE = 'UPLOAD_UNAVAILABLE';

// Photos go straight from the phone to Cloudinary (unsigned upload preset).
// Cloudinary returns a public https URL, which is what our backend stores.
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

// Every photo goes through this ONE function: local URI (camera/gallery) -> public URL
export async function uploadPhoto(uri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error(UPLOAD_UNAVAILABLE);

  const fileName = uri.split('/').pop() ?? 'photo.jpg';
  const form = new FormData();
  // React Native sends a local file as { uri, name, type }
  form.append('file', { uri, name: fileName, type: getMimeType(fileName) } as unknown as Blob);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', 'muvu/mobile');

  // Plain axios on purpose: our `api` client would add the JWT header, and Cloudinary must not get it
  const { data } = await axios.post<{ secure_url: string }>(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
  );
  return data.secure_url;
}