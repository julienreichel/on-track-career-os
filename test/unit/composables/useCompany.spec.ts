import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCompany } from '@/application/company/useCompany';
import { CompanyService } from '@/domain/company/CompanyService';
import type { Company } from '@/domain/company/Company';

vi.mock('@/domain/company/CompanyService');

describe('useCompany', () => {
  let service: vi.Mocked<CompanyService>;

  beforeEach(() => {
    service = {
      getCompany: vi.fn(),
      getCompanyWithRelations: vi.fn(),
      updateCompany: vi.fn(),
      analyzeCompany: vi.fn(),
    } as unknown as vi.Mocked<CompanyService>;
    vi.mocked(CompanyService).mockImplementation(() => service);
  });

  it('loads and stores company', async () => {
    const company = { id: 'c1', companyName: 'Acme' } as Company;
    service.getCompany.mockResolvedValue(company);
    const composable = useCompany('c1');

    await composable.load();
    expect(composable.company.value).toEqual(company);
  });

  it('updates company via service', async () => {
    const updated = { id: 'c1', companyName: 'Beta' } as Company;
    service.updateCompany.mockResolvedValue(updated);
    const composable = useCompany('c1');

    await composable.save({ companyName: 'Beta' });
    expect(composable.company.value).toEqual(updated);
  });

  it('loads company with relations', async () => {
    const company = { id: 'c1', companyName: 'Acme' } as Company;
    service.getCompanyWithRelations.mockResolvedValue(company);
    const composable = useCompany('c1');

    await composable.loadWithRelations();
    expect(composable.company.value).toEqual(company);
  });
});
