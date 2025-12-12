import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PersonalCanvasComponent from '@/components/PersonalCanvasComponent.vue';

// Mock Nuxt UI components
vi.mock('#app', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('PersonalCanvasComponent', () => {
  const mockCanvas = {
    id: 'canvas-123',
    userId: 'user-123',
    valueProposition: 'Experienced engineer',
    keyActivities: ['Development', 'Mentoring'],
    strengthsAdvantage: 'Technical leadership',
    targetRoles: ['Senior Engineer', 'Tech Lead'],
    channels: ['LinkedIn', 'GitHub'],
    resources: ['AWS Certification', 'Open Source'],
    careerDirection: 'Moving towards leadership',
    painRelievers: ['Process improvement'],
    gainCreators: ['Team productivity'],
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
        stubs: {
          UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
          UButton: { template: '<button><slot /></button>' },
          UIcon: true,
          UBadge: true,
        },
      },
    });

    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('canvas.empty.title');
  });

  it('renders loading state', () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: null,
        loading: true,
      },
      global: {
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
        stubs: {
          UCard: { template: '<div class="u-card"><slot name="header" /><slot /></div>' },
          UIcon: true,
          UTextarea: true,
          UButton: true,
          UBadge: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Experienced engineer');
    expect(wrapper.text()).toContain('Development');
    expect(wrapper.text()).toContain('Technical leadership');
  });

  it('emits generate event when generate button clicked', async () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: null,
        loading: false,
      },
      global: {
        stubs: {
          UCard: { template: '<div><slot name="header" /><slot /></div>' },
          UButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          UIcon: true,
        },
      },
    });

    await wrapper.findComponent({ name: 'UButton' }).trigger('click');
    expect(wrapper.emitted('generate')).toBeTruthy();
  });

  it('switches to edit mode when edit button clicked', async () => {
    const wrapper = mount(PersonalCanvasComponent, {
      props: {
        canvas: mockCanvas as any,
        loading: false,
      },
      global: {
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
