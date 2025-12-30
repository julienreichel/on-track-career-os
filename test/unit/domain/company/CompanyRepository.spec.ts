import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompanyRepository, type AmplifyCompanyModel } from '@/domain/company/CompanyRepository';
import type { Company, CompanyCreateInput, CompanyUpdateInput } from '@/domain/company/Company';

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
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockModel = {
      get: vi.fn(),
      list: vi.fn(),
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

  describe('list', () => {
    it('should return all companies when no filter is provided', async () => {
      const companies = [{ id: '1' }, { id: '2' }] as Company[];
      mockModel.list.mockResolvedValue({ data: companies });

      const result = await repository.list();

      expect(mockModel.list).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: 'userPool' })
      );
      expect(gqlOptionsMock).toHaveBeenCalledWith({});
      expect(result).toEqual(companies);
    });

    it('should pass filters to gqlOptions', async () => {
      const filter = { industry: 'Technology' };
      mockModel.list.mockResolvedValue({ data: [] });

      await repository.list(filter);

      expect(gqlOptionsMock).toHaveBeenCalledWith(filter);
      expect(mockModel.list).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: 'userPool', industry: 'Technology' })
      );
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
      mockModel.list.mockResolvedValue({ data: companies });

      const result = await repository.findByNormalizedName('  acme  ');

      expect(result).toEqual(companies[0]);
    });

    it('returns null when name missing', async () => {
      const result = await repository.findByNormalizedName('');
      expect(result).toBeNull();
    });
  });
});
