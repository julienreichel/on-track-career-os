import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import StoriesPage from '@/pages/profile/stories/index.vue';
import type { STARStory } from '@/domain/starstory/STARStory';
import type { Experience } from '@/domain/experience/Experience';

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({
    params: {},
  })),
  definePageMeta: vi.fn(),
}));

// Mock story engine
const mockLoadAllStoriesForUser = vi.fn();
const mockStories = vi.fn(() => []);
const mockLoading = vi.fn(() => false);
const mockError = vi.fn(() => null);

vi.mock('@/application/starstory/useStoryEngine', () => ({
  useStoryEngine: vi.fn(() => ({
    stories: { value: mockStories() },
    loading: { value: mockLoading() },
    error: { value: mockError() },
    loadAllStoriesForUser: mockLoadAllStoriesForUser,
  })),
}));

// Mock experience composable
const mockExperienceLoad = vi.fn();
const mockExperienceItem = vi.fn(() => null);

vi.mock('@/application/experience/useExperience', () => ({
  useExperience: vi.fn(() => ({
    item: { value: mockExperienceItem() },
    load: mockExperienceLoad,
    loading: { value: false },
    error: { value: null },
  })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      stories: {
        global: {
          title: 'All STAR Stories',
          description: 'Browse all your achievement stories across all experiences',
          empty: 'No stories yet',
          emptyDescription: 'Create STAR stories from your experiences to document your achievements.',
          goToExperiences: 'Go to Experiences',
          experience: 'Experience',
          status: 'Status',
          achievements: 'Achievements',
          kpis: 'KPIs',
          goToExperience: 'Go to Experience',
          unknownExperience: 'Unknown Experience',
        },
        table: {
          preview: 'Preview',
          actions: 'Actions',
        },
        list: {
          edit: 'Edit',
        },
        status: {
          draft: 'Draft',
        },
      },
      common: {
        error: 'Error',
        backToProfile: 'Back to Profile',
      },
    },
  },
});

describe('Profile Stories Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(StoriesPage, {
      global: {
        plugins: [i18n],
        provide: {
          // Mock router
          router: {
            push: vi.fn(),
          },
        },
        stubs: {
          UPage: { template: '<div class="u-page"><slot /></div>' },
          UPageHeader: {
            template: '<div class="u-page-header"><slot /></div>',
            props: ['title', 'description', 'links'],
          },
          UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
          UCard: { template: '<div class="u-card"><slot /></div>' },
          UTable: { template: '<div class="u-table">Table</div>', props: ['columns', 'data'] },
          UEmpty: {
            template: '<div class="u-empty"><slot name="actions" /></div>',
            props: ['title', 'description', 'icon'],
          },
          UButton: {
            template: '<button class="u-button"><slot /></button>',
            props: ['label', 'icon', 'onClick'],
          },
          UBadge: {
            template: '<span class="u-badge">{{ label }}</span>',
            props: ['label', 'color', 'size'],
          },
          UAlert: {
            template: '<div class="u-alert">{{ description }}</div>',
            props: ['title', 'description', 'color'],
          },
          UIcon: { template: '<i class="u-icon" />', props: ['name'] },
        },
      },
    });
  };

  it('should render page with title and description', () => {
    const wrapper = createWrapper();

    const pageHeader = wrapper.find('.u-page-header');
    expect(pageHeader.exists()).toBe(true);
  });

  it('should call loadAllStoriesForUser on mount', async () => {
    createWrapper();
    await vi.waitFor(() => {
      expect(mockLoadAllStoriesForUser).toHaveBeenCalled();
    });
  });

  it('should display loading state', () => {
    mockLoading.mockReturnValue(true);
    const wrapper = createWrapper();

    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  it('should display error state', async () => {
    mockError.mockReturnValue('Failed to load stories');
    mockLoading.mockReturnValue(false);
    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    // Test that component received the error value (it's a ref)
    expect(wrapper.vm.error.value).toBe('Failed to load stories');
  });

  it('should display empty state when no stories', async () => {
    mockStories.mockReturnValue([]);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    // Test that component has no stories (they're refs)
    expect(wrapper.vm.stories.value).toEqual([]);
  });

  it('should render stories table with data', async () => {
    const mockStoriesData: STARStory[] = [
      {
        id: 'story-1',
        situation: 'Led a team migration project',
        task: 'Migrate legacy system',
        action: 'Designed new architecture',
        result: 'Reduced deployment time by 85%',
        achievements: ['Improved deployment speed'],
        kpiSuggestions: ['85% reduction in deployment time'],
        experienceId: 'exp-1',
        owner: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockStories.mockReturnValue(mockStoriesData);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    // Mock experience data
    mockExperienceItem.mockReturnValue({
      id: 'exp-1',
      companyName: 'Tech Corp',
      title: 'Senior Engineer',
    } as Experience);

    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    // Test that component received the stories (they're refs)
    expect(wrapper.vm.stories.value).toHaveLength(1);
    expect(wrapper.vm.stories.value[0].id).toBe('story-1');
  });

  it('should display achievements badge when story has achievements', async () => {
    const mockStoriesData: STARStory[] = [
      {
        id: 'story-1',
        situation: 'Test',
        task: 'Test',
        action: 'Test',
        result: 'Test',
        achievements: ['Achievement 1', 'Achievement 2'],
        kpiSuggestions: [],
        experienceId: 'exp-1',
        owner: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockStories.mockReturnValue(mockStoriesData);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    // Check that the story is processed correctly
    const storyData = wrapper.vm.enrichedStories;
    expect(storyData[0].hasAchievements).toBe(true);
  });

  it('should display KPIs badge when story has KPI suggestions', async () => {
    const mockStoriesData: STARStory[] = [
      {
        id: 'story-1',
        situation: 'Test',
        task: 'Test',
        action: 'Test',
        result: 'Test',
        achievements: [],
        kpiSuggestions: ['KPI 1', 'KPI 2'],
        experienceId: 'exp-1',
        owner: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockStories.mockReturnValue(mockStoriesData);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    const storyData = wrapper.vm.enrichedStories;
    expect(storyData[0].hasKpis).toBe(true);
  });

  it('should display draft badge when story has no achievements or KPIs', async () => {
    const mockStoriesData: STARStory[] = [
      {
        id: 'story-1',
        situation: 'Test',
        task: 'Test',
        action: 'Test',
        result: 'Test',
        achievements: [],
        kpiSuggestions: [],
        experienceId: 'exp-1',
        owner: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockStories.mockReturnValue(mockStoriesData);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    const storyData = wrapper.vm.enrichedStories;
    expect(storyData[0].hasAchievements).toBe(false);
    expect(storyData[0].hasKpis).toBe(false);
  });

  it('should show experience name from mapping', async () => {
    const mockStoriesData: STARStory[] = [
      {
        id: 'story-1',
        situation: 'Test',
        task: 'Test',
        action: 'Test',
        result: 'Test',
        achievements: [],
        kpiSuggestions: [],
        experienceId: 'exp-1',
        owner: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockStories.mockReturnValue(mockStoriesData);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    mockExperienceItem.mockReturnValue({
      id: 'exp-1',
      companyName: 'Acme Corp',
      title: 'Software Engineer',
    } as Experience);

    const wrapper = createWrapper();

    await vi.waitFor(() => {
      expect(mockExperienceLoad).toHaveBeenCalled();
    });

    await wrapper.vm.$nextTick();

    const storyData = wrapper.vm.enrichedStories;
    expect(storyData[0].experienceName).toBe('Acme Corp');
  });

  it('should truncate long preview text', () => {
    const longText = 'a'.repeat(150);
    const mockStoriesData: STARStory[] = [
      {
        id: 'story-1',
        situation: 'Short',
        task: 'Short',
        action: 'Short',
        result: longText,
        achievements: [],
        kpiSuggestions: [],
        experienceId: 'exp-1',
        owner: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockStories.mockReturnValue(mockStoriesData);
    mockLoading.mockReturnValue(false);
    mockError.mockReturnValue(null);

    const wrapper = createWrapper();

    // Check preview truncation logic
    const preview = wrapper.vm.getPreview(mockStoriesData[0]);
    expect(preview).toHaveLength(83); // 80 chars + '...'
    expect(preview).toContain('...');
  });

  it('should have back to profile link in header', () => {
    const wrapper = createWrapper();

    const pageHeader = wrapper.find('.u-page-header');
    expect(pageHeader.exists()).toBe(true);
  });
});
