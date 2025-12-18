import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilePhotoService } from '@/domain/user-profile/ProfilePhotoService';

const mockUploadData = vi.fn();
const mockRemove = vi.fn();
const mockGetUrl = vi.fn();

vi.mock('aws-amplify/storage', () => ({
  uploadData: (...args: unknown[]) => mockUploadData(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
  getUrl: (...args: unknown[]) => mockGetUrl(...args),
}));

describe('ProfilePhotoService', () => {
  const service = new ProfilePhotoService();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadData.mockResolvedValue({ result: Promise.resolve() });
    mockGetUrl.mockResolvedValue({ url: new URL('https://example.com/photo.jpg') });
  });

  it('should upload file and return key', async () => {
    const file = { name: 'avatar.png', type: 'image/png' } as File;

    const key = await service.upload('user-1', file);

    expect(key).toMatch(/profile-photos\/user-1\//);
    expect(mockUploadData).toHaveBeenCalledWith(
      expect.objectContaining({
        path: key,
        data: file,
      })
    );
  });

  it('should delete photo when key provided', async () => {
    await service.delete('profile-photos/user-1/photo.png');
    expect(mockRemove).toHaveBeenCalledWith({ path: 'profile-photos/user-1/photo.png' });
  });

  it('should ignore delete when key missing', async () => {
    await service.delete(null);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('should return signed url', async () => {
    const url = await service.getSignedUrl('profile-photos/user-1/photo.png');
    expect(url).toBe('https://example.com/photo.jpg');
    expect(mockGetUrl).toHaveBeenCalled();
  });
});
