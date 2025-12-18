import { uploadData, remove, getUrl } from 'aws-amplify/storage';

const PHOTO_PREFIX = 'profile-photos';
const RANDOM_BASE = 36;
const RANDOM_SLICE_START = 2;
const RANDOM_SLICE_END = 10;

function randomSuffix() {
  return Math.random().toString(RANDOM_BASE).slice(RANDOM_SLICE_START, RANDOM_SLICE_END);
}

function extractExtension(file: File) {
  const fromName = file.name?.split('.').pop();
  if (fromName) {
    return fromName.toLowerCase();
  }
  if (file.type) {
    const subtype = file.type.split('/').pop();
    if (subtype) return subtype.toLowerCase();
  }
  return 'jpg';
}

export class ProfilePhotoService {
  buildObjectKey(userId: string, extension: string) {
    return `${PHOTO_PREFIX}/${userId}/${Date.now()}-${randomSuffix()}.${extension}`;
  }

  async upload(userId: string, file: File): Promise<string> {
    const extension = extractExtension(file);
    const key = this.buildObjectKey(userId, extension);

    const uploadTask = uploadData({
      path: key,
      data: file,
      options: {
        contentType: file.type || undefined,
      },
    });

    await uploadTask.result;
    return key;
  }

  async delete(key: string | null | undefined) {
    if (!key) return;
    await remove({ path: key });
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const result = await getUrl({
      path: key,
      options: {
        expiresIn: expiresInSeconds,
      },
    });

    return result?.url?.toString() || '';
  }
}
