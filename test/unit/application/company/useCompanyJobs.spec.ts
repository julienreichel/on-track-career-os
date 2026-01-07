import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useCompanyJobs } from '@/application/company/useCompanyJobs';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const mockListJobsByCompany = vi.fn();

vi.mock('@/domain/job-description/JobDescriptionService', () => ({
  JobDescriptionService: vi.fn().mockImplementation(() => ({
    listJobsByCompany: mockListJobsByCompany,
  })),
}));
vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    ownerId: ref('user-1::user-1'),
    loadOwnerId: vi.fn().mockResolvedValue('user-1::user-1'),
    getOwnerIdOrThrow: vi.fn().mockResolvedValue('user-1::user-1'),
  }),
}));

describe('useCompanyJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads jobs for the provided company', async () => {
    const jobs = [{ id: 'job-1' } as JobDescription];
    mockListJobsByCompany.mockResolvedValue(jobs);

    const { jobs: jobsRef, load, loading, error } = useCompanyJobs('company-1');
    const promise = load();
    expect(loading.value).toBe(true);
    await promise;

    expect(mockListJobsByCompany).toHaveBeenCalledWith('company-1', 'user-1::user-1');
    expect(jobsRef.value).toEqual(jobs);
    expect(error.value).toBeNull();
  });

  it('captures errors without throwing', async () => {
    mockListJobsByCompany.mockRejectedValue(new Error('Failed'));

    const { jobs: jobsRef, load, error } = useCompanyJobs('company-1');
    await load();

    expect(error.value).toBe('Failed');
    expect(jobsRef.value).toEqual([]);
  });
});
