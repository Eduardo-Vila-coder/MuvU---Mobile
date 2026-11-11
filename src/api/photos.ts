// Message used to recognize "not implemented yet" without a custom Error class
export const UPLOAD_UNAVAILABLE = 'UPLOAD_UNAVAILABLE';

// The backend has no upload endpoint. Every photo goes through this ONE function.
// TODO: send the file to the storage the team chooses and return its public https URL
export async function uploadPhoto(uri: string): Promise<string> {
  void uri;
  throw new Error(UPLOAD_UNAVAILABLE);
}