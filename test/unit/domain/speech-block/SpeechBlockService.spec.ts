import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechBlockService } from '@/domain/speech-block/SpeechBlockService';
import type { SpeechBlockRepository } from '@/domain/speech-block/SpeechBlockRepository';
import type {
  SpeechBlock,
  SpeechBlockCreateInput,
  SpeechBlockUpdateInput,
} from '@/domain/speech-block/SpeechBlock';

// Mock the repository
vi.mock('@/domain/speech-block/SpeechBlockRepository');

describe('SpeechBlockService', () => {
  let service: SpeechBlockService;
  let mockRepository: ReturnType<typeof vi.mocked<SpeechBlockRepository>>;

  beforeEach(() => {
    mockRepository = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<SpeechBlockRepository>>;

    service = new SpeechBlockService(mockRepository);
  });

  describe('getFullSpeechBlock', () => {
    it('should fetch a complete SpeechBlock by id', async () => {
      const mockSpeechBlock = {
        id: 'speechblock-123',
        // TODO: Add model-specific fields
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      } as SpeechBlock;

      mockRepository.get.mockResolvedValue(mockSpeechBlock);

      const result = await service.getFullSpeechBlock('speechblock-123');

      expect(mockRepository.get).toHaveBeenCalledWith('speechblock-123');
      expect(result).toEqual(mockSpeechBlock);
    });

    it('should return null when SpeechBlock does not exist', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await service.getFullSpeechBlock('non-existent-id');

      expect(mockRepository.get).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });
  });

  it('lists speech blocks with filters', async () => {
    const blocks = [{ id: 'sb-1' }] as SpeechBlock[];
    mockRepository.list.mockResolvedValue(blocks);

    const result = await service.listSpeechBlocks({ userId: { eq: 'user-1' } });

    expect(mockRepository.list).toHaveBeenCalledWith({ userId: { eq: 'user-1' } });
    expect(result).toEqual(blocks);
  });

  it('creates speech blocks with trimmed content', async () => {
    const input = {
      userId: 'user-1',
      elevatorPitch: '  Pitch  ',
      careerStory: ' Story ',
      whyMe: '  Why ',
    } as SpeechBlockCreateInput;
    const created = { id: 'sb-1', ...input } as SpeechBlock;

    mockRepository.create.mockResolvedValue(created);

    const result = await service.createSpeechBlock(input);

    expect(mockRepository.create).toHaveBeenCalledWith({
      ...input,
      elevatorPitch: 'Pitch',
      careerStory: 'Story',
      whyMe: 'Why',
    });
    expect(result).toEqual(created);
  });

  it('updates speech blocks with trimmed fields', async () => {
    const input = {
      id: 'sb-1',
      whyMe: '  Updated ',
    } as SpeechBlockUpdateInput;
    const updated = { id: 'sb-1', whyMe: 'Updated' } as SpeechBlock;

    mockRepository.update.mockResolvedValue(updated);

    const result = await service.updateSpeechBlock(input);

    expect(mockRepository.update).toHaveBeenCalledWith({
      id: 'sb-1',
      whyMe: 'Updated',
    });
    expect(result).toEqual(updated);
  });

  it('deletes speech blocks', async () => {
    mockRepository.delete.mockResolvedValue(undefined);

    await service.deleteSpeechBlock('sb-1');

    expect(mockRepository.delete).toHaveBeenCalledWith('sb-1');
  });

  it('creates draft speech blocks with empty content', () => {
    const draft = service.createDraftSpeechBlock('user-1', 'job-1');

    expect(draft).toEqual({
      userId: 'user-1',
      jobId: 'job-1',
      elevatorPitch: '',
      careerStory: '',
      whyMe: '',
    });
  });
});
