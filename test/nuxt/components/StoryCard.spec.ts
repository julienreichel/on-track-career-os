import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import StoryCard from '@/components/StoryCard.vue';
import type { STARStory } from '@/domain/starstory/STARStory';

const mountCard = (props = {}) => {
  return mount(StoryCard, {
    props: {
      story: mockStory,
      ...props,
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        ItemCard: true,
        UBadge: true,
        UButton: true,
        ConfirmModal: true,
      },
    },
  });
};

const mockStory: STARStory = {
  id: 'story-1',
  experienceId: 'exp-1',
  userId: 'user-1',
  title: 'Led Migration Project',
  situation: 'The company needed to migrate legacy systems to modern infrastructure.',
  task: 'Lead the migration of 50+ applications with minimal disruption.',
  action: 'Created a comprehensive migration plan, coordinated with teams, and executed in phases.',
  result: 'Successfully migrated all systems with zero downtime and improved performance by 40%.',
  achievements: ['Zero downtime', 'Improved performance by 40%'],
  kpiSuggestions: ['50+ applications migrated', '40% performance improvement'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 'user-1',
};

describe('StoryCard', () => {
  describe('Props', () => {
    it('accepts story prop', () => {
      const wrapper = mountCard();
      expect(wrapper.props('story')).toEqual(mockStory);
    });

    it('accepts optional experienceName prop', () => {
      const wrapper = mountCard({ experienceName: 'Senior Engineer at Tech Corp' });
      expect(wrapper.props('experienceName')).toBe('Senior Engineer at Tech Corp');
    });

    it('accepts optional companyName prop', () => {
      const wrapper = mountCard({ companyName: 'Tech Corp' });
      expect(wrapper.props('companyName')).toBe('Tech Corp');
    });

    it('handles missing optional props', () => {
      const wrapper = mountCard();
      expect(wrapper.props('experienceName')).toBeUndefined();
      expect(wrapper.props('companyName')).toBeUndefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const wrapper = mountCard();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('initializes with delete modal closed', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });
  });

  describe('headerTitle Computed', () => {
    it('returns story title when available', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.headerTitle).toBe('Led Migration Project');
    });

    it('returns fallback when title is empty', () => {
      const storyNoTitle = { ...mockStory, title: '' };
      const wrapper = mountCard({ story: storyNoTitle });
      expect(wrapper.vm.headerTitle).toBe('Untitled Story');
    });

    it('returns fallback when title is undefined', () => {
      const storyNoTitle = { ...mockStory, title: undefined };
      const wrapper = mountCard({ story: storyNoTitle });
      expect(wrapper.vm.headerTitle).toBe('Untitled Story');
    });

    it('handles whitespace-only titles', () => {
      const storyWhitespace = { ...mockStory, title: '   ' };
      const wrapper = mountCard({ story: storyWhitespace });
      expect(wrapper.vm.headerTitle).toBe('Untitled Story');
    });
  });

  describe('subtitle Computed', () => {
    it('returns experience name when available', () => {
      const wrapper = mountCard({ experienceName: 'Senior Engineer at Tech Corp' });
      expect(wrapper.vm.subtitle).toBe('Senior Engineer at Tech Corp');
    });

    it('returns company name when experience name not available', () => {
      const wrapper = mountCard({ companyName: 'Tech Corp' });
      expect(wrapper.vm.subtitle).toBe('Tech Corp');
    });

    it('returns undefined when neither available', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.subtitle).toBeUndefined();
    });

    it('combines experience and company name when both provided and different', () => {
      const wrapper = mountCard({
        experienceName: 'Senior Engineer at Tech Corp',
        companyName: 'Tech Corp',
      });
      expect(wrapper.vm.subtitle).toBe('Senior Engineer at Tech Corp · Tech Corp');
    });
  });

  describe('preview Computed', () => {
    it('generates preview from situation', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.preview).toContain('The company needed to migrate');
    });

    it('truncates long situation text', () => {
      const longText = 'A'.repeat(300);
      const storyLongSituation = { ...mockStory, situation: longText };
      const wrapper = mountCard({ story: storyLongSituation });
      expect(wrapper.vm.preview.length).toBeLessThanOrEqual(203); // 200 chars + '...'
    });

    it('does not truncate short situation text', () => {
      const shortText = 'Short situation';
      const storyShortSituation = { ...mockStory, situation: shortText };
      const wrapper = mountCard({ story: storyShortSituation });
      expect(wrapper.vm.preview).toBe(shortText);
    });

    it('falls back to task when situation is empty', () => {
      const storyEmptySituation = { ...mockStory, situation: '' };
      const wrapper = mountCard({ story: storyEmptySituation });
      expect(wrapper.vm.preview).toContain('Lead the migration');
    });
  });

  describe('hasAchievements Computed', () => {
    it('returns true when achievements exist', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.hasAchievements).toBe(true);
    });

    it('returns false when achievements array is empty', () => {
      const storyNoAchievements = { ...mockStory, achievements: [] };
      const wrapper = mountCard({ story: storyNoAchievements });
      expect(wrapper.vm.hasAchievements).toBe(false);
    });

    it('returns false when achievements is undefined', () => {
      const storyNoAchievements = { ...mockStory, achievements: undefined };
      const wrapper = mountCard({ story: storyNoAchievements });
      expect(wrapper.vm.hasAchievements).toBe(false);
    });
  });

  describe('hasKpis Computed', () => {
    it('returns true when KPIs exist', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.hasKpis).toBe(true);
    });

    it('returns false when KPIs array is empty', () => {
      const storyNoKpis = { ...mockStory, kpiSuggestions: [] };
      const wrapper = mountCard({ story: storyNoKpis });
      expect(wrapper.vm.hasKpis).toBe(false);
    });

    it('returns false when KPIs is undefined', () => {
      const storyNoKpis = { ...mockStory, kpiSuggestions: undefined };
      const wrapper = mountCard({ story: storyNoKpis });
      expect(wrapper.vm.hasKpis).toBe(false);
    });
  });

  describe('achievementCount Computed', () => {
    it('returns correct count when achievements exist', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.achievementCount).toBe(2);
    });

    it('returns 0 when no achievements', () => {
      const storyNoAchievements = { ...mockStory, achievements: [] };
      const wrapper = mountCard({ story: storyNoAchievements });
      expect(wrapper.vm.achievementCount).toBe(0);
    });

    it('returns 0 when achievements undefined', () => {
      const storyNoAchievements = { ...mockStory, achievements: undefined };
      const wrapper = mountCard({ story: storyNoAchievements });
      expect(wrapper.vm.achievementCount).toBe(0);
    });

    it('handles large achievement count', () => {
      const manyAchievements = Array(10).fill('Achievement');
      const storyManyAchievements = { ...mockStory, achievements: manyAchievements };
      const wrapper = mountCard({ story: storyManyAchievements });
      expect(wrapper.vm.achievementCount).toBe(10);
    });
  });

  describe('kpiCount Computed', () => {
    it('returns correct count when KPIs exist', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.kpiCount).toBe(2);
    });

    it('returns 0 when no KPIs', () => {
      const storyNoKpis = { ...mockStory, kpiSuggestions: [] };
      const wrapper = mountCard({ story: storyNoKpis });
      expect(wrapper.vm.kpiCount).toBe(0);
    });

    it('returns 0 when KPIs undefined', () => {
      const storyNoKpis = { ...mockStory, kpiSuggestions: undefined };
      const wrapper = mountCard({ story: storyNoKpis });
      expect(wrapper.vm.kpiCount).toBe(0);
    });

    it('handles large KPI count', () => {
      const manyKpis = Array(15).fill('KPI');
      const storyManyKpis = { ...mockStory, kpiSuggestions: manyKpis };
      const wrapper = mountCard({ story: storyManyKpis });
      expect(wrapper.vm.kpiCount).toBe(15);
    });
  });

  describe('handleView Method', () => {
    it('emits view event with story', () => {
      const wrapper = mountCard();
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;
      wrapper.vm.handleView(mockEvent);
      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')![0]).toEqual([mockStory]);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('can be called multiple times', () => {
      const wrapper = mountCard();
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;
      wrapper.vm.handleView(mockEvent);
      wrapper.vm.handleView(mockEvent);
      expect(wrapper.emitted('view')).toHaveLength(2);
    });
  });

  describe('handleEdit Method', () => {
    it('emits edit event with story', () => {
      const wrapper = mountCard();
      wrapper.vm.handleEdit();
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')![0]).toEqual([mockStory]);
    });

    it('can be called multiple times', () => {
      const wrapper = mountCard();
      wrapper.vm.handleEdit();
      wrapper.vm.handleEdit();
      expect(wrapper.emitted('edit')).toHaveLength(2);
    });
  });

  describe('handleDelete Method', () => {
    it('shows delete confirmation modal', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
      wrapper.vm.handleDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(true);
    });

    it('can be triggered multiple times', () => {
      const wrapper = mountCard();
      wrapper.vm.handleDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(true);
      wrapper.vm.cancelDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
      wrapper.vm.handleDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(true);
    });
  });

  describe('confirmDelete Method', () => {
    it('emits delete event with story', () => {
      const wrapper = mountCard();
      wrapper.vm.confirmDelete();
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')![0]).toEqual([mockStory]);
    });

    it('closes delete confirmation modal', () => {
      const wrapper = mountCard();
      wrapper.vm.showDeleteConfirm = true;
      wrapper.vm.confirmDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });

    it('emits delete and closes modal in one action', () => {
      const wrapper = mountCard();
      wrapper.vm.handleDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(true);
      wrapper.vm.confirmDelete();
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });
  });

  describe('cancelDelete Method', () => {
    it('closes delete confirmation modal', () => {
      const wrapper = mountCard();
      wrapper.vm.showDeleteConfirm = true;
      wrapper.vm.cancelDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });

    it('does not emit delete event', () => {
      const wrapper = mountCard();
      wrapper.vm.handleDelete();
      wrapper.vm.cancelDelete();
      expect(wrapper.emitted('delete')).toBeFalsy();
    });

    it('can be called when modal already closed', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
      wrapper.vm.cancelDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
    });
  });

  describe('Delete Modal Flow', () => {
    it('follows complete delete flow', () => {
      const wrapper = mountCard();
      // Start with modal closed
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
      // Open modal
      wrapper.vm.handleDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(true);
      // Confirm delete
      wrapper.vm.confirmDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
      expect(wrapper.emitted('delete')).toBeTruthy();
    });

    it('follows cancel flow', () => {
      const wrapper = mountCard();
      // Open modal
      wrapper.vm.handleDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(true);
      // Cancel
      wrapper.vm.cancelDelete();
      expect(wrapper.vm.showDeleteConfirm).toBe(false);
      expect(wrapper.emitted('delete')).toBeFalsy();
    });
  });

  describe('Content Variations', () => {
    it('handles minimal story', () => {
      const minimalStory: STARStory = {
        id: 'story-2',
        experienceId: 'exp-2',
        userId: 'user-1',
        situation: 'Minimal situation',
        task: 'Minimal task',
        action: 'Minimal action',
        result: 'Minimal result',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        owner: 'user-1',
      };
      const wrapper = mountCard({ story: minimalStory });
      expect(wrapper.vm.hasAchievements).toBe(false);
      expect(wrapper.vm.hasKpis).toBe(false);
      expect(wrapper.vm.achievementCount).toBe(0);
      expect(wrapper.vm.kpiCount).toBe(0);
    });

    it('handles story with all fields', () => {
      const fullStory: STARStory = {
        ...mockStory,
        achievements: ['A1', 'A2', 'A3', 'A4', 'A5'],
        kpiSuggestions: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'],
      };
      const wrapper = mountCard({ story: fullStory });
      expect(wrapper.vm.hasAchievements).toBe(true);
      expect(wrapper.vm.hasKpis).toBe(true);
      expect(wrapper.vm.achievementCount).toBe(5);
      expect(wrapper.vm.kpiCount).toBe(6);
    });

    it('handles story with very long content', () => {
      const longStory: STARStory = {
        ...mockStory,
        title: 'A'.repeat(100),
        situation: 'B'.repeat(500),
      };
      const wrapper = mountCard({ story: longStory });
      expect(wrapper.vm.headerTitle.length).toBe(100);
      expect(wrapper.vm.preview.length).toBeLessThanOrEqual(203);
    });
  });

  describe('Events', () => {
    it('emits all three event types', () => {
      const wrapper = mountCard();
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;
      wrapper.vm.handleView(mockEvent);
      wrapper.vm.handleEdit();
      wrapper.vm.confirmDelete();
      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('delete')).toBeTruthy();
    });

    it('emits events with correct story data', () => {
      const wrapper = mountCard();
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;
      wrapper.vm.handleView(mockEvent);
      wrapper.vm.handleEdit();
      wrapper.vm.confirmDelete();
      expect(wrapper.emitted('view')![0]).toEqual([mockStory]);
      expect(wrapper.emitted('edit')![0]).toEqual([mockStory]);
      expect(wrapper.emitted('delete')![0]).toEqual([mockStory]);
    });
  });

  describe('Badge Display Logic', () => {
    it('shows badges when achievements and KPIs exist', () => {
      const wrapper = mountCard();
      expect(wrapper.vm.hasAchievements).toBe(true);
      expect(wrapper.vm.hasKpis).toBe(true);
      expect(wrapper.vm.achievementCount).toBe(2);
      expect(wrapper.vm.kpiCount).toBe(2);
    });

    it('hides badges when no achievements or KPIs', () => {
      const storyNoBadges = {
        ...mockStory,
        achievements: [],
        kpiSuggestions: [],
      };
      const wrapper = mountCard({ story: storyNoBadges });
      expect(wrapper.vm.hasAchievements).toBe(false);
      expect(wrapper.vm.hasKpis).toBe(false);
    });

    it('shows only achievement badge when KPIs missing', () => {
      const storyOnlyAchievements = {
        ...mockStory,
        kpiSuggestions: [],
      };
      const wrapper = mountCard({ story: storyOnlyAchievements });
      expect(wrapper.vm.hasAchievements).toBe(true);
      expect(wrapper.vm.hasKpis).toBe(false);
    });

    it('shows only KPI badge when achievements missing', () => {
      const storyOnlyKpis = {
        ...mockStory,
        achievements: [],
      };
      const wrapper = mountCard({ story: storyOnlyKpis });
      expect(wrapper.vm.hasAchievements).toBe(false);
      expect(wrapper.vm.hasKpis).toBe(true);
    });
  });
});
