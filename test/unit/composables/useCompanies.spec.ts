import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useCompanies } from '@/composables/useCompanies';
import { CompanyService } from '@/domain/company/CompanyService';
import type { Company } from '@/domain/company/Company';

vi.mock('@/domain/company/CompanyService');
vi.mock('@/composables/useAuthUser', () => ({
  useAuthUser: () => ({
    ownerId: ref('user-1::user-1'),
    loadOwnerId: vi.fn().mockResolvedValue('user-1::user-1'),
  }),
}));

describe('useCompanies', () => {
  let service: vi.Mocked<CompanyService>;

  beforeEach(() => {
    service = {
      listCompanies: vi.fn(),
      createCompany: vi.fn(),
      updateCompany: vi.fn(),
      deleteCompany: vi.fn(),
    } as unknown as vi.Mocked<CompanyService>;

    vi.mocked(CompanyService).mockImplementation(() => service);
  });

  it('loads companies and filters by search query', async () => {
    const items = [
      { id: '1', companyName: 'Acme', industry: 'AI', productsServices: ['API'] },
      { id: '2', companyName: 'Beta Corp', industry: 'Health', productsServices: [] },
    ] as Company[];
    service.listCompanies.mockResolvedValue(items);

    const composable = useCompanies();
    await composable.listCompanies();

    expect(service.listCompanies).toHaveBeenCalledWith('user-1::user-1');
    expect(composable.companies.value).toHaveLength(2);

    composable.searchQuery.value = 'acme';
    expect(composable.companies.value).toHaveLength(1);
  });

  it('creates companies and prepends to list', async () => {
    service.listCompanies.mockResolvedValue([]);
    const created = { id: 'c1', companyName: 'Acme' } as Company;
    service.createCompany.mockResolvedValue(created);
    const composable = useCompanies();
    await composable.listCompanies();

    await composable.createCompany({ companyName: 'Acme' });
    expect(composable.rawCompanies.value[0]).toEqual(created);
  });
});
