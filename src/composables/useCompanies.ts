import { computed, ref } from 'vue';
import type { Company } from '@/domain/company/Company';
import { CompanyService } from '@/domain/company/CompanyService';
import { useAuthUser } from '@/composables/useAuthUser';

export function useCompanies() {
  const companies = ref<Company[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const service = new CompanyService();
  const auth = useAuthUser();

  const run = async <T>(cb: () => Promise<T>): Promise<T> => {
    loading.value = true;
    error.value = null;
    try {
      return await cb();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const filteredCompanies = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) {
      return companies.value;
    }

    return companies.value.filter((company) => {
      const fields = [
        company.companyName,
        company.industry,
        company.sizeRange,
        (company.productsServices ?? []).join(' '),
      ];
      return fields.some((value) => value?.toLowerCase().includes(query));
    });
  });

  const listCompanies = async () => {
    const ownerId = await auth.getOwnerIdOrThrow();
    const result = await run(() => service.listCompanies(ownerId));
    companies.value = result;
    return result;
  };

  const createCompany = async (input: { companyName: string } & Record<string, unknown>) => {
    const created = await run(() => service.createCompany(input));
    if (created) {
      companies.value = [created, ...companies.value];
    }
    return created;
  };

  const updateCompany = async (companyId: string, patch: Record<string, unknown>) => {
    const updated = await run(() => service.updateCompany(companyId, patch));
    if (updated) {
      companies.value = companies.value.map((company) =>
        company.id === updated.id ? updated : company
      );
    }
    return updated;
  };

  const deleteCompany = async (companyId: string) => {
    await run(() => service.deleteCompany(companyId));
    companies.value = companies.value.filter((company) => company.id !== companyId);
  };

  return {
    companies: filteredCompanies,
    rawCompanies: companies,
    loading,
    error,
    searchQuery,
    listCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}
