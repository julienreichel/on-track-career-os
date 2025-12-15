import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import CvEditor from '@/components/cv/render/Editor.vue';
import type { CVBlock } from '@/domain/cvdocument/CVDocumentService';

// Mock composables
const mockLoad = vi.fn();
const mockSave = vi.fn();
const mockAddBlock = vi.fn();
const mockRemoveBlock = vi.fn();
const mockUpdateBlock = vi.fn();
const mockReorderBlocks = vi.fn();
const mockMoveBlock = vi.fn();
const mockUndo = vi.fn();
const mockReplaceBlock = vi.fn();
const mockRegenerateBlock = vi.fn();

vi.mock('@/application/cvdocument/useCvEditor', () => ({
  useCvEditor: () => ({
    blocks: ref([]),
    isDirty: ref(false),
    isSaving: ref(false),
    canUndo: ref(false),
    load: mockLoad,
    save: mockSave,
    addBlock: mockAddBlock,
    removeBlock: mockRemoveBlock,
    updateBlock: mockUpdateBlock,
    reorderBlocks: mockReorderBlocks,
    moveBlock: mockMoveBlock,
    undo: mockUndo,
    replaceBlock: mockReplaceBlock,
  }),
}));

vi.mock('@/application/cvdocument/useCvGenerator', () => ({
  useCvGenerator: () => ({
    regenerateBlock: mockRegenerateBlock,
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvEditor: {
        title: 'CV Editor',
        status: {
          saved: 'All changes saved',
          saving: 'Saving...',
          unsaved: 'Unsaved changes',
        },
        actions: {
          undo: 'Undo',
          addSection: 'Add Section',
          print: 'Print / Export PDF',
        },
        empty: {
          title: 'No sections yet',
          description: 'Add your first section to start building your CV',
        },
        toast: {
          blockAdded: 'Section added',
          blockRemoved: 'Section removed',
          blockUpdated: 'Section updated',
          regenerated: 'Section regenerated',
          regenerateFailed: 'Failed to regenerate section',
        },
      },
    },
  },
});

const stubs = {
  UCard: {
    template: '<div class="card"><slot /></div>',
  },
  UButton: {
    template: '<button :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'color', 'variant', 'size', 'disabled', 'loading'],
    emits: ['click'],
  },
  UIcon: {
    template: '<i :class="name" />',
    props: ['name'],
  },
  CvBlock: {
    template: '<div class="cv-block"><slot name="actions" /></div>',
    props: ['block', 'isDraggable', 'isDragging', 'isSelected'],
  },
  CvBlockActions: {
    template: `
      <div class="cv-block-actions">
        <button @click="$emit('move-up')">Move Up</button>
        <button @click="$emit('move-down')">Move Down</button>
        <button @click="$emit('edit')">Edit</button>
        <button @click="$emit('regenerate')">Regenerate</button>
        <button @click="$emit('remove')">Remove</button>
      </div>
    `,
    props: ['showMove', 'showEdit', 'showRegenerate', 'showRemove', 'isFirst', 'isLast', 'isRegenerating', 'confirmRemove'],
    emits: ['move-up', 'move-down', 'edit', 'regenerate', 'remove'],
  },
  CvBlockEditor: {
    template: '<div v-if="modelValue" class="editor-modal"><button @click="$emit(\'save\', { title: \'Test\', content: \'Updated\' })">Save</button></div>',
    props: ['modelValue', 'block', 'saving'],
    emits: ['update:modelValue', 'save'],
  },
  CvSectionAdd: {
    template: '<div class="section-add"><button @click="$emit(\'add\', \'summary\')">Add Summary</button></div>',
    emits: ['add'],
  },
  Draggable: {
    template: '<div class="draggable"><slot /></div>',
    props: ['modelValue', 'itemKey', 'handle'],
    emits: ['update:modelValue'],
  },
};

describe.skip('CvEditor', () => {
  const createMockBlock = (overrides: Partial<CVBlock> = {}): CVBlock => ({
    id: 'block-1',
    type: 'summary',
    content: {
      text: 'Test content',
    },
    order: 0,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor container', () => {
    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('calls load on mount', () => {
    mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(mockLoad).toHaveBeenCalledWith('cv-1');
  });

  it('displays empty state when no blocks', () => {
    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => []),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('No sections yet');
  });

  it('renders blocks when available', () => {
    const blocks = [
      createMockBlock({ id: 'block-1' }),
      createMockBlock({ id: 'block-2' }),
    ];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const cvBlocks = wrapper.findAll('.cv-block');
    expect(cvBlocks.length).toBe(2);
  });

  it('displays save status indicator', () => {
    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => []),
      isDirty: vi.fn(() => true),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Unsaved changes');
  });

  it('displays saving status', () => {
    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => []),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => true),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Saving...');
  });

  it('shows undo button when can undo', () => {
    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => []),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => true),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text() === 'Undo')).toBe(true);
  });

  it('calls undo when undo button clicked', async () => {
    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => []),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => true),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const undoButton = wrapper.findAll('button').find((b) => b.text() === 'Undo');
    await undoButton?.trigger('click');

    expect(mockUndo).toHaveBeenCalled();
  });

  it('calls moveBlock when move up clicked', async () => {
    const blocks = [createMockBlock({ id: 'block-1', order: 0 })];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const moveUpButton = wrapper.find('button:contains("Move Up")');
    await moveUpButton?.trigger('click');

    expect(mockMoveBlock).toHaveBeenCalledWith('block-1', 'up');
  });

  it('calls moveBlock when move down clicked', async () => {
    const blocks = [createMockBlock({ id: 'block-1', order: 0 })];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const moveDownButton = wrapper.find('button:contains("Move Down")');
    await moveDownButton?.trigger('click');

    expect(mockMoveBlock).toHaveBeenCalledWith('block-1', 'down');
  });

  it('opens editor modal when edit clicked', async () => {
    const blocks = [createMockBlock({ id: 'block-1' })];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const editButton = wrapper.find('button:contains("Edit")');
    await editButton?.trigger('click');

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.editor-modal').exists()).toBe(true);
  });

  it('calls updateBlock when save clicked in editor', async () => {
    const blocks = [createMockBlock({ id: 'block-1' })];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const editButton = wrapper.find('button:contains("Edit")');
    await editButton?.trigger('click');
    await wrapper.vm.$nextTick();

    const saveButton = wrapper.find('.editor-modal button:contains("Save")');
    await saveButton?.trigger('click');

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it('calls removeBlock when remove clicked', async () => {
    const blocks = [createMockBlock({ id: 'block-1' })];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const removeButton = wrapper.find('button:contains("Remove")');
    await removeButton?.trigger('click');

    expect(mockRemoveBlock).toHaveBeenCalledWith('block-1');
  });

  it('calls regenerateBlock when regenerate clicked', async () => {
    const blocks = [createMockBlock({ id: 'block-1', type: 'summary' })];
    mockRegenerateBlock.mockResolvedValue(createMockBlock({ id: 'block-1', content: { text: 'Regenerated' } }));

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const regenerateButton = wrapper.find('button:contains("Regenerate")');
    await regenerateButton?.trigger('click');

    expect(mockRegenerateBlock).toHaveBeenCalledWith('block-1', 'summary');
  });

  it('shows add section button', () => {
    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Add Section');
  });

  it('calls addBlock when section added', async () => {
    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => []),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const addSummaryButton = wrapper.find('.section-add button:contains("Add Summary")');
    await addSummaryButton?.trigger('click');

    expect(mockAddBlock).toHaveBeenCalledWith(expect.objectContaining({ type: 'summary' }));
  });

  it('shows print button', () => {
    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.text().includes('Print'))).toBe(true);
  });

  it('triggers print when print button clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const printButton = wrapper.findAll('button').find((b) => b.text().includes('Print'));
    await printButton?.trigger('click');

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('handles drag-drop reordering', async () => {
    const blocks = [
      createMockBlock({ id: 'block-1', order: 0 }),
      createMockBlock({ id: 'block-2', order: 1 }),
    ];

    useCvEditor.mockReturnValue({
      blocks: vi.fn(() => blocks),
      isDirty: vi.fn(() => false),
      isSaving: vi.fn(() => false),
      canUndo: vi.fn(() => false),
      load: mockLoad,
      save: mockSave,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      reorderBlocks: mockReorderBlocks,
      moveBlock: mockMoveBlock,
      undo: mockUndo,
      replaceBlock: mockReplaceBlock,
    });

    const wrapper = mount(CvEditor, {
      props: {
        cvId: 'cv-1',
        userId: 'user-1',
        selectedExperienceIds: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const draggable = wrapper.findComponent({ name: 'Draggable' });
    await draggable.vm.$emit('update:modelValue', [blocks[1], blocks[0]]);

    expect(mockReorderBlocks).toHaveBeenCalled();
  });
});
