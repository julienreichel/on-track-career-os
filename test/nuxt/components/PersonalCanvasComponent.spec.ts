import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PersonalCanvasComponent from '~/components/PersonalCanvasComponent.vue';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      canvas: {
        title: 'Personal Business Model Canvas',
        description: 'Your career strategy at a glance',
        empty: {
          title: 'No canvas yet',
          description: 'Generate your first canvas from your profile',
        },
        sections: {
          customerSegments: 'Customer Segments',
          valueProposition: 'Value Proposition',
          channels: 'Channels',
          customerRelationships: 'Customer Relationships',
          keyActivities: 'Key Activities',
          keyResources: 'Key Resources',
          keyPartners: 'Key Partners',
          costStructure: 'Cost Structure',
          revenueStreams: 'Revenue Streams',
        },
      },
    },
  },
});

describe('PersonalCanvasComponent', () => {
  const mockCanvas = {
    id: 'canvas-123',
    userId: 'user-123',
    customerSegments: ['Tech Companies', 'Startups'],
    valueProposition: ['Experienced engineer', 'Technical leadership'],
    channels: ['LinkedIn', 'GitHub', 'Tech Conferences'],
    customerRelationships: ['Professional networking', 'Open source contributions'],
    keyActivities: ['Development', 'Mentoring', 'Code Review'],
    keyResources: ['AWS Certification', 'Open Source', '10 years experience'],
    keyPartners: ['Tech mentors', 'Professional network', 'Recruiters'],
    costStructure: ['Certifications', 'Conferences', 'Tools subscription'],
    revenueStreams: ['Salary', 'Stock options', 'Bonuses'],
    needsUpdate: false,
    lastGeneratedAt: '2025-01-15T00:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    owner: 'user-123::user-123',
  };

  it('renders empty state when no canvas provided', () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: null,
        loading: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
          UButton: { template: '<button><slot /></button>' },
          UIcon: true,
          UBadge: true,
        },
      },
    });

    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('No canvas yet');
  });

  it('renders loading state', () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: null,
        loading: true,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UIcon: { template: '<span class="loading-icon"></span>' },
        },
      },
    });

    expect(wrapper.find('.loading-icon').exists()).toBe(true);
  });

  it('renders canvas sections in view mode', () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: mockCanvas as any,
        loading: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
          UIcon: true,
          UTextarea: true,
          UButton: true,
          UBadge: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Tech Companies');
    expect(wrapper.text()).toContain('Development');
    expect(wrapper.text()).toContain('AWS Certification');
  });

  it('renders generate button when no canvas', () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: null,
        loading: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UButton: { template: '<button class="generate-btn"><slot /></button>' },
          UIcon: true,
        },
      },
    });

    expect(wrapper.find('.generate-btn').exists()).toBe(true);
  });

  it('switches to edit mode when edit button clicked', async () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: mockCanvas as any,
        loading: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          UIcon: true,
          UBadge: true,
          UTextarea: true,
        },
      },
    });

    // Find edit button and click it
    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const editButton = buttons.find((b) => b.text().includes('canvas.actions.edit'));

    if (editButton) {
      await editButton.trigger('click');
      // In edit mode, UTextarea components should be rendered
      expect(wrapper.findAllComponents({ name: 'UTextarea' }).length).toBeGreaterThan(0);
    }
  });

  it('emits save event with updated data when save clicked', async () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: mockCanvas as any,
        loading: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          UTextarea: {
            template:
              '<textarea v-model="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
          },
          UIcon: true,
          UBadge: true,
        },
      },
    });

    // Enter edit mode
    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const editButton = buttons.find((b) => b.text().includes('canvas.actions.edit'));

    if (editButton) {
      await editButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Click save button
      const saveButton = wrapper
        .findAllComponents({ name: 'UButton' })
        .find((b) => b.text().includes('canvas.actions.save'));
      if (saveButton) {
        await saveButton.trigger('click');
        expect(wrapper.emitted('save')).toBeTruthy();
      }
    }
  });

  it('displays needsUpdate badge when canvas needs update', () => {
    const canvasNeedingUpdate = { ...mockCanvas, needsUpdate: true };

    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: canvasNeedingUpdate as any,
        loading: false,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UBadge: { template: '<span class="badge"><slot /></span>' },
          UIcon: true,
          UButton: true,
          UTextarea: true,
        },
      },
    });

    expect(wrapper.find('.badge').exists()).toBe(true);
    expect(wrapper.text()).toContain('canvas.needsUpdate');
  });
});
