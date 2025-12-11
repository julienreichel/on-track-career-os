import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import UnsavedChangesModal from '../../../src/components/UnsavedChangesModal.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      storyEditor: {
        unsavedChanges: 'You have unsaved changes',
        unsavedChangesDescription: 'Are you sure you want to discard your changes?',
      },
      common: {
        goBack: 'Go back',
        discard: 'Discard',
      },
    },
  },
});

const stubs = {
  UModal: {
    template: `
      <div v-if="open" class="modal">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-description">{{ description }}</div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['open', 'title', 'description'],
    emits: ['update:open'],
    setup(props, { emit }) {
      const handleUpdate = (value: boolean) => {
        emit('update:open', value);
      };
      return { handleUpdate };
    },
  },
  UButton: {
    template:
      '<button :class="[color, variant]" @click="$attrs.onClick">{{ label }}<slot /></button>',
    props: ['label', 'color', 'variant'],
  },
};

describe('UnsavedChangesModal', () => {
  it('renders when open is true', () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(true);
  });

  it('does not render when open is false', () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: false,
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('displays correct title and description', () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    expect(wrapper.find('.modal-title').text()).toBe('You have unsaved changes');
    expect(wrapper.find('.modal-description').text()).toBe(
      'Are you sure you want to discard your changes?'
    );
  });

  it('renders two footer buttons', () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
  });

  it('renders Go back button with ghost variant', () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toContain('Go back');
  });

  it('renders Go back button with ghost variant', () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toContain('Go back');
    expect(buttons[0].classes()).toContain('ghost');
  });

  it('emits update:open with false when Go back is clicked', async () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');

    expect(wrapper.emitted('update:open')).toBeTruthy();
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('emits discard when Discard button is clicked', async () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('discard')).toBeTruthy();
  });

  it('updates isOpen computed when open prop changes', async () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: false,
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(false);

    await wrapper.setProps({ open: true });
    expect(wrapper.find('.modal').exists()).toBe(true);
  });

  it('emits update:open when isOpen computed setter is called', async () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    // Access the computed property and set it
    (wrapper.vm as any).isOpen = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:open')).toBeTruthy();
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('does not emit discard when Go back is clicked', async () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');

    expect(wrapper.emitted('discard')).toBeFalsy();
  });

  it('handles rapid button clicks', async () => {
    const wrapper = mount(UnsavedChangesModal, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        open: true,
      },
    });

    const discardButton = wrapper.findAll('button')[1];
    await discardButton.trigger('click');
    await discardButton.trigger('click');
    await discardButton.trigger('click');

    expect(wrapper.emitted('discard')).toHaveLength(3);
  });
});
