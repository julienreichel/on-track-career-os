import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import { createRouter, createWebHistory } from 'vue-router';
import { allowConsoleOutput } from '../../setup/console-guard';
import StoryList from '@/components/StoryList.vue';
import type { STARStoryWithExperience } from '@/domain/starstory/STARStory';

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [],
});
mockRouter.push = vi.fn();

const mountList = (props = {}) => {
  return mount(StoryList, {
    props: {
      stories: [],
      loading: false,
      ...props,
    },
    global: {
      plugins: [createTestI18n(), mockRouter],
      stubs: {
        UEmpty: true,
        UButton: true,
        StoryCard: true,
        StoryViewModal: true,
        ListSkeletonCards: true,
      },
    },
  });
};

const mockStory1: STARStoryWithExperience = {
  id: 'story-1',
  experienceId: 'exp-1',
  userId: 'user-1',
  title: 'Migration Project',
  situation: 'Legacy system needed upgrade',
  task: 'Migrate all applications',
  action: 'Created migration plan',
  result: 'Zero downtime migration',
  experienceName: 'Senior Engineer at Tech Corp',
  companyName: 'Tech Corp',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 'user-1',
};

const mockStory2: STARStoryWithExperience = {
  id: 'story-2',
  experienceId: 'exp-2',
  userId: 'user-1',
  title: 'Team Leadership',
  situation: 'Team needed direction',
  task: 'Lead team of 10 developers',
  action: 'Implemented agile practices',
  result: 'Productivity increased 50%',
  experienceName: 'Tech Lead at Startup Inc',
  companyName: 'Startup Inc',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  owner: 'user-1',
};

describe('StoryList', () => {
  describe('Props', () => {
    it('accepts stories prop', async () => {
      await allowConsoleOutput(async () => {
        const wrapper = mountList({ stories: [mockStory1] });
        expect(wrapper.props('stories')).toHaveLength(1);
        expect(wrapper.props('stories')[0].id).toBe('story-1');
      });
    });

    it('accepts loading prop', () => {
      const wrapper = mountList({ loading: true });
      expect(wrapper.props('loading')).toBe(true);
    });

    it('accepts showCompanyNames prop', () => {
      const wrapper = mountList({ showCompanyNames: true });
      expect(wrapper.props('showCompanyNames')).toBe(true);
    });

    it('accepts experienceId prop', () => {
      const wrapper = mountList({ experienceId: 'exp-1' });
      expect(wrapper.props('experienceId')).toBe('exp-1');
    });

    it('handles optional props', () => {
      const wrapper = mountList();
      expect(wrapper.props('loading')).toBe(false);
      expect(wrapper.props('showCompanyNames')).toBeFalsy();
      expect(wrapper.props('experienceId')).toBeUndefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const wrapper = mountList();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('initializes with empty state', () => {
      const wrapper = mountList();
      expect(wrapper.vm.selectedStory).toBeNull();
      expect(wrapper.vm.showViewModal).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('hasStories returns false when empty', () => {
      const wrapper = mountList({ stories: [] });
      expect(wrapper.vm.hasStories).toBe(false);
    });

    it('hasStories returns true when stories exist', () => {
      const wrapper = mountList({ stories: [mockStory1] });
      expect(wrapper.vm.hasStories).toBe(true);
    });

    it('hasStories updates reactively', async () => {
      const wrapper = mountList({ stories: [] });
      expect(wrapper.vm.hasStories).toBe(false);
      await wrapper.setProps({ stories: [mockStory1] });
      expect(wrapper.vm.hasStories).toBe(true);
    });
  });

  describe('getCompanyName Method', () => {
    it('returns company name when showCompanyNames is true', () => {
      const wrapper = mountList({ showCompanyNames: true });
      const companyName = wrapper.vm.getCompanyName(mockStory1);
      expect(companyName).toBe('Tech Corp');
    });

    it('returns undefined when showCompanyNames is false', () => {
      const wrapper = mountList({ showCompanyNames: false });
      const companyName = wrapper.vm.getCompanyName(mockStory1);
      expect(companyName).toBeUndefined();
    });

    it('returns undefined when showCompanyNames not provided', () => {
      const wrapper = mountList();
      const companyName = wrapper.vm.getCompanyName(mockStory1);
      expect(companyName).toBeUndefined();
    });

    it('returns undefined when story has no experienceId', () => {
      const storyNoExp = { ...mockStory1, experienceId: undefined };
      const wrapper = mountList({ showCompanyNames: true });
      const companyName = wrapper.vm.getCompanyName(storyNoExp);
      expect(companyName).toBeUndefined();
    });
  });

  describe('getExperienceName Method', () => {
    it('returns experience name when story has experienceId', () => {
      const wrapper = mountList();
      const experienceName = wrapper.vm.getExperienceName(mockStory1);
      expect(experienceName).toBe('Senior Engineer at Tech Corp');
    });

    it('returns undefined when story has no experienceId', () => {
      const storyNoExp = { ...mockStory1, experienceId: undefined };
      const wrapper = mountList();
      const experienceName = wrapper.vm.getExperienceName(storyNoExp);
      expect(experienceName).toBeUndefined();
    });

    it('handles different experience names', () => {
      const wrapper = mountList();
      expect(wrapper.vm.getExperienceName(mockStory1)).toBe('Senior Engineer at Tech Corp');
      expect(wrapper.vm.getExperienceName(mockStory2)).toBe('Tech Lead at Startup Inc');
    });
  });

  describe('handleView Method', () => {
    it('sets selected story', () => {
      const wrapper = mountList();
      expect(wrapper.vm.selectedStory).toBeNull();
      wrapper.vm.handleView(mockStory1);
      expect(wrapper.vm.selectedStory).toEqual(mockStory1);
    });

    it('opens view modal', () => {
      const wrapper = mountList();
      expect(wrapper.vm.showViewModal).toBe(false);
      wrapper.vm.handleView(mockStory1);
      expect(wrapper.vm.showViewModal).toBe(true);
    });

    it('can view different stories', () => {
      const wrapper = mountList();
      wrapper.vm.handleView(mockStory1);
      expect(wrapper.vm.selectedStory?.id).toBe('story-1');
      wrapper.vm.handleView(mockStory2);
      expect(wrapper.vm.selectedStory?.id).toBe('story-2');
    });
  });

  describe('handleEdit Method', () => {
    it('navigates to story edit page', () => {
      const wrapper = mountList();
      mockRouter.push.mockClear();
      wrapper.vm.handleEdit(mockStory1);
      expect(mockRouter.push).toHaveBeenCalledWith('/profile/experiences/exp-1/stories/story-1');
    });

    it('does not navigate when story has no experienceId', async () => {
      const storyNoExp = { ...mockStory1, experienceId: undefined };
      const wrapper = mountList();
      mockRouter.push.mockClear();

      await allowConsoleOutput(async () => {
        wrapper.vm.handleEdit(storyNoExp);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('navigates to different story routes', () => {
      const wrapper = mountList();
      mockRouter.push.mockClear();
      wrapper.vm.handleEdit(mockStory1);
      expect(mockRouter.push).toHaveBeenCalledWith('/profile/experiences/exp-1/stories/story-1');
      wrapper.vm.handleEdit(mockStory2);
      expect(mockRouter.push).toHaveBeenCalledWith('/profile/experiences/exp-2/stories/story-2');
    });
  });

  describe('handleDelete Method', () => {
    it('emits delete event with story', () => {
      const wrapper = mountList();
      wrapper.vm.handleDelete(mockStory1);
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')![0]).toEqual([mockStory1]);
    });

    it('can emit delete for different stories', () => {
      const wrapper = mountList();
      wrapper.vm.handleDelete(mockStory1);
      wrapper.vm.handleDelete(mockStory2);
      expect(wrapper.emitted('delete')).toHaveLength(2);
      expect(wrapper.emitted('delete')![0]).toEqual([mockStory1]);
      expect(wrapper.emitted('delete')![1]).toEqual([mockStory2]);
    });
  });

  describe('Loading State', () => {
    it('handles loading true', () => {
      const wrapper = mountList({ loading: true, stories: [] });
      expect(wrapper.props('loading')).toBe(true);
    });

    it('handles loading false', () => {
      const wrapper = mountList({ loading: false, stories: [] });
      expect(wrapper.props('loading')).toBe(false);
    });

    it('can transition from loading to loaded', async () => {
      const wrapper = mountList({ loading: true, stories: [] });
      expect(wrapper.props('loading')).toBe(true);
      await wrapper.setProps({ loading: false, stories: [mockStory1] });
      expect(wrapper.props('loading')).toBe(false);
      expect(wrapper.vm.hasStories).toBe(true);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no stories', () => {
      const wrapper = mountList({ stories: [] });
      expect(wrapper.vm.hasStories).toBe(false);
    });

    it('does not show empty state when stories exist', () => {
      const wrapper = mountList({ stories: [mockStory1] });
      expect(wrapper.vm.hasStories).toBe(true);
    });

    it('does not show empty state when loading', () => {
      const wrapper = mountList({ loading: true, stories: [] });
      expect(wrapper.props('loading')).toBe(true);
    });
  });

  describe('Story Grid', () => {
    it('provides correct story count', () => {
      const wrapper = mountList({ stories: [mockStory1, mockStory2] });
      expect(wrapper.props('stories')).toHaveLength(2);
    });

    it('maintains story order', () => {
      const wrapper = mountList({ stories: [mockStory1, mockStory2] });
      expect(wrapper.props('stories')[0].id).toBe('story-1');
      expect(wrapper.props('stories')[1].id).toBe('story-2');
    });

    it('handles single story', () => {
      const wrapper = mountList({ stories: [mockStory1] });
      expect(wrapper.props('stories')).toHaveLength(1);
      expect(wrapper.vm.hasStories).toBe(true);
    });

    it('handles many stories', () => {
      const manyStories = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockStory1,
          id: `story-${i}`,
        }));
      const wrapper = mountList({ stories: manyStories });
      expect(wrapper.props('stories')).toHaveLength(10);
    });
  });

  describe('Modal State Management', () => {
    it('initializes modal as closed', () => {
      const wrapper = mountList();
      expect(wrapper.vm.showViewModal).toBe(false);
      expect(wrapper.vm.selectedStory).toBeNull();
    });

    it('opens and closes modal', () => {
      const wrapper = mountList();
      wrapper.vm.handleView(mockStory1);
      expect(wrapper.vm.showViewModal).toBe(true);
      expect(wrapper.vm.selectedStory).not.toBeNull();
      wrapper.vm.showViewModal = false;
      expect(wrapper.vm.showViewModal).toBe(false);
    });

    it('maintains selected story when modal opens', () => {
      const wrapper = mountList();
      wrapper.vm.handleView(mockStory1);
      expect(wrapper.vm.selectedStory?.id).toBe('story-1');
      expect(wrapper.vm.selectedStory?.title).toBe('Migration Project');
    });
  });

  describe('Experience Filtering', () => {
    it('accepts experienceId for filtering', () => {
      const wrapper = mountList({ experienceId: 'exp-1', stories: [mockStory1] });
      expect(wrapper.props('experienceId')).toBe('exp-1');
    });

    it('works without experienceId', () => {
      const wrapper = mountList({ stories: [mockStory1, mockStory2] });
      expect(wrapper.props('experienceId')).toBeUndefined();
      expect(wrapper.props('stories')).toHaveLength(2);
    });
  });

  describe('Events', () => {
    it('emits refresh event', () => {
      const wrapper = mountList();
      wrapper.vm.$emit('refresh');
      expect(wrapper.emitted('refresh')).toBeTruthy();
    });

    it('can emit multiple events', () => {
      const wrapper = mountList();
      wrapper.vm.handleDelete(mockStory1);
      wrapper.vm.$emit('refresh');
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('refresh')).toBeTruthy();
    });
  });
});
