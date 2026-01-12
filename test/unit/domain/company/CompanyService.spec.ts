import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanyService } from '@/domain/company/CompanyService';
import type { CompanyRepository } from '@/domain/company/CompanyRepository';
import type { AiOperationsService } from '@/domain/ai-operations/AiOperationsService';
import type { Company } from '@/domain/company/Company';

vi.mock('@/domain/company/CompanyRepository');
vi.mock('@/domain/ai-operations/AiOperationsService');

describe('CompanyService', () => {
  let repo: vi.Mocked<CompanyRepository>;
  let ai: vi.Mocked<AiOperationsService>;
  let service: CompanyService;

  beforeEach(() => {
    repo = {
      get: vi.fn(),
      getWithRelations: vi.fn(),
      listByOwner: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as vi.Mocked<CompanyRepository>;

    ai = {
      analyzeCompanyInfo: vi.fn(),
      generateCompanyCanvas: vi.fn(),
    } as unknown as vi.Mocked<AiOperationsService>;

    service = new CompanyService(repo, ai);
  });

  it('creates companies with normalized arrays', async () => {
    repo.create.mockResolvedValue({
      id: 'c1',
      companyName: 'Acme',
      productsServices: ['API'],
    } as Company);

    const result = await service.createCompany({
      companyName: ' Acme ',
      productsServices: [' Platform ', 'platform'],
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: 'Acme',
        productsServices: ['Platform'],
      })
    );
    expect(result?.id).toBe('c1');
  });

  it('updates companies partially', async () => {
    repo.update.mockResolvedValue({
      id: 'c1',
      companyName: 'New',
    } as Company);

    const updated = await service.updateCompany('c1', {
      companyName: ' New ',
      targetMarkets: ['  EU '],
    });

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        companyName: 'New',
        targetMarkets: ['EU'],
      })
    );
    expect(updated?.companyName).toBe('New');
  });

  it('analyzes company info via AI and updates record', async () => {
    repo.get.mockResolvedValue({
      id: 'c1',
      companyName: 'Acme',
      rawNotes: 'Sample text',
    } as Company);
    ai.analyzeCompanyInfo.mockResolvedValue({
      companyProfile: {
        companyName: 'Acme Labs',
        industry: 'AI',
        sizeRange: '51-200',
        website: 'https://acme.test',
        productsServices: ['API'],
        targetMarkets: ['EU'],
        customerSegments: ['Startups'],
        description: 'Test',
        rawNotes: 'Sample text',
      },
    });
    repo.update.mockResolvedValue({
      id: 'c1',
      companyName: 'Acme Labs',
    } as Company);

    const result = await service.analyzeCompany('c1');

    expect(ai.analyzeCompanyInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: 'Acme',
        rawText: 'Sample text',
      })
    );
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
        companyName: 'Acme Labs',
      })
    );
    expect(result?.companyName).toBe('Acme Labs');
  });

  it('throws when analyzing without research text', async () => {
    repo.get.mockResolvedValue({
      id: 'c1',
      companyName: 'Acme',
      rawNotes: '',
    } as Company);

    await expect(service.analyzeCompany('c1')).rejects.toThrow('No company research text');
  });

  it('lists companies using repository filter', async () => {
    repo.listByOwner.mockResolvedValue([{ id: 'c1' } as Company]);

    const result = await service.listCompanies('user-1::user-1');

    expect(repo.listByOwner).toHaveBeenCalledWith('user-1::user-1');
    expect(result).toHaveLength(1);
  });

  it('gets and deletes companies via repository', async () => {
    repo.get.mockResolvedValue({ id: 'c1' } as Company);

    const company = await service.getCompany('c1');
    await service.deleteCompany('c1');

    expect(repo.get).toHaveBeenCalledWith('c1');
    expect(repo.delete).toHaveBeenCalledWith('c1');
    expect(company?.id).toBe('c1');
  });

  it('gets company with relations via repository', async () => {
    repo.getWithRelations.mockResolvedValue({ id: 'c1' } as Company);
    const result = await service.getCompanyWithRelations('c1');

    expect(repo.getWithRelations).toHaveBeenCalledWith('c1');
    expect(result?.id).toBe('c1');
  });

  it('triggers analyze step when requested during creation', async () => {
    repo.create.mockResolvedValue({
      id: 'c1',
      companyName: 'Acme',
      rawNotes: 'Stored research',
    } as Company);
    const analyzeSpy = vi.spyOn(service, 'analyzeCompany').mockResolvedValue({
      id: 'c1',
      companyName: 'Analyzed',
    } as Company);

    const result = await service.createCompany(
      { companyName: 'Acme' },
      { analyze: true, jobContext: { title: 'CTO' } }
    );

    expect(analyzeSpy).toHaveBeenCalledWith('c1', {
      rawText: 'Stored research',
      jobContext: { title: 'CTO' },
    });
    expect(result?.companyName).toBe('Analyzed');

    analyzeSpy.mockRestore();
  });

  it('drops empty strings during update normalization', async () => {
    repo.update.mockResolvedValue({ id: 'c1' } as Company);

    await service.updateCompany('c1', {
      companyName: '   ',
      rawNotes: ' ',
    });

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'c1',
      })
    );
  });

  it('throws when analyzing a non-existent company', async () => {
    repo.get.mockResolvedValue(null);

    await expect(service.analyzeCompany('missing')).rejects.toThrow('Company not found');
  });

  it('uses provided raw text and job context for analysis', async () => {
    repo.get.mockResolvedValue({
      id: 'c1',
      companyName: 'Acme',
      rawNotes: 'Stored',
    } as Company);
    ai.analyzeCompanyInfo.mockResolvedValue({
      companyProfile: {
        companyName: 'Acme',
        industry: '',
        sizeRange: '',
        website: '',
        productsServices: [],
        targetMarkets: [],
        customerSegments: [],
        description: '',
        rawNotes: 'Provided',
      },
    });
    repo.update.mockResolvedValue({ id: 'c1' } as Company);

    await service.analyzeCompany('c1', {
      rawText: 'Provided',
      jobContext: { title: 'CTO', summary: 'Lead' },
    });

    expect(ai.analyzeCompanyInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        rawText: 'Provided',
        jobContext: { title: 'CTO', summary: 'Lead' },
      })
    );
  });
});
