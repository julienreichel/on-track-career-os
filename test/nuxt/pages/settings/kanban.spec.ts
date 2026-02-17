import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createTestI18n } from '../../../utils/createTestI18n';
import KanbanSettingsPage from '@/pages/settings/kanban.vue';

const i18n = createTestI18n();

const persistedStages = ref([
  { key: 'todo', name: 'ToDo', isSystemDefault: true },
  { key: 'done', name: 'Done', isSystemDefault: true },
]);

const stateStages = ref([...persistedStages.value]);
const mockLoad = vi.fn(async () => {
  stateStages.value = [...persistedStages.value];
  return [...persistedStages.value];
});
const mockSave = vi.fn(async (stages) => {
  persistedStages.value = [...stages];
  stateStages.value = [...stages];
  return [...stages];
});

vi.mock('@/application/kanban-settings/useKanbanSettings', () => ({
  useKanbanSettings: () => ({
    state: {
      stages: stateStages,
      isLoading: ref(false),
      error: ref(null),
    },
    load: mockLoad,
    save: mockSave,
    addStage: vi.fn(),
    removeStage: vi.fn(),
    moveStage: vi.fn(),
    renameStage: vi.fn(),
  }),
}));

const toastAdd = vi.fn();
vi.mock('#imports', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

describe('settings/kanban page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistedStages.value = [
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ];
    stateStages.value = [...persistedStages.value];
  });

  it('loads default stages when page mounts', async () => {
    const wrapper = mount(KanbanSettingsPage, {
      global: {
        plugins: [i18n],
        stubs: {
          UPage: { template: '<div><slot /></div>' },
          UPageHeader: { template: '<div><slot /></div>' },
          UPageBody: { template: '<div><slot /></div>' },
          UButton: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
          ErrorStateCard: { template: '<div class="error-state" />' },
          KanbanStageListEditorCard: {
            props: ['stages'],
            template: '<div class="editor">{{ stages.map((stage) => stage.key).join(",") }}</div>',
          },
        },
      },
    });

    await flushPromises();

    expect(mockLoad).toHaveBeenCalled();
    expect(wrapper.find('.editor').text()).toContain('todo');
    expect(wrapper.find('.editor').text()).toContain('done');
  });

  it('persists changes and reloads them on next mount', async () => {
    const stubs = {
      UPage: { template: '<div><slot /></div>' },
      UPageHeader: { template: '<div><slot /></div>' },
      UPageBody: { template: '<div><slot /></div>' },
      UButton: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
      ErrorStateCard: { template: '<div class="error-state" />' },
      KanbanStageListEditorCard: {
        props: ['stages'],
        emits: ['update:stages'],
        template:
          '<div><button data-testid="inject-stage" @click="$emit(\'update:stages\', [...stages, { key: \'review\', name: \'Review\', isSystemDefault: false }])">inject</button><span class="editor">{{ stages.map((stage) => stage.key).join(",") }}</span></div>',
      },
    };

    const wrapper = mount(KanbanSettingsPage, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });
    await flushPromises();

    await wrapper.find('[data-testid="inject-stage"]').trigger('click');
    await wrapper.find('[data-testid="kanban-settings-save"]').trigger('click');
    await flushPromises();

    expect(mockSave).toHaveBeenCalledWith([
      { key: 'todo', name: 'ToDo', isSystemDefault: true },
      { key: 'review', name: 'Review', isSystemDefault: false },
      { key: 'done', name: 'Done', isSystemDefault: true },
    ]);

    wrapper.unmount();

    const nextWrapper = mount(KanbanSettingsPage, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });
    await flushPromises();

    expect(nextWrapper.text()).toContain('review');
  });
});
