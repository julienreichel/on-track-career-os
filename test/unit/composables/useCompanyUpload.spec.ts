import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCompanyUpload } from '@/composables/useCompanyUpload';

const mocks = vi.hoisted(() => {
  const mockCreateCompany = vi.fn();
  const mockGetText = vi.fn();
  const mockDestroy = vi.fn();

  const PDFParseMock = vi.fn(() => ({
    getText: mockGetText,
    destroy: mockDestroy,
  }));
  PDFParseMock.setWorker = vi.fn();

  return {
    mockCreateCompany,
    mockGetText,
    mockDestroy,
    PDFParseMock,
  };
});

const { mockCreateCompany, mockGetText, mockDestroy } = mocks;

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/domain/company/CompanyService', () => ({
  CompanyService: vi.fn(() => ({
    createCompany: mockCreateCompany,
  })),
}));

vi.mock('pdf-parse', () => ({
  PDFParse: mocks.PDFParseMock,
}));

describe('useCompanyUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetText.mockReset();
    mockDestroy.mockReset();
  });

  const createPdfFile = () => new File(['dummy pdf'], 'company.pdf', { type: 'application/pdf' });
  const createTextFile = (content: string) =>
    new File([content], 'company.txt', { type: 'text/plain' });

  it('processes a PDF file and creates a company', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'A'.repeat(500) });
    const createdCompany = { id: 'c1', companyName: 'Acme' };
    mockCreateCompany.mockResolvedValueOnce(createdCompany);

    const upload = useCompanyUpload();
    const result = await upload.handleFileSelected(createPdfFile());

    expect(result).toEqual(createdCompany);
    expect(mockCreateCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: expect.any(String),
        rawNotes: expect.any(String),
      }),
      expect.objectContaining({
        analyze: true,
        rawText: expect.any(String),
      })
    );
    expect(upload.errorMessage.value).toBeNull();
    expect(upload.status.value).toBe('idle');
  });

  it('processes text files using File.text()', async () => {
    const createdCompany = { id: 'c2', companyName: 'TextCo' };
    mockCreateCompany.mockResolvedValueOnce(createdCompany);

    const upload = useCompanyUpload();
    const result = await upload.handleFileSelected(createTextFile('B'.repeat(500)));

    expect(result).toEqual(createdCompany);
    expect(mockGetText).not.toHaveBeenCalled();
  });

  it('sets error when extracted text is too short', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'too short' });

    const upload = useCompanyUpload();
    const result = await upload.handleFileSelected(createPdfFile());

    expect(result).toBeNull();
    expect(upload.errorMessage.value).toBe('companies.upload.errors.tooShort');
    expect(upload.selectedFile.value).toBeNull();
  });

  it('captures errors from CompanyService', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'A'.repeat(500) });
    mockCreateCompany.mockRejectedValueOnce(new Error('backend failure'));

    const upload = useCompanyUpload();
    const result = await upload.handleFileSelected(createPdfFile());

    expect(result).toBeNull();
    expect(upload.errorMessage.value).toBe('backend failure');
    expect(upload.selectedFile.value).toBeNull();
  });
});
