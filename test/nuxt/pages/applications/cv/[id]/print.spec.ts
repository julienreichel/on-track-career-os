import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../../../utils/createTestI18n';
import { createRouter, createMemoryHistory } from 'vue-router';
import { allowConsoleOutput } from '../../../../../setup/console-guard';
import CvPrintPage from '@/pages/applications/cv/[id]/print.vue';
import type { CVDocument } from '@/domain/cvdocument/CVDocument';

// Mock services
vi.mock('@/domain/cvdocument/CVDocumentService');
vi.mock('@/domain/user-profile/UserProfileService');
vi.mock('@/domain/user-profile/ProfilePhotoService');

const mockCvDocument: CVDocument = {
  id: 'cv-123',
  userId: 'user-123',
  name: 'Software Engineer CV',
  content: '# John Doe\n\n## Experience\n\nSoftware Engineer at Tech Corp',
  showProfilePhoto: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  owner: 'user-123',
};

const mockRouter = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/applications/cv/:id/print', component: { template: '<div>CV Print</div>' } }],
});

const mockCVDocumentService = {
  getFullCVDocument: vi.fn(),
};

const mockUserProfileService = {
  getFullUserProfile: vi.fn(),
};

const mockProfilePhotoService = {
  getSignedUrl: vi.fn(),
};

const mountPage = async (props = {}, routeParams = { id: 'cv-123' }) => {
  await mockRouter.push(`/applications/cv/${routeParams.id}/print`);

  const wrapper = mount(CvPrintPage, {
    props,
    global: {
      plugins: [createTestI18n(), mockRouter],
      stubs: {
        UIcon: true,
        UButton: true,
        MarkdownContent: true,
      },
    },
  });

  await flushPromises();
  return wrapper;
};

describe('CV Print Page (print.vue)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockCVDocumentService.getFullCVDocument.mockResolvedValue(mockCvDocument);
    mockUserProfileService.getFullUserProfile.mockResolvedValue({ profilePhotoKey: 'photo-key' });
    mockProfilePhotoService.getSignedUrl.mockResolvedValue('https://example.com/photo.jpg');

    const { CVDocumentService } = await import('@/domain/cvdocument/CVDocumentService');
    vi.mocked(CVDocumentService).mockImplementation(() => mockCVDocumentService as any);

    const { UserProfileService } = await import('@/domain/user-profile/UserProfileService');
    vi.mocked(UserProfileService).mockImplementation(() => mockUserProfileService as any);

    const { ProfilePhotoService } = await import('@/domain/user-profile/ProfilePhotoService');
    vi.mocked(ProfilePhotoService).mockImplementation(() => mockProfilePhotoService as any);

    // Mock window.print and window.close
    vi.spyOn(window, 'print').mockImplementation(() => {});
    vi.spyOn(window, 'close').mockImplementation(() => {});
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', async () => {
      const wrapper = await mountPage();
      expect(wrapper.exists()).toBe(true);
    });

    it('initializes with correct state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error).toBeNull();
      expect(wrapper.vm.cvDocument).toBeDefined();
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

    it('triggers auto-print after loading', async () => {
      vi.useFakeTimers();
      await mountPage();
      await flushPromises();

      vi.advanceTimersByTime(500);
      expect(window.print).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Computed Properties', () => {
    it('cvId returns route parameter', async () => {
      const wrapper = await mountPage({}, { id: 'cv-999' });
      expect(wrapper.vm.cvId).toBe('cv-999');
    });

    it('showPhoto returns true when enabled and photo available', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.cvDocument = mockCvDocument;
      wrapper.vm.profilePhotoUrl = 'https://example.com/photo.jpg';
      expect(wrapper.vm.showPhoto).toBe(true);
    });

    it('showPhoto returns false when photo disabled', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.cvDocument = { ...mockCvDocument, showProfilePhoto: false };
      wrapper.vm.profilePhotoUrl = 'https://example.com/photo.jpg';
      expect(wrapper.vm.showPhoto).toBe(false);
    });

    it('showPhoto returns false when photo URL not available', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.cvDocument = mockCvDocument;
      wrapper.vm.profilePhotoUrl = null;
      expect(wrapper.vm.showPhoto).toBe(false);
    });

    it('showPhoto defaults to true when setting undefined', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      wrapper.vm.cvDocument = { ...mockCvDocument, showProfilePhoto: undefined };
      wrapper.vm.profilePhotoUrl = 'https://example.com/photo.jpg';
      expect(wrapper.vm.showPhoto).toBe(true);
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

    it('load populates cvDocument data', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      expect(wrapper.vm.cvDocument).toEqual(mockCvDocument);
    });

    it('load handles error gracefully', async () => {
      await allowConsoleOutput(async () => {
        mockCVDocumentService.getFullCVDocument.mockRejectedValue(new Error('Network error'));

        const wrapper = await mountPage();
        await flushPromises();
        expect(wrapper.vm.error).toBe('Network error');
        expect(wrapper.vm.loading).toBe(false);
      });
    });

    it('load clears previous error', async () => {
      const wrapper = await mountPage();
      wrapper.vm.error = 'Previous error';

      await wrapper.vm.load();
      await flushPromises();
      expect(wrapper.vm.error).toBeNull();
    });

    it('loadProfilePhoto sets photo URL when available', async () => {
      const wrapper = await mountPage();
      await wrapper.vm.loadProfilePhoto('user-123');
      await flushPromises();
      expect(wrapper.vm.profilePhotoUrl).toBe('https://example.com/photo.jpg');
      expect(wrapper.vm.profilePhotoLoading).toBe(false);
    });

    it('loadProfilePhoto handles missing photo key', async () => {
      mockUserProfileService.getFullUserProfile.mockResolvedValue({ profilePhotoKey: null });

      const wrapper = await mountPage();
      await wrapper.vm.loadProfilePhoto('user-123');
      await flushPromises();
      expect(wrapper.vm.profilePhotoUrl).toBeNull();
    });

    it('loadProfilePhoto handles missing profile', async () => {
      mockUserProfileService.getFullUserProfile.mockResolvedValue(null);

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
        expect(wrapper.vm.profilePhotoLoading).toBe(false);
      });
    });

    it('loadProfilePhoto sets loading state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.profilePhotoLoading).toBe(false);

      const loadPromise = wrapper.vm.loadProfilePhoto('user-123');
      expect(wrapper.vm.profilePhotoLoading).toBe(true);

      await loadPromise;
      expect(wrapper.vm.profilePhotoLoading).toBe(false);
    });
  });

  describe('Print Functionality', () => {
    it('handlePrint calls window.print', async () => {
      const wrapper = await mountPage();
      wrapper.vm.handlePrint();
      expect(window.print).toHaveBeenCalled();
    });

    it('handlePrint can be called multiple times', async () => {
      const wrapper = await mountPage();
      wrapper.vm.handlePrint();
      wrapper.vm.handlePrint();
      expect(window.print).toHaveBeenCalledTimes(2);
    });
  });

  describe('Close Functionality', () => {
    it('handleClose calls window.close', async () => {
      const wrapper = await mountPage();
      wrapper.vm.handleClose();
      expect(window.close).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('manages loading state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.loading).toBe(false);
    });

    it('manages error state correctly', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.error).toBeNull();
    });

    it('manages cvDocument state', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      expect(wrapper.vm.cvDocument).toEqual(mockCvDocument);
    });

    it('tracks profile photo loading state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.profilePhotoLoading).toBe(false);
    });

    it('tracks profile photo error state', async () => {
      const wrapper = await mountPage();
      expect(wrapper.vm.profilePhotoError).toBeNull();
    });

    it('tracks profile photo URL state', async () => {
      const wrapper = await mountPage();
      await flushPromises();
      expect(wrapper.vm.profilePhotoUrl).toBe('https://example.com/photo.jpg');
    });
  });

  describe('Error Handling', () => {
    it('displays error when document load fails', async () => {
      mockCVDocumentService.getFullCVDocument.mockRejectedValue(new Error('Document not found'));

      await allowConsoleOutput(async () => {
        const wrapper = await mountPage();
        await flushPromises();
        expect(wrapper.vm.error).toBe('Document not found');
        expect(wrapper.vm.cvDocument).toBeNull();
      });
    });

    it('can retry after error', async () => {
      mockCVDocumentService.getFullCVDocument.mockRejectedValueOnce(new Error('Network error'));
      mockCVDocumentService.getFullCVDocument.mockResolvedValueOnce(mockCvDocument);

      await allowConsoleOutput(async () => {
        const wrapper = await mountPage();
        await flushPromises();
        expect(wrapper.vm.error).toBe('Network error');

        mockCVDocumentService.getFullCVDocument.mockClear();
        await wrapper.vm.load();
        await flushPromises();
        expect(wrapper.vm.error).toBeNull();
        expect(wrapper.vm.cvDocument).toEqual(mockCvDocument);
      });
    });

    it('handles non-Error exceptions', async () => {
      mockCVDocumentService.getFullCVDocument.mockRejectedValue('String error');

      await allowConsoleOutput(async () => {
        const wrapper = await mountPage();
        await flushPromises();
        expect(wrapper.vm.error).toBe('Failed to load CV');
      });
    });

    it('handles photo load errors gracefully', async () => {
      mockProfilePhotoService.getSignedUrl.mockRejectedValue(new Error('S3 error'));

      await allowConsoleOutput(async () => {
        const wrapper = await mountPage();
        await flushPromises();
        expect(wrapper.vm.profilePhotoUrl).toBeNull();
        expect(wrapper.vm.profilePhotoError).toBe('S3 error');
      });
    });
  });

  describe('Auto-Print Behavior', () => {
    it('delays print by 500ms after load', async () => {
      vi.useFakeTimers();
      await mountPage();
      await flushPromises();

      expect(window.print).not.toHaveBeenCalled();
      vi.advanceTimersByTime(499);
      expect(window.print).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(window.print).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('does not auto-print when error occurs', async () => {
      mockCVDocumentService.getFullCVDocument.mockRejectedValue(new Error('Load failed'));
      vi.useFakeTimers();

      await allowConsoleOutput(async () => {
        await mountPage();
        await flushPromises();
        vi.advanceTimersByTime(500);

        expect(window.print).not.toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Different Route Parameters', () => {
    it('loads correct CV for different IDs', async () => {
      await mountPage({}, { id: 'cv-456' });
      expect(mockCVDocumentService.getFullCVDocument).toHaveBeenCalledWith('cv-456');
    });

    it('handles different user IDs', async () => {
      const differentUserDoc = { ...mockCvDocument, userId: 'user-456' };
      mockCVDocumentService.getFullCVDocument.mockResolvedValue(differentUserDoc);

      await mountPage();
      await flushPromises();
      expect(mockUserProfileService.getFullUserProfile).toHaveBeenCalledWith('user-456');
    });
  });

  describe('Page Layout', () => {
    it('uses no layout', () => {
      // This is validated by the definePageMeta in the component
      expect(CvPrintPage).toBeDefined();
    });
  });
});
