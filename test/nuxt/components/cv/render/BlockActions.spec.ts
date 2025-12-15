import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CvBlockActions from '@/components/cv/render/BlockActions.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvBlockActions: {
        moveUp: 'Move up',
        moveDown: 'Move down',
        edit: 'Edit',
        regenerate: 'Regenerate with AI',
        remove: 'Remove',
        confirmRemove: 'Are you sure you want to remove this block?',
      },
    },
  },
});

const stubs = {
  UButton: {
    template:
      '<button :icon="icon" :aria-label="ariaLabel" :class="{ loading }" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'size', 'color', 'variant', 'loading', 'disabled', 'ariaLabel'],
    emits: ['click'],
  },
};

describe('CvBlockActions', () => {
  it('renders all action buttons by default', () => {
    const wrapper = mount(CvBlockActions, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3); // At least edit, regenerate, remove
  });

  it('shows move up button when not first', () => {
    const wrapper = mount(CvBlockActions, {
      props: {
        isFirst: false,
        showMove: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('icon') === 'i-heroicons-arrow-up')).toBe(true);
  });

  it('hides move up button when isFirst is true', () => {
    const wrapper = mount(CvBlockActions, {
      props: {
        isFirst: true,
        showMove: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('aria-label') === 'Move up')).toBe(false);
  });

  it('shows move down button when not last', () => {
    const wrapper = mount(CvBlockActions, {
      props: {
        isLast: false,
        showMove: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('icon') === 'i-heroicons-arrow-down')).toBe(true);
  });

  it('hides move down button when isLast is true', () => {
    const wrapper = mount(CvBlockActions, {
      props: {
        isLast: true,
        showMove: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('aria-label') === 'Move down')).toBe(false);
  });

  it('emits move-up event when move up button clicked', async () => {
    const wrapper = mount(CvBlockActions, {
      props: { isFirst: false, showMove: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const moveUpBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-arrow-up');
    await moveUpBtn?.trigger('click');

    expect(wrapper.emitted('move-up')).toBeTruthy();
  });

  it('emits move-down event when move down button clicked', async () => {
    const wrapper = mount(CvBlockActions, {
      props: { isLast: false, showMove: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const moveDownBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-arrow-down');
    await moveDownBtn?.trigger('click');

    expect(wrapper.emitted('move-down')).toBeTruthy();
  });

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(CvBlockActions, {
      props: { showEdit: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const editBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-pencil');
    await editBtn?.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
  });

  it('emits regenerate event when regenerate button clicked', async () => {
    const wrapper = mount(CvBlockActions, {
      props: { showRegenerate: true },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const regenBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-arrow-path');
    await regenBtn?.trigger('click');

    expect(wrapper.emitted('regenerate')).toBeTruthy();
  });

  it('shows loading state on regenerate button', () => {
    const wrapper = mount(CvBlockActions, {
      props: {
        showRegenerate: true,
        isRegenerating: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const regenBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-arrow-path');
    expect(regenBtn?.classes()).toContain('loading');
  });

  it('confirms before emitting remove event when confirmRemove is true', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const wrapper = mount(CvBlockActions, {
      props: {
        showRemove: true,
        confirmRemove: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const removeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-trash');
    await removeBtn?.trigger('click');

    expect(confirmSpy).toHaveBeenCalled();
    expect(wrapper.emitted('remove')).toBeTruthy();

    confirmSpy.mockRestore();
  });

  it('does not emit remove event when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const wrapper = mount(CvBlockActions, {
      props: {
        showRemove: true,
        confirmRemove: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const removeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-trash');
    await removeBtn?.trigger('click');

    expect(confirmSpy).toHaveBeenCalled();
    expect(wrapper.emitted('remove')).toBeFalsy();

    confirmSpy.mockRestore();
  });

  it('emits remove immediately when confirmRemove is false', async () => {
    const wrapper = mount(CvBlockActions, {
      props: {
        showRemove: true,
        confirmRemove: false,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const removeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('icon') === 'i-heroicons-trash');
    await removeBtn?.trigger('click');

    expect(wrapper.emitted('remove')).toBeTruthy();
  });

  it('hides move buttons when showMove is false', () => {
    const wrapper = mount(CvBlockActions, {
      props: { showMove: false },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('aria-label')?.includes('Move'))).toBe(false);
  });

  it('hides edit button when showEdit is false', () => {
    const wrapper = mount(CvBlockActions, {
      props: { showEdit: false },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('aria-label') === 'Edit')).toBe(false);
  });

  it('hides regenerate button when showRegenerate is false', () => {
    const wrapper = mount(CvBlockActions, {
      props: { showRegenerate: false },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('aria-label') === 'Regenerate with AI')).toBe(false);
  });

  it('hides remove button when showRemove is false', () => {
    const wrapper = mount(CvBlockActions, {
      props: { showRemove: false },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.some((b) => b.attributes('aria-label') === 'Remove')).toBe(false);
  });
});
