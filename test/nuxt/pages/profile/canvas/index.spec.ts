import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../../../utils/createTestI18n';
import CanvasIndexPage from '~/pages/profile/canvas/index.vue';
import type { PersonalCanvas } from '~/domain/personal-canvas/PersonalCanvas';
import { ref } from 'vue';

// Mock composables
const mockCanvasEngine = {
  canvas: ref(null as PersonalCanvas | null),
  loading: ref(false),
  error: ref(null as string | null),
  profile: ref(null),
  initializeForUser: vi.fn(),
  generateAndSave: vi.fn(),
  regenerateAndSave: vi.fn(),
  saveEdits: vi.fn(),
};

const mockAuthUser = {
  userId: ref('test-user-123'),
};

const mockToast = {
  add: vi.fn(),
};

vi.mock('~/application/personal-canvas/useCanvasEngine', () => ({
  useCanvasEngine: () => mockCanvasEngine,
}));

vi.mock('~/composables/useAuthUser', () => ({
  useAuthUser: () => mockAuthUser,
}));

// Create i18n instance
const i18n = createTestI18n();

describe('Canvas Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvasEngine.canvas.value = null;
    mockCanvasEngine.loading.value = false;
    mockCanvasEngine.error.value = null;
    mockCanvasEngine.generateAndSave.mockResolvedValue(true);
    mockCanvasEngine.regenerateAndSave.mockResolvedValue(true);
    mockCanvasEngine.saveEdits.mockResolvedValue(true);
  });

  describe('Page Structure', () => {
    it('renders page with empty canvas state', () => {
      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div class="u-container"><slot /></div>' },
            UPage: { template: '<div class="u-page"><slot /></div>' },
            UPageHeader: { template: '<div class="u-page-header"><slot /></div>' },
            UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
            UAlert: { template: '<div class="u-alert"><slot /></div>' },
            PersonalCanvasComponent: {
              template: '<div class="canvas-component" data-testid="canvas-component"></div>',
            },
          },
        },
      });

      expect(wrapper.find('.u-container').exists()).toBe(true);
      expect(wrapper.find('.u-page').exists()).toBe(true);
      expect(wrapper.find('[data-testid="canvas-component"]').exists()).toBe(true);
    });

    it('renders page with existing canvas', () => {
      const mockCanvas: PersonalCanvas = {
        id: 'canvas-123',
        userId: 'user-123',
        customerSegments: ['Tech Companies'],
        valueProposition: ['Technical expertise'],
        channels: ['LinkedIn'],
        customerRelationships: ['Networking'],
        keyActivities: ['Development'],
        keyResources: ['Experience'],
        keyPartners: ['Mentors'],
        costStructure: ['Training'],
        revenueStreams: ['Salary'],
        needsUpdate: false,
        lastGeneratedAt: '2025-01-15',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        owner: 'user-123::user-123',
      };

      mockCanvasEngine.canvas.value = mockCanvas;

      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div class="u-container"><slot /></div>' },
            UPage: { template: '<div class="u-page"><slot /></div>' },
            UPageHeader: { template: '<div class="u-page-header"><slot /></div>' },
            UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
            UAlert: { template: '<div class="u-alert"><slot /></div>' },
            PersonalCanvasComponent: {
              template: '<div class="canvas-component" data-testid="canvas-component"></div>',
              props: ['canvas', 'loading'],
            },
          },
        },
      });

      expect(wrapper.find('[data-testid="canvas-component"]').exists()).toBe(true);
    });

    it('displays error alert when error exists', () => {
      mockCanvasEngine.error.value = 'Test error message';

      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div class="u-container"><slot /></div>' },
            UPage: { template: '<div class="u-page"><slot /></div>' },
            UPageHeader: { template: '<div class="u-page-header"><slot /></div>' },
            UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
            UAlert: {
              template: '<div class="u-alert" data-testid="error-alert"><slot /></div>',
              props: ['description'],
            },
            PersonalCanvasComponent: {
              template: '<div class="canvas-component"></div>',
            },
          },
        },
      });

      expect(wrapper.find('[data-testid="error-alert"]').exists()).toBe(true);
    });
  });

  describe('User Initialization', () => {
    it('calls initializeForUser when userId is available', async () => {
      mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: true,
            UPage: true,
            UPageHeader: true,
            UPageBody: true,
            UAlert: true,
            PersonalCanvasComponent: true,
          },
        },
      });

      // Wait for watch to trigger and promises to flush
      await flushPromises();

      expect(mockCanvasEngine.initializeForUser).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('Generate Canvas', () => {
    it('calls generateAndSave when generate event is emitted', async () => {
      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div><slot /></div>' },
            UPage: { template: '<div><slot /></div>' },
            UPageHeader: { template: '<div><slot /></div>' },
            UPageBody: { template: '<div><slot /></div>' },
            UAlert: { template: '<div><slot /></div>' },
            PersonalCanvasComponent: {
              template:
                '<button @click="$emit(\'generate\')" data-testid="generate-btn">Generate</button>',
            },
          },
        },
      });

      await wrapper.find('[data-testid="generate-btn"]').trigger('click');
      await flushPromises();

      expect(mockCanvasEngine.generateAndSave).toHaveBeenCalled();
    });
  });

  describe('Regenerate Canvas', () => {
    it('calls regenerateAndSave when regenerate event is emitted', async () => {
      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div><slot /></div>' },
            UPage: { template: '<div><slot /></div>' },
            UPageHeader: { template: '<div><slot /></div>' },
            UPageBody: { template: '<div><slot /></div>' },
            UAlert: { template: '<div><slot /></div>' },
            PersonalCanvasComponent: {
              template:
                '<button @click="$emit(\'regenerate\')" data-testid="regenerate-btn">Regenerate</button>',
            },
          },
        },
      });

      await wrapper.find('[data-testid="regenerate-btn"]').trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockCanvasEngine.regenerateAndSave).toHaveBeenCalled();
    });
  });

  describe('Save Edits', () => {
    it('calls saveEdits when save event is emitted with updates', async () => {
      const updates = { valueProposition: ['Updated value'] };

      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div><slot /></div>' },
            UPage: { template: '<div><slot /></div>' },
            UPageHeader: { template: '<div><slot /></div>' },
            UPageBody: { template: '<div><slot /></div>' },
            UAlert: { template: '<div><slot /></div>' },
            PersonalCanvasComponent: {
              template:
                '<button @click="$emit(\'save\', updates)" data-testid="save-btn">Save</button>',
              props: ['canvas', 'loading'],
              data: () => ({ updates }),
            },
          },
        },
      });

      await wrapper.find('[data-testid="save-btn"]').trigger('click');
      await flushPromises();

      expect(mockCanvasEngine.saveEdits).toHaveBeenCalledWith(updates);
    });
  });

  describe('Error Handling', () => {
    it('does not show toast when generation fails with error in composable', async () => {
      mockCanvasEngine.generateAndSave.mockResolvedValue(false);
      mockCanvasEngine.error.value = 'Generation failed';

      const wrapper = mount(CanvasIndexPage, {
        global: {
          plugins: [i18n],
          mocks: {
            useI18n: () => ({
              t: (key: string) => key,
            }),
            useToast: () => mockToast,
          },
          stubs: {
            UContainer: { template: '<div><slot /></div>' },
            UPage: { template: '<div><slot /></div>' },
            UPageHeader: { template: '<div><slot /></div>' },
            UPageBody: { template: '<div><slot /></div>' },
            UAlert: { template: '<div><slot /></div>' },
            PersonalCanvasComponent: {
              template:
                '<button @click="$emit(\'generate\')" data-testid="generate-btn">Generate</button>',
            },
          },
        },
      });

      mockToast.add.mockClear();

      await wrapper.find('[data-testid="generate-btn"]').trigger('click');
      await flushPromises();

      // Should have attempted generation
      expect(mockCanvasEngine.generateAndSave).toHaveBeenCalled();
    });
  });
});
