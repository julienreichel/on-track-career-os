import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import KanbanStageListEditorCard from '@/components/settings/KanbanStageListEditorCard.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div><slot name="header" /><slot /></div>' },
  UFormField: { template: '<div><slot /></div>' },
  UInput: {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue', 'keydown'],
    template:
      '<input :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$emit(\'keydown\', $event)" />',
  },
  UButton: {
    props: ['disabled', 'label'],
    emits: ['click'],
    template:
      '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}<slot /></button>',
  },
};

describe('KanbanStageListEditorCard', () => {
  it('cannot delete todo and done stages', async () => {
    const wrapper = mount(KanbanStageListEditorCard, {
      props: {
        stages: [
          { key: 'todo', name: 'ToDo', isSystemDefault: true },
          { key: 'review', name: 'Review', isSystemDefault: false },
          { key: 'done', name: 'Done', isSystemDefault: true },
        ],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const deleteButtons = wrapper.findAll('button').filter((button) => button.text() === '');
    expect(deleteButtons.length).toBeGreaterThan(0);

    await wrapper.find('[data-testid="kanban-stage-delete-todo"]').trigger('click');
    await wrapper.find('[data-testid="kanban-stage-delete-done"]').trigger('click');

    const emitted = wrapper.emitted('update:stages') ?? [];
    const includesSystemRemoval = emitted.some((payload) => {
      const stages = payload[0] as Array<{ key: string }>;
      return !stages.some((stage) => stage.key === 'todo' || stage.key === 'done');
    });
    expect(includesSystemRemoval).toBe(false);

    expect(wrapper.find('[data-testid="kanban-stage-move-down-todo"]').attributes('disabled')).toBe(
      ''
    );
    expect(wrapper.find('[data-testid="kanban-stage-move-up-done"]').attributes('disabled')).toBe(
      ''
    );
  });

  it('adds a stage with a unique generated key', async () => {
    const wrapper = mount(KanbanStageListEditorCard, {
      props: {
        stages: [
          { key: 'todo', name: 'ToDo', isSystemDefault: true },
          { key: 'review', name: 'Review', isSystemDefault: false },
          { key: 'review-2', name: 'Review 2', isSystemDefault: false },
          { key: 'done', name: 'Done', isSystemDefault: true },
        ],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const inputs = wrapper.findAll('input');
    const addInput = inputs[inputs.length - 1];
    if (!addInput) {
      throw new Error('Add input not found');
    }
    await addInput.setValue('Review');
    await wrapper.find('[data-testid="kanban-stage-add-button"]').trigger('click');

    const latest = wrapper.emitted('update:stages')?.at(-1)?.[0] as Array<{ key: string }>;
    expect(latest.map((stage) => stage.key)).toContain('review-3');
  });

  it('reorders stages deterministically', async () => {
    const wrapper = mount(KanbanStageListEditorCard, {
      props: {
        stages: [
          { key: 'todo', name: 'ToDo', isSystemDefault: true },
          { key: 'applied', name: 'Applied', isSystemDefault: false },
          { key: 'review', name: 'Review', isSystemDefault: false },
          { key: 'done', name: 'Done', isSystemDefault: true },
        ],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('[data-testid="kanban-stage-move-down-applied"]').trigger('click');
    const latest = wrapper.emitted('update:stages')?.at(-1)?.[0] as Array<{ key: string }>;
    expect(latest.map((stage) => stage.key)).toEqual(['todo', 'review', 'applied', 'done']);
  });
});
