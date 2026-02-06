import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJobUpload } from '@/composables/useJobUpload';

const mocks = vi.hoisted(() => {
  const mockCreateJob = vi.fn();
  const mockGetText = vi.fn();
  const mockDestroy = vi.fn();

  const PDFParseMock = vi.fn(() => ({
    getText: mockGetText,
    destroy: mockDestroy,
  }));
  PDFParseMock.setWorker = vi.fn();

  return {
    mockCreateJob,
    mockGetText,
    mockDestroy,
    PDFParseMock,
  };
});

const { mockCreateJob, mockGetText, mockDestroy } = mocks;

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/composables/useJobAnalysis', () => ({
  useJobAnalysis: () => ({
    createAnalyzedJobFromRawText: mockCreateJob,
  }),
}));

vi.mock('pdf-parse', () => ({
  PDFParse: mocks.PDFParseMock,
}));

vi.mock('@/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    captureEvent: vi.fn(),
  }),
}));

describe('useJobUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetText.mockReset();
    mockDestroy.mockReset();
  });

  const createPdfFile = () => new File(['dummy'], 'job.pdf', { type: 'application/pdf' });

  const createTextFile = (content: string) =>
    new File([content], 'job.txt', { type: 'text/plain' });

  it('processes a PDF file and returns analyzed job', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'A'.repeat(500) });
    const analyzedJob = { id: 'job-123', title: 'Role' };
    mockCreateJob.mockResolvedValueOnce(analyzedJob);

    const jobUpload = useJobUpload();
    const job = await jobUpload.handleFileSelected(createPdfFile());

    expect(job).toEqual(analyzedJob);
    expect(mockCreateJob).toHaveBeenCalled();
    expect(jobUpload.errorMessage.value).toBeNull();
  });

  it('processes text file using File.text()', async () => {
    const analyzedJob = { id: 'job-999', title: 'Role' };
    mockCreateJob.mockResolvedValueOnce(analyzedJob);

    const jobUpload = useJobUpload();
    const job = await jobUpload.handleFileSelected(createTextFile('B'.repeat(500)));

    expect(job).toEqual(analyzedJob);
    expect(mockGetText).not.toHaveBeenCalled();
  });

  it('sets error when job description is too short', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'short' });
    const jobUpload = useJobUpload();

    const job = await jobUpload.handleFileSelected(createPdfFile());

    expect(job).toBeNull();
    expect(jobUpload.errorMessage.value).toBe('ingestion.job.upload.errors.tooShort');
    expect(jobUpload.selectedFile.value).toBeNull();
  });

  it('captures errors from analysis', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'A'.repeat(500) });
    mockCreateJob.mockRejectedValueOnce(new Error('analysis failed'));

    const jobUpload = useJobUpload();
    const job = await jobUpload.handleFileSelected(createPdfFile());

    expect(job).toBeNull();
    expect(jobUpload.errorMessage.value).toBe('analysis failed');
  });

  it('maps non-job error code to i18n message', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'A'.repeat(500) });
    mockCreateJob.mockRejectedValueOnce(new Error('Not a job description'));

    const jobUpload = useJobUpload();
    const job = await jobUpload.handleFileSelected(createPdfFile());

    expect(job).toBeNull();
    expect(jobUpload.errorMessage.value).toBe('Not a job description');
  });

  it('processes pasted text and returns analyzed job', async () => {
    const analyzedJob = { id: 'job-555', title: 'Role' };
    mockCreateJob.mockResolvedValueOnce(analyzedJob);

    const jobUpload = useJobUpload();
    const job = await jobUpload.handleTextSubmitted('C'.repeat(500));

    expect(job).toEqual(analyzedJob);
    expect(mockCreateJob).toHaveBeenCalled();
    expect(jobUpload.errorMessage.value).toBeNull();
  });
});
