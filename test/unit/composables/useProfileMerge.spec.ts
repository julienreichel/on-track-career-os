import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import { useProfileMerge } from '@/composables/useProfileMerge';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';

// Mock the repository
vi.mock('@/domain/user-profile/UserProfileRepository', () => ({
  UserProfileRepository: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    update: vi.fn(),
  })),
}));

describe('useProfileMerge', () => {
  let mockRepo: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      get: vi.fn(),
      update: vi.fn(),
    };
    vi.mocked(UserProfileRepository).mockImplementation(() => mockRepo as never);
  });

  const getMockExistingProfile = () => ({
    id: 'user-123',
    fullName: 'John Doe',
    headline: 'Software Engineer',
    aspirations: ['Aspiration 1'],
    skills: ['JavaScript'],
    certifications: ['Cert 1'],
  });

  const baseProfile: ParseCvTextOutput['profile'] = {
    fullName: '',
    headline: '',
    location: '',
    seniorityLevel: '',
    primaryEmail: '',
    primaryPhone: '',
    workPermitInfo: '',
    socialLinks: [],
    aspirations: [],
    personalValues: [],
    strengths: [],
    interests: [],
    skills: [],
    certifications: [],
    languages: [],
  };

  const mockExtractedProfile: ParseCvTextOutput['profile'] = {
    ...baseProfile,
    fullName: 'John Updated',
    headline: 'Senior Software Engineer',
    location: 'San Francisco',
    seniorityLevel: 'Senior',
    aspirations: ['Aspiration 2', 'Aspiration 3'],
    personalValues: ['Innovation'],
    strengths: ['Leadership'],
    interests: ['AI'],
    skills: ['TypeScript', 'React'],
    certifications: ['Cert 2'],
    languages: ['English', 'Spanish'],
  };

  const mockParsedCv: ParsedCV = {
    profile: mockExtractedProfile,
    experienceItems: [],
    rawBlocks: [],
    confidence: 0.6,
  };

  it('should skip update if profile does not exist', async () => {
    const { mergeProfile } = useProfileMerge();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockRepo.get.mockResolvedValue(null);

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    expect(mockRepo.get).toHaveBeenCalledWith('user-123');
    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('User profile not found, skipping profile update');

    consoleWarnSpy.mockRestore();
  });

  it('should not overwrite existing fullName', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue(getMockExistingProfile());
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    expect(mockRepo.update).toHaveBeenCalledWith(
      expect.not.objectContaining({
        fullName: 'John Updated',
      })
    );
  });

  it('should update fullName if not present in existing profile', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue({
      ...getMockExistingProfile(),
      fullName: undefined,
    });
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    expect(mockRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'John Updated',
      })
    );
  });

  it('should merge array fields without duplicates', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue(getMockExistingProfile());
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    const updateCall = mockRepo.update.mock.calls[0][0];

    // Aspirations should merge: ['Aspiration 1'] + ['Aspiration 2', 'Aspiration 3']
    expect(updateCall.aspirations).toContain('Aspiration 1');
    expect(updateCall.aspirations).toContain('Aspiration 2');
    expect(updateCall.aspirations).toContain('Aspiration 3');
    expect(updateCall.aspirations).toHaveLength(3);
  });

  it('should handle null values in arrays', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue({
      ...getMockExistingProfile(),
      aspirations: [null, 'Aspiration 1', null],
    } as never);
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    const updateCall = mockRepo.update.mock.calls[0][0];

    // Should filter out nulls
    expect(updateCall.aspirations).not.toContain(null);
    expect(updateCall.aspirations).toContain('Aspiration 1');
  });

  it('should merge skills from extracted profile', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue(getMockExistingProfile());
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    const updateCall = mockRepo.update.mock.calls[0][0];

    // Skills should merge: ['JavaScript'] + ['TypeScript', 'React']
    expect(updateCall.skills).toContain('JavaScript');
    expect(updateCall.skills).toContain('TypeScript');
    expect(updateCall.skills).toContain('React');
    expect(updateCall.skills).toHaveLength(3);
  });

  it('should merge certifications from extracted profile', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue(getMockExistingProfile());
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    const updateCall = mockRepo.update.mock.calls[0][0];

    // Certifications should merge: ['Cert 1'] + ['Cert 2']
    expect(updateCall.certifications).toContain('Cert 1');
    expect(updateCall.certifications).toContain('Cert 2');
    expect(updateCall.certifications).toHaveLength(2);
  });

  it('should handle empty profile fields', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue({
      id: 'user-123',
      userId: 'user-123',
    });
    mockRepo.update.mockResolvedValue({});

    const emptyProfile: ParseCvTextOutput['profile'] = {
      ...baseProfile,
    };

    await mergeProfile('user-123', emptyProfile, null);

    const updateCall = mockRepo.update.mock.calls[0][0];

    expect(updateCall.aspirations).toEqual([]);
  });

  it('should update all profile fields', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue({
      id: 'user-123',
      userId: 'user-123',
    });
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, mockParsedCv);

    const updateCall = mockRepo.update.mock.calls[0][0];

    expect(updateCall.id).toBe('user-123');
    expect(updateCall.headline).toBe('Senior Software Engineer');
    expect(updateCall.location).toBe('San Francisco');
    expect(updateCall.seniorityLevel).toBe('Senior');
    expect(updateCall.aspirations).toContain('Aspiration 2');
    expect(updateCall.personalValues).toContain('Innovation');
    expect(updateCall.strengths).toContain('Leadership');
    expect(updateCall.interests).toContain('AI');
    expect(updateCall.languages).toContain('English');
    expect(updateCall.languages).toContain('Spanish');
  });

  it('should handle null parsed CV', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue(getMockExistingProfile());
    mockRepo.update.mockResolvedValue({});

    await mergeProfile('user-123', mockExtractedProfile, null);

    expect(mockRepo.update).toHaveBeenCalled();
    const updateCall = mockRepo.update.mock.calls[0][0];

    // Should still merge profile data
    expect(updateCall.aspirations).toBeDefined();
    expect(updateCall.skills).toContain('JavaScript');
    expect(updateCall.skills).toContain('TypeScript');
    expect(updateCall.skills).toContain('React');
  });

  it('should preserve existing values when new values are empty', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue(getMockExistingProfile());
    mockRepo.update.mockResolvedValue({});

    await mergeProfile(
      'user-123',
      {
        ...baseProfile,
        fullName: '',
        headline: 'Updated Headline',
      },
      mockParsedCv
    );

    const updateCall = mockRepo.update.mock.calls[0][0];

    // Existing headline should be overridden
    expect(updateCall.headline).toBe('Updated Headline');
    // Skills should still merge from existing + extracted profile
    expect(updateCall.skills).toContain('JavaScript');
  });

  it('should remove duplicate values in merged arrays', async () => {
    const { mergeProfile } = useProfileMerge();

    mockRepo.get.mockResolvedValue({
      ...getMockExistingProfile(),
      aspirations: ['Aspiration 2', 'Aspiration 1'],
    });
    mockRepo.update.mockResolvedValue({});

    await mergeProfile(
      'user-123',
      {
        ...baseProfile,
        aspirations: ['Aspiration 2', 'Aspiration 3', 'Aspiration 2'],
      },
      null
    );

    const updateCall = mockRepo.update.mock.calls[0][0];

    // Should contain: Goal 2, Goal 1, Goal 3 (no duplicates)
    expect(updateCall.aspirations).toHaveLength(3);
    expect(new Set(updateCall.aspirations).size).toBe(3);
  });
});
