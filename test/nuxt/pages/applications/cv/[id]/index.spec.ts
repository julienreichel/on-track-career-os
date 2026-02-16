import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { allowConsoleOutput } from '../../../../../setup/console-guard';
import CvDetailPage from '@/pages/applications/cv/[id]/index.vue';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';
import type { JobDescription } from '@/domain/job-description/JobDescription';
import type { MatchingSummary } from '@/domain/matching-summary/MatchingSummary';

// Mock services
vi.mock('@/domain/cvdocument/CVDocumentService');
vi.mock('@/domain/user-profile/UserProfileService');
vi.mock('@/domain/user-profile/ProfilePhotoService');
vi.mock('@/domain/company/CompanyService');
vi.mock('@/composables/useAuthUser');
vi.mock('@/application/tailoring/useTailoredMaterials');
vi.mock('@/composables/useMaterialImprovementEngine');

const mockToast = {
  add: vi.fn(),
};

// Mock Nuxt composables
vi.mock('#app', () => {
  return {
    useToast: () => mockToast,
  };
});

vi.mock('#imports', () => {
  return {
    useToast: () => mockToast,
  };
});

const mockCvDocument: CVDocument = {
  id: 'cv-123',
  userId: 'user-123',
  name: 'Software Engineer CV',
  content: '# John Doe\n\n## Experience\n\nSoftware Engineer at Tech Corp',
  showProfilePhoto: true,
  templateId: 'template-1',
  jobId: 'job-456',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  owner: 'user-123',
};

const mockJob: JobDescription = {
  id: 'job-456',
  userId: 'user-123',
  companyId: 'company-789',
  title: 'Senior Software Engineer',
  company: 'Tech Corp',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 'user-123',
};

const mockMatchingSummary: MatchingSummary = {
  id: 'match-123',
  userId: 'user-123',
  jobId: 'job-456',
  overallScore: 85,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 'user-123',
};

const mockRouter = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/applications/cv/:id', component: { template: '<div>CV Detail</div>' } }],
});

const mockCVDocumentService = {
  getFullCVDocument: vi.fn(),
  updateCVDocument: vi.fn(),
};

const mockUserProfileService = {
  getFullUserProfile: vi.fn(),
  getProfileForTailoring: vi.fn(),
};

const mockProfilePhotoService = {
  getSignedUrl: vi.fn(),
};
const mockCompanyService = {
  getCompany: vi.fn(),
};

const mockTailoredMaterials = {
  loadTailoringContext: vi.fn().mockResolvedValue({ ok: false, job: null, matchingSummary: null }),
  regenerateTailoredCvForJob: vi.fn(),
  isGenerating: { value: false },
  contextLoading: { value: false },
  contextError: { value: null },
  error: { value: null },
};

const mockMaterialImprovementEngine = {
  state: { value: 'ready' },
  score: { value: 78 },
  details: { value: null },
  presets: { value: [] as string[] },
  note: { value: '' },
  canImprove: { value: true },
  actions: {
    runFeedback: vi.fn().mockResolvedValue(undefined),
    runImprove: vi.fn().mockResolvedValue(undefined),
    setPresets: vi.fn(),
    setNote: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  },
};
let materialImprovementOptions: any = null;

const mountPage = async (props = {}, routeParams = { id: 'cv-123' }) => {
  await mockRouter.push(`/applications/cv/${routeParams.id}`);

  const wrapper = mount(CvDetailPage, {
    props,
    global: {
      plugins: [createTestI18n(), mockRouter],
      stubs: {
        UPage: { template: '<div><slot /></div>' },
        UPageHeader: true,
        UPageBody: { template: '<div><slot /></div>' },
        UCard: true,
        UAlert: true,
        UIcon: true,
        UButton: true,
        UFormField: true,
        UTextarea: true,
        USwitch: true,
        TailoredJobBanner: true,
        MaterialFeedbackPanel: {
          props: ['engine'],
          template:
            '<div data-testid="material-feedback-panel"><button data-testid="material-feedback-trigger" @click="engine.actions.runFeedback()">feedback</button><button data-testid="material-improve-trigger" @click="engine.actions.runImprove()">improve</button></div>',
        },
        ErrorStateCard: true,
        MarkdownContent: true,
        UnsavedChangesModal: true,
      },
    },
  });

  await flushPromises();
  return wrapper;
};

describe('CV Detail Page (index.vue)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockToast.add.mockClear();
    mockCVDocumentService.getFullCVDocument.mockResolvedValue(mockCvDocument);
    mockCVDocumentService.updateCVDocument.mockImplementation(async (input: any) => ({
      ...mockCvDocument,
      ...input,
      content: input.content ?? mockCvDocument.content,
    }));
    mockUserProfileService.getFullUserProfile.mockResolvedValue({ profilePhotoKey: 'photo-key' });
    mockUserProfileService.getProfileForTailoring.mockResolvedValue({
      ...mockCvDocument,
      id: 'user-123',
      fullName: 'John Doe',
      experiences: [],
      canvas: null,
    });
    mockProfilePhotoService.getSignedUrl.mockResolvedValue('https://example.com/photo.jpg');
    mockCompanyService.getCompany.mockResolvedValue(null);
    mockTailoredMaterials.loadTailoringContext.mockResolvedValue({
      ok: true,
      job: mockJob,
      matchingSummary: mockMatchingSummary,
    });
    materialImprovementOptions = null;
    mockMaterialImprovementEngine.actions.runFeedback.mockClear();
    mockMaterialImprovementEngine.actions.runImprove.mockClear();
    mockMaterialImprovementEngine.actions.reset.mockClear();

    const { CVDocumentService } = await import('@/domain/cvdocument/CVDocumentService');
    vi.mocked(CVDocumentService).mockImplementation(() => mockCVDocumentService as any);

    const { UserProfileService } = await import('@/domain/user-profile/UserProfileService');
    vi.mocked(UserProfileService).mockImplementation(() => mockUserProfileService as any);

    const { ProfilePhotoService } = await import('@/domain/user-profile/ProfilePhotoService');
    vi.mocked(ProfilePhotoService).mockImplementation(() => mockProfilePhotoService as any);

    const { CompanyService } = await import('@/domain/company/CompanyService');
    vi.mocked(CompanyService).mockImplementation(() => mockCompanyService as any);

    const { useAuthUser } = await import('@/composables/useAuthUser');
    vi.mocked(useAuthUser).mockReturnValue({ userId: { value: 'user-123' } } as any);

    const { useTailoredMaterials } = await import('@/application/tailoring/useTailoredMaterials');
    vi.mocked(useTailoredMaterials).mockReturnValue(mockTailoredMaterials as any);

    const { useMaterialImprovementEngine } = await import('@/composables/useMaterialImprovementEngine');
    vi.mocked(useMaterialImprovementEngine).mockImplementation((options: any) => {
      materialImprovementOptions = options;
      return mockMaterialImprovementEngine as any;
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', async () => {
      const wrapper = await mountPage();
      expect(wrapper.exists()).toBe(true);
    });

    it('initializes with correct state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.saving).toBe(false);
      expect(wrapper.vm.isEditing).toBe(false);
      expect(wrapper.vm.error).toBeNull();
    });

    it('loads CV document on mount', async () => {
      await mountPage();
      expect(mockCVDocumentService.getFullCVDocument).toHaveBeenCalledWith('cv-123');
    });

    it('loads profile photo on mount', async () => {
      await mountPage();
      await flushPromises();
      expect(mockUserProfileService.getFullUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockProfilePhotoService.getSignedUrl).toHaveBeenCalledWith('photo-key');
    });
  });

  describe('Computed Properties', () => {
    it('cvId returns route parameter', async () => {
      const wrapper = await mountPage({}, { id: 'cv-999' });
      expect(wrapper.vm.cvId).toBe('cv-999');
    });

    it('hasJobContext returns true when jobId exists', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      expect(wrapper.vm.hasJobContext).toBe(true);
    });

    it('hasJobContext returns false when jobId is null', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = { ...mockCvDocument, jobId: null };
      expect(wrapper.vm.hasJobContext).toBe(false);
    });

    it('targetJobTitle returns job title when available', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.targetJob = mockJob;
      expect(wrapper.vm.targetJobTitle).toBe('Senior Software Engineer');
    });

    it('jobLink returns correct path', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.targetJob = mockJob;
      expect(wrapper.vm.jobLink).toBe('/jobs/job-456');
    });

    it('matchLink returns correct path', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.targetJob = mockJob;
      expect(wrapper.vm.matchLink).toBe('/jobs/job-456/match');
    });

    it('previewShowsPhoto returns true when enabled and photo available', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.profilePhotoUrl = 'https://example.com/photo.jpg';
      expect(wrapper.vm.previewShowsPhoto).toBe(true);
    });

    it('previewShowsPhoto returns false when photo not available', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.profilePhotoUrl = null;
      expect(wrapper.vm.previewShowsPhoto).toBe(false);
    });

    it('hasChanges returns true when content changed', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.editContent = 'New content';
      wrapper.vm.originalContent = 'Old content';
      expect(wrapper.vm.hasChanges).toBe(true);
    });

    it('hasChanges returns true when photo setting changed', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.showProfilePhotoSetting = true;
      wrapper.vm.originalShowProfilePhoto = false;
      expect(wrapper.vm.hasChanges).toBe(true);
    });

    it('hasChanges returns false when nothing changed', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.editContent = 'Same content';
      wrapper.vm.originalContent = 'Same content';
      wrapper.vm.showProfilePhotoSetting = true;
      wrapper.vm.originalShowProfilePhoto = true;
      expect(wrapper.vm.hasChanges).toBe(false);
    });

    it('canRegenerate returns true when all context available', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.targetJob = mockJob;
      wrapper.vm.matchingSummary = mockMatchingSummary;
      expect(wrapper.vm.canRegenerate).toBe(true);
    });

    it('canRegenerate returns false when context missing', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.targetJob = null;
      wrapper.vm.matchingSummary = null;
      expect(wrapper.vm.canRegenerate).toBe(false);
    });

    it('missingSummary returns true when job exists but summary missing', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.targetJob = mockJob;
      wrapper.vm.matchingSummary = null;
      expect(wrapper.vm.missingSummary).toBe(true);
    });
  });

  describe('Load Methods', () => {
    it('load sets loading state', async () => {
      mockCVDocumentService.getFullCVDocument.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCvDocument), 100))
      );

      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(true);
      await flushPromises();
    });

    it('load populates document data', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      expect(wrapper.vm.document).toEqual(mockCvDocument);
      expect(wrapper.vm.editContent).toBe(mockCvDocument.content);
      expect(wrapper.vm.originalContent).toBe(mockCvDocument.content);
    });

    it('load handles error gracefully', async () => {
      mockCVDocumentService.getFullCVDocument.mockRejectedValue(new Error('Network error'));

      await allowConsoleOutput(async () => {
        const wrapper = await mountPage();
        await flushPromises();
        expect(wrapper.vm.error).toBe('Network error');
        expect(wrapper.vm.loading).toBe(false);
      });
    });

    it('loadProfilePhoto sets photo URL when available', async () => {
      const wrapper = await mountPage();
      await wrapper.vm.loadProfilePhoto('user-123');
      await flushPromises();
      expect(wrapper.vm.profilePhotoUrl).toBe('https://example.com/photo.jpg');
    });

    it('loadProfilePhoto handles missing photo key', async () => {
      mockUserProfileService.getFullUserProfile.mockResolvedValue({ profilePhotoKey: null });

      const wrapper = await mountPage();
      await wrapper.vm.loadProfilePhoto('user-123');
      await flushPromises();
      expect(wrapper.vm.profilePhotoUrl).toBeNull();
    });

    it('loadProfilePhoto handles errors', async () => {
      mockUserProfileService.getFullUserProfile.mockRejectedValue(new Error('Photo error'));

      await allowConsoleOutput(async () => {
        const wrapper = await mountPage();
        await wrapper.vm.loadProfilePhoto('user-123');
        await flushPromises();
        expect(wrapper.vm.profilePhotoUrl).toBeNull();
        expect(wrapper.vm.profilePhotoError).toBe('Photo error');
      });
    });

    it('loadTailoringContext loads job and summary', async () => {
      const wrapper = await mountPage();
      await wrapper.vm.loadTailoringContext('job-456');
      await flushPromises();
      expect(wrapper.vm.targetJob).toEqual(mockJob);
      expect(wrapper.vm.matchingSummary).toEqual(mockMatchingSummary);
    });

    it('loadTailoringContext clears context when no jobId', async () => {
      const wrapper = await mountPage();
      await wrapper.vm.loadTailoringContext(null);
      await flushPromises();
      expect(mockTailoredMaterials.loadTailoringContext).toHaveBeenCalledWith(null);
    });
  });

  describe('Edit Mode', () => {
    it('toggleEdit switches to edit mode', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;

      expect(wrapper.vm.isEditing).toBe(false);
      wrapper.vm.toggleEdit();
      expect(wrapper.vm.isEditing).toBe(true);
      expect(wrapper.vm.editContent).toBe(mockCvDocument.content);
    });

    it('handleCancel closes edit mode without changes', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.isEditing = true;
      wrapper.vm.editContent = 'Original';
      wrapper.vm.originalContent = 'Original';

      wrapper.vm.handleCancel();
      expect(wrapper.vm.isEditing).toBe(false);
    });

    it('handleCancel shows confirm modal with unsaved changes', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.isEditing = true;
      wrapper.vm.editContent = 'Modified';
      wrapper.vm.originalContent = 'Original';

      wrapper.vm.handleCancel();
      expect(wrapper.vm.showCancelConfirm).toBe(true);
      expect(wrapper.vm.isEditing).toBe(true);
    });

    it('handleConfirmCancel discards changes', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.isEditing = true;
      wrapper.vm.editContent = 'Modified';
      wrapper.vm.originalContent = 'Original';
      wrapper.vm.showCancelConfirm = true;

      wrapper.vm.handleConfirmCancel();
      expect(wrapper.vm.showCancelConfirm).toBe(false);
      expect(wrapper.vm.isEditing).toBe(false);
      expect(wrapper.vm.editContent).toBe('Original');
    });
  });

  describe('Save Functionality', () => {
    it('saveEdit updates document', async () => {
      const updatedDoc = { ...mockCvDocument, content: 'Updated content' };
      mockCVDocumentService.updateCVDocument.mockResolvedValue(updatedDoc);

      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.editContent = 'Updated content';
      wrapper.vm.isEditing = true;

      await wrapper.vm.saveEdit();
      await flushPromises();

      expect(mockCVDocumentService.updateCVDocument).toHaveBeenCalledWith({
        id: 'cv-123',
        content: 'Updated content',
        showProfilePhoto: true,
      });
      expect(wrapper.vm.isEditing).toBe(false);
      expect(wrapper.vm.document).toEqual(updatedDoc);
    });

    it('saveEdit handles error', async () => {
      await allowConsoleOutput(async () => {
        mockCVDocumentService.updateCVDocument.mockRejectedValue(new Error('Save failed'));

        const wrapper = await mountPage();
        await flushPromises();
        wrapper.vm.document = mockCvDocument;
        wrapper.vm.editContent = 'Updated content';

        await wrapper.vm.saveEdit();
        await flushPromises();

        expect(wrapper.vm.saving).toBe(false);
      });
    });

    it('saveEdit does nothing when document is null', async () => {
      const wrapper = await mountPage();
      wrapper.vm.document = null;

      await wrapper.vm.saveEdit();
      expect(mockCVDocumentService.updateCVDocument).not.toHaveBeenCalled();
    });
  });

  describe('Print Functionality', () => {
    it('handlePrint opens print window', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const wrapper = await mountPage();
      wrapper.vm.handlePrint();

      expect(openSpy).toHaveBeenCalledWith('/applications/cv/cv-123/print', '_blank');
      openSpy.mockRestore();
    });
  });

  describe('Regenerate Tailored CV', () => {
    it('handleRegenerateTailored regenerates CV', async () => {
      const regeneratedDoc = { ...mockCvDocument, content: 'Regenerated content' };
      mockTailoredMaterials.regenerateTailoredCvForJob.mockResolvedValue(regeneratedDoc);
      mockCVDocumentService.getFullCVDocument.mockResolvedValue(regeneratedDoc);

      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.targetJob = mockJob;
      wrapper.vm.matchingSummary = mockMatchingSummary;

      await wrapper.vm.handleRegenerateTailored();
      await flushPromises();

      expect(mockTailoredMaterials.regenerateTailoredCvForJob).toHaveBeenCalledWith({
        id: 'cv-123',
        job: mockJob,
        matchingSummary: mockMatchingSummary,
        options: {
          name: 'Software Engineer CV',
          templateId: 'template-1',
          showProfilePhoto: true,
        },
      });
      expect(wrapper.vm.document).toEqual(regeneratedDoc);
      expect(mockMaterialImprovementEngine.actions.reset).toHaveBeenCalledTimes(1);
    });

    it('handleRegenerateTailored does nothing when context missing', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = mockCvDocument;
      wrapper.vm.targetJob = null;
      wrapper.vm.matchingSummary = null;

      await wrapper.vm.handleRegenerateTailored();
      expect(mockTailoredMaterials.regenerateTailoredCvForJob).not.toHaveBeenCalled();
    });

    it('handleRegenerateTailored handles error', async () => {
      await allowConsoleOutput(async () => {
        mockTailoredMaterials.regenerateTailoredCvForJob.mockRejectedValue(
          new Error('Regeneration failed')
        );

        const wrapper = await mountPage();
        await flushPromises();
        wrapper.vm.document = mockCvDocument;
        wrapper.vm.targetJob = mockJob;
        wrapper.vm.matchingSummary = mockMatchingSummary;

        await wrapper.vm.handleRegenerateTailored();
        await flushPromises();
      });
    });
  });

  describe('State Management', () => {
    it('manages loading state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(false);
    });

    it('manages saving state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.saving).toBe(false);
    });

    it('manages error state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.error).toBeNull();
    });

    it('tracks profile photo loading state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.profilePhotoLoading).toBeDefined();
    });

    it('tracks profile photo error state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.profilePhotoError).toBeNull();
    });

    it('manages cancel confirmation modal state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.showCancelConfirm).toBe(false);
    });
  });

  describe('Material Improvement Integration', () => {
    it('renders panel and triggers feedback and improve actions', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.find('[data-testid="material-feedback-panel"]').exists()).toBe(true);

      await wrapper.get('[data-testid="material-feedback-trigger"]').trigger('click');
      await wrapper.get('[data-testid="material-improve-trigger"]').trigger('click');

      expect(mockMaterialImprovementEngine.actions.runFeedback).toHaveBeenCalledTimes(1);
      expect(mockMaterialImprovementEngine.actions.runImprove).toHaveBeenCalledTimes(1);
    });

    it('overwrites markdown and persists through engine setter', async () => {
      const wrapper = await mountPage();
      await flushPromises();

      expect(materialImprovementOptions).toBeTruthy();

      await materialImprovementOptions.setCurrentMarkdown('# Improved CV');
      await flushPromises();

      expect(mockCVDocumentService.updateCVDocument).toHaveBeenCalledWith({
        id: 'cv-123',
        content: '# Improved CV',
        showProfilePhoto: true,
      });
      expect(wrapper.vm.document.content).toBe('# Improved CV');
      expect(wrapper.vm.editContent).toBe('# Improved CV');
      expect(wrapper.vm.originalContent).toBe('# Improved CV');
    });
  });

  describe('Photo Toggle', () => {
    it('initializes photo toggle with document value', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = { ...mockCvDocument, showProfilePhoto: false };
      wrapper.vm.toggleEdit();
      expect(wrapper.vm.showProfilePhotoSetting).toBe(false);
    });

    it('defaults photo toggle to true when not set', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.document = { ...mockCvDocument, showProfilePhoto: undefined };
      wrapper.vm.toggleEdit();
      expect(wrapper.vm.showProfilePhotoSetting).toBe(true);
    });

    it('tracks photo toggle changes', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.showProfilePhotoSetting = true;
      wrapper.vm.originalShowProfilePhoto = false;
      expect(wrapper.vm.hasChanges).toBe(true);
    });
  });
});
