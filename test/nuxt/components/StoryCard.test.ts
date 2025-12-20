import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StoryCard from '@/components/StoryCard.vue';
import type { STARStory } from '@/domain/starstory/STARStory';

describe('StoryCard.vue', () => {
  const mockStory: STARStory = {
    id: 'story-1',
    title: 'Cloud Migration Win',
    situation:
      'This is a long situation text that should be truncated when displayed in the card preview because it exceeds the maximum length of 150 characters that we allow for the preview text in the story card component',
    task: 'Test task',
    action: 'Test action',
    result: 'Test result',
    achievements: ['Achievement 1', 'Achievement 2'],
    kpiSuggestions: ['KPI 1'],
    experienceId: 'exp-1',
    owner: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should render story preview', () => {
    const wrapper = mount(StoryCard, {
      props: { story: mockStory },
    });

    expect(wrapper.text()).toContain('This is a long situation');
  });

  it('should truncate long preview text', () => {
    const wrapper = mount(StoryCard, {
      props: { story: mockStory },
    });

    const preview = wrapper.text();
    expect(preview).toContain('...');
    expect(preview.length).toBeLessThan(mockStory.situation.length);
  });

  it('should display experience name when provided', () => {
    const wrapper = mount(StoryCard, {
      props: {
        story: mockStory,
        experienceName: 'Senior Engineer at Acme',
      },
    });

    expect(wrapper.text()).toContain('Senior Engineer at Acme');
  });

  it('should show achievements badge with count', () => {
    const wrapper = mount(StoryCard, {
      props: { story: mockStory },
    });

    expect(wrapper.text()).toContain('2');
  });

  it('should show KPI badge with count', () => {
    const wrapper = mount(StoryCard, {
      props: { story: mockStory },
    });

    expect(wrapper.text()).toContain('1');
  });

  it('should emit view event when view button clicked', async () => {
    const wrapper = mount(StoryCard, {
      props: { story: mockStory },
    });

    const buttons = wrapper.findAll('button');
    const viewButton = buttons.find((btn) => btn.text().includes('View'));
    await viewButton?.trigger('click');

    expect(wrapper.emitted('view')).toBeTruthy();
    expect(wrapper.emitted('view')?.[0]).toEqual([mockStory]);
  });

  it('should not show badges when no achievements or KPIs', () => {
    const storyWithoutEnhancements: STARStory = {
      ...mockStory,
      achievements: [],
      kpiSuggestions: [],
    };

    const wrapper = mount(StoryCard, {
      props: { story: storyWithoutEnhancements },
    });

    const badges = wrapper.findAll('[data-test="badge"]');
    expect(badges).toHaveLength(0);
  });
});
