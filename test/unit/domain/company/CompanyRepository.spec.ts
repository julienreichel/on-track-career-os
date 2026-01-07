import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompanyRepository, type AmplifyCompanyModel } from '@/domain/company/CompanyRepository';
import type { Company, CompanyCreateInput, CompanyUpdateInput } from '@/domain/company/Company';
import type { JobDescription } from '@/domain/job-description/JobDescription';

const { gqlOptionsMock } = vi.hoisted(() => ({
  gqlOptionsMock: vi.fn((custom?: Record<string, unknown>) => ({
    authMode: 'userPool',
    ...(custom ?? {}),
  })),
}));

vi.mock('@/data/graphql/options', () => ({
  gqlOptions: gqlOptionsMock,
}));

describe('CompanyRepository', () => {
  let repository: CompanyRepository;
  let mockModel: {
    get: ReturnType<typeof vi.fn>;
    listCompanyByOwner: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockModel = {
      get: vi.fn(),
      listCompanyByOwner: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    repository = new CompanyRepository(mockModel as unknown as AmplifyCompanyModel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should fetch a Company by id using GraphQL options', async () => {
      const company = {
        id: 'company-123',
        name: 'Acme Corp',
      } as Company;

      mockModel.get.mockResolvedValue({ data: company });

      const result = await repository.get('company-123');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'company-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(gqlOptionsMock).toHaveBeenCalledWith();
      expect(result).toEqual(company);
    });

    it('should return null when Company does not exist', async () => {
      mockModel.get.mockResolvedValue({ data: null });

      const result = await repository.get('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('getWithRelations', () => {
    it('requests company with canvas and jobs', async () => {
      const company = { id: 'company-1', companyName: 'Acme' } as Company;
      mockModel.get.mockResolvedValue({ data: company });

      const result = await repository.getWithRelations('company-1');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'company-1' },
        expect.objectContaining({
          selectionSet: expect.arrayContaining(['canvas.*', 'jobs.*']),
        })
      );
      expect(result).toEqual(company);
    });
  });

  describe('getJobsByCompany', () => {
    it('returns jobs using selection set', async () => {
      const jobs = [{ id: 'job-1' }, { id: 'job-2' }] as JobDescription[];
      mockModel.get.mockResolvedValue({
        data: {
          id: 'company-1',
          jobs,
        },
      });

      const result = await repository.getJobsByCompany('company-1');

      expect(mockModel.get).toHaveBeenCalledWith(
        { id: 'company-1' },
        expect.objectContaining({
          selectionSet: ['id', 'jobs.*'],
        })
      );
      expect(result).toEqual(jobs);
    });

    it('returns empty array when companyId is missing', async () => {
      const result = await repository.getJobsByCompany('');

      expect(result).toEqual([]);
      expect(mockModel.get).not.toHaveBeenCalled();
    });
  });

  describe('listByOwner', () => {
    it('should return all companies for the owner', async () => {
      const companies = [{ id: '1' }, { id: '2' }] as Company[];
      mockModel.listCompanyByOwner.mockResolvedValue({ data: companies });

      const result = await repository.listByOwner('user-1::user-1');

      expect(mockModel.listCompanyByOwner).toHaveBeenCalledWith(
        { owner: 'user-1::user-1' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(gqlOptionsMock).toHaveBeenCalled();
      expect(result).toEqual(companies);
    });

    it('should return empty array when owner is missing', async () => {
      const result = await repository.listByOwner('');

      expect(result).toEqual([]);
      expect(mockModel.listCompanyByOwner).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a Company', async () => {
      const input = { name: 'New Co' } as CompanyCreateInput;
      const created = { id: 'new-id', name: 'New Co' } as Company;
      mockModel.create.mockResolvedValue({ data: created });

      const result = await repository.create(input);

      expect(mockModel.create).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(gqlOptionsMock).toHaveBeenCalledWith();
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a Company', async () => {
      const input = { id: 'company-123', name: 'Updated' } as CompanyUpdateInput;
      const updated = { ...input } as Company;
      mockModel.update.mockResolvedValue({ data: updated });

      const result = await repository.update(input);

      expect(mockModel.update).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(gqlOptionsMock).toHaveBeenCalledWith();
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a Company by id', async () => {
      mockModel.delete.mockResolvedValue({ data: null });

      await repository.delete('company-123');

      expect(mockModel.delete).toHaveBeenCalledWith(
        { id: 'company-123' },
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(gqlOptionsMock).toHaveBeenCalledWith();
    });
  });

  describe('findByNormalizedName', () => {
    it('returns company matching normalized name', async () => {
      const companies = [
        { id: '1', companyName: 'Acme Inc.' },
        { id: '2', companyName: 'Global Freight' },
      ] as Company[];
      mockModel.listCompanyByOwner.mockResolvedValue({ data: companies });

      const result = await repository.findByNormalizedName('  acme  ', 'user-1::user-1');

      expect(result).toEqual(companies[0]);
    });

    it('returns null when name missing', async () => {
      const result = await repository.findByNormalizedName('', 'user-1::user-1');
      expect(result).toBeNull();
    });

    it('returns null when owner missing', async () => {
      const result = await repository.findByNormalizedName('Acme', '');
      expect(result).toBeNull();
    });
  });
});
