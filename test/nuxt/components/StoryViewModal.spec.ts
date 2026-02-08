import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import StoryViewModal from '@/components/StoryViewModal.vue';
import type { STARStory } from '@/domain/starstory/STARStory';

const mountModal = (props = {}) => {
  return mount(StoryViewModal, {
    props: {
      story: mockStory,
      open: false,
      ...props,
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        UModal: true,
        UIcon: true,
      },
    },
  });
};

const mockStory: STARStory = {
  id: 'story-1',
  experienceId: 'exp-1',
  userId: 'user-1',
  title: 'Led Migration Project',
  situation: 'The company needed to migrate legacy systems.',
  task: 'Lead the migration of 50+ applications.',
  action: 'Created a comprehensive plan and led the team.',
  result: 'Successfully migrated all systems with zero downtime.',
  achievements: ['Zero downtime', 'Improved performance by 40%'],
  kpiSuggestions: ['50+ applications migrated', '40% performance improvement'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 'user-1',
};

describe('StoryViewModal', () => {
  describe('Props', () => {
    it('accepts story prop', () => {
      const wrapper = mountModal();
      expect(wrapper.props('story')).toEqual(mockStory);
    });

    it('accepts open prop', () => {
      const wrapper = mountModal({ open: true });
      expect(wrapper.props('open')).toBe(true);
    });

    it('accepts optional experienceName prop', () => {
      const wrapper = mountModal({ experienceName: 'Senior Engineer at Tech Corp' });
      expect(wrapper.props('experienceName')).toBe('Senior Engineer at Tech Corp');
    });

    it('handles missing experienceName', () => {
      const wrapper = mountModal();
      expect(wrapper.props('experienceName')).toBeUndefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const wrapper = mountModal();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('maintains story data after mount', () => {
      const wrapper = mountModal();
      expect(wrapper.vm.$props.story.id).toBe('story-1');
      expect(wrapper.vm.$props.story.title).toBe('Led Migration Project');
    });
  });

  describe('STAR Content', () => {
    it('provides all STAR fields', () => {
      const wrapper = mountModal();
      const story = wrapper.vm.$props.story;
      expect(story.situation).toBe('The company needed to migrate legacy systems.');
      expect(story.task).toBe('Lead the migration of 50+ applications.');
      expect(story.action).toBe('Created a comprehensive plan and led the team.');
      expect(story.result).toBe('Successfully migrated all systems with zero downtime.');
    });

    it('handles story with title', () => {
      const wrapper = mountModal();
      expect(wrapper.vm.$props.story.title).toBe('Led Migration Project');
    });

    it('handles story without title', () => {
      const storyWithoutTitle = { ...mockStory, title: '' };
      const wrapper = mountModal({ story: storyWithoutTitle });
      expect(wrapper.vm.$props.story.title).toBe('');
    });
  });

  describe('Achievements Logic', () => {
    it('detects when story has achievements', () => {
      const wrapper = mountModal();
      expect(wrapper.vm.hasAchievements).toBe(true);
    });

    it('detects when story has no achievements', () => {
      const storyNoAchievements = { ...mockStory, achievements: [] };
      const wrapper = mountModal({ story: storyNoAchievements });
      expect(wrapper.vm.hasAchievements).toBe(false);
    });

    it('handles undefined achievements', () => {
      const storyNoAchievements = { ...mockStory, achievements: undefined };
      const wrapper = mountModal({ story: storyNoAchievements });
      expect(wrapper.vm.hasAchievements).toBe(false);
    });

    it('provides correct achievement count', () => {
      const wrapper = mountModal();
      expect(wrapper.vm.$props.story.achievements?.length).toBe(2);
    });
  });

  describe('KPIs Logic', () => {
    it('detects when story has KPIs', () => {
      const wrapper = mountModal();
      expect(wrapper.vm.hasKpis).toBe(true);
    });

    it('detects when story has no KPIs', () => {
      const storyNoKpis = { ...mockStory, kpiSuggestions: [] };
      const wrapper = mountModal({ story: storyNoKpis });
      expect(wrapper.vm.hasKpis).toBe(false);
    });

    it('handles undefined KPIs', () => {
      const storyNoKpis = { ...mockStory, kpiSuggestions: undefined };
      const wrapper = mountModal({ story: storyNoKpis });
      expect(wrapper.vm.hasKpis).toBe(false);
    });

    it('provides correct KPI count', () => {
      const wrapper = mountModal();
      expect(wrapper.vm.$props.story.kpiSuggestions?.length).toBe(2);
    });
  });

  describe('Events', () => {
    it('emits update:open when closed', () => {
      const wrapper = mountModal({ open: true });
      wrapper.vm.close();
      expect(wrapper.emitted('update:open')).toBeTruthy();
      expect(wrapper.emitted('update:open')![0]).toEqual([false]);
    });

    it('can toggle open state via emit', () => {
      const wrapper = mountModal({ open: false });
      wrapper.vm.$emit('update:open', true);
      expect(wrapper.emitted('update:open')![0]).toEqual([true]);
    });
  });

  describe('Content Variations', () => {
    it('handles story with all optional fields', () => {
      const fullStory: STARStory = {
        ...mockStory,
        achievements: ['Achievement 1', 'Achievement 2', 'Achievement 3'],
        kpiSuggestions: ['KPI 1', 'KPI 2', 'KPI 3', 'KPI 4'],
      };
      const wrapper = mountModal({ story: fullStory });
      expect(wrapper.vm.$props.story.achievements?.length).toBe(3);
      expect(wrapper.vm.$props.story.kpiSuggestions?.length).toBe(4);
    });

    it('handles minimal story', () => {
      const minimalStory: STARStory = {
        id: 'story-2',
        experienceId: 'exp-2',
        userId: 'user-1',
        situation: 'Situation text',
        task: 'Task text',
        action: 'Action text',
        result: 'Result text',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        owner: 'user-1',
      };
      const wrapper = mountModal({ story: minimalStory });
      expect(wrapper.vm.hasAchievements).toBe(false);
      expect(wrapper.vm.hasKpis).toBe(false);
    });

    it('handles story with long content', () => {
      const longStory: STARStory = {
        ...mockStory,
        situation: 'A'.repeat(500),
        task: 'B'.repeat(500),
        action: 'C'.repeat(500),
        result: 'D'.repeat(500),
      };
      const wrapper = mountModal({ story: longStory });
      expect(wrapper.vm.$props.story.situation.length).toBe(500);
    });
  });

  describe('Experience Context', () => {
    it('provides experience name when available', () => {
      const wrapper = mountModal({ experienceName: 'Tech Lead at Startup' });
      expect(wrapper.vm.$props.experienceName).toBe('Tech Lead at Startup');
    });

    it('handles complex experience names', () => {
      const wrapper = mountModal({
        experienceName: 'Principal Software Engineer at Company Inc. (Remote)',
      });
      expect(wrapper.vm.$props.experienceName).toContain('Principal Software Engineer');
      expect(wrapper.vm.$props.experienceName).toContain('Remote');
    });
  });

  describe('Modal State Management', () => {
    it('can be opened', () => {
      const wrapper = mountModal({ open: true });
      expect(wrapper.props('open')).toBe(true);
    });

    it('can be closed', () => {
      const wrapper = mountModal({ open: false });
      expect(wrapper.props('open')).toBe(false);
    });

    it('close method updates open state', () => {
      const wrapper = mountModal({ open: true });
      wrapper.vm.close();
      expect(wrapper.emitted('update:open')).toBeTruthy();
    });
  });
});
