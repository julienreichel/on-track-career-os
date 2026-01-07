import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useJobAnalysis } from '@/composables/useJobAnalysis';
import { JobDescriptionService } from '@/domain/job-description/JobDescriptionService';
import type {
  JobDescription,
  JobDescriptionUpdateInput,
} from '@/domain/job-description/JobDescription';

vi.mock('@/domain/job-description/JobDescriptionService');
vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    ownerId: ref('user-1::user-1'),
    loadOwnerId: vi.fn().mockResolvedValue('user-1::user-1'),
    getOwnerIdOrThrow: vi.fn().mockResolvedValue('user-1::user-1'),
  }),
}));

describe('useJobAnalysis', () => {
  let mockService: {
    listJobs: ReturnType<typeof vi.fn>;
    getFullJobDescription: ReturnType<typeof vi.fn>;
    getJobWithRelations: ReturnType<typeof vi.fn>;
    createJobFromRawText: ReturnType<typeof vi.fn>;
    updateJob: ReturnType<typeof vi.fn>;
    reanalyseJob: ReturnType<typeof vi.fn>;
    deleteJob: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      listJobs: vi.fn(),
      getFullJobDescription: vi.fn(),
      getJobWithRelations: vi.fn(),
      createJobFromRawText: vi.fn(),
      updateJob: vi.fn(),
      reanalyseJob: vi.fn(),
      deleteJob: vi.fn(),
    };

    vi.mocked(JobDescriptionService).mockImplementation(
      () => mockService as unknown as JobDescriptionService
    );
  });

  it('should list jobs and populate state', async () => {
    const mockJobs = [{ id: '1', title: 'Job' }] as JobDescription[];
    mockService.listJobs.mockResolvedValue(mockJobs);

    const { jobs, loading, error, listJobs } = useJobAnalysis();
    await listJobs();

    expect(mockService.listJobs).toHaveBeenCalledWith('user-1::user-1');
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(jobs.value).toEqual(mockJobs);
  });

  it('should create job from raw text', async () => {
    const created = { id: 'job-1', title: 'Draft', status: 'draft' } as JobDescription;
    mockService.createJobFromRawText.mockResolvedValue(created);

    const { selectedJob, jobs, createJobFromRawText } = useJobAnalysis();
    await createJobFromRawText('New job');

    expect(selectedJob.value).toEqual(created);
    expect(jobs.value[0]).toEqual(created);
  });

  it('should load job and set selected state', async () => {
    const job = { id: 'job-1', title: 'Existing' } as JobDescription;
    mockService.getFullJobDescription.mockResolvedValue(job);

    const { selectedJob, loadJob } = useJobAnalysis();
    await loadJob('job-1');

    expect(selectedJob.value).toEqual(job);
    expect(mockService.getFullJobDescription).toHaveBeenCalledWith('job-1');
  });

  it('should load job with relations and set selected state', async () => {
    const job = { id: 'job-1', title: 'Existing' } as JobDescription;
    mockService.getJobWithRelations.mockResolvedValue(job);

    const { selectedJob, loadJobWithRelations } = useJobAnalysis();
    await loadJobWithRelations('job-1');

    expect(selectedJob.value).toEqual(job);
    expect(mockService.getJobWithRelations).toHaveBeenCalledWith('job-1');
  });

  it('should update job and reflect changes locally', async () => {
    const updated = { id: 'job-1', title: 'Updated' } as JobDescription;
    mockService.updateJob.mockResolvedValue(updated);

    const { selectedJob, jobs, updateJob } = useJobAnalysis();
    jobs.value = [{ id: 'job-1', title: 'Old' } as JobDescription];

    await updateJob('job-1', { title: 'Updated' } as Partial<JobDescriptionUpdateInput>);

    expect(mockService.updateJob).toHaveBeenCalledWith('job-1', { title: 'Updated' });
    expect(selectedJob.value).toEqual(updated);
    expect(jobs.value[0]).toEqual(updated);
  });

  it('should reanalyse job and update lists', async () => {
    const updated = { id: 'job-1', title: 'Analysed', status: 'analyzed' } as JobDescription;
    mockService.reanalyseJob.mockResolvedValue(updated);

    const { jobs, selectedJob, reanalyseJob } = useJobAnalysis();
    jobs.value = [{ id: 'job-1', title: 'Draft' } as JobDescription];

    await reanalyseJob('job-1');

    expect(mockService.reanalyseJob).toHaveBeenCalledWith('job-1');
    expect(selectedJob.value).toEqual(updated);
    expect(jobs.value[0]).toEqual(updated);
  });

  it('should capture errors and reset loading', async () => {
    mockService.listJobs.mockRejectedValue(new Error('Failure'));
    const { error, loading, listJobs } = useJobAnalysis();

    await expect(listJobs()).rejects.toThrow('Failure');
    expect(loading.value).toBe(false);
    expect(error.value).toBe('Failure');
  });

  it('should delete job and update list', async () => {
    const { jobs, deleteJob } = useJobAnalysis();
    jobs.value = [
      { id: 'job-1', title: 'Draft' } as JobDescription,
      { id: 'job-2', title: 'Other' } as JobDescription,
    ];
    mockService.deleteJob.mockResolvedValue(undefined);

    await deleteJob('job-1');

    expect(mockService.deleteJob).toHaveBeenCalledWith('job-1');
    expect(jobs.value).toHaveLength(1);
    expect(jobs.value[0].id).toBe('job-2');
  });
});
