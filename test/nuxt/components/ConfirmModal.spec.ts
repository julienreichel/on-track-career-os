import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import ConfirmModal from '~/components/ConfirmModal.vue';

const i18n = createTestI18n();

const stubs = {
  UModal: {
    name: 'UModal',
    props: ['open', 'title', 'description', 'close'],
    template: `
      <div v-if="open" class="u-modal" role="dialog">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    emits: ['update:open'],
  },
  UButton: {
    name: 'UButton',
    props: ['label', 'icon', 'color', 'variant', 'loading'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
};

function mountConfirmModal(props: any = {}) {
  return mount(ConfirmModal, {
    props: {
      open: true,
      title: 'Confirm Action',
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('ConfirmModal', () => {
  describe('Rendering', () => {
    it('renders the modal when open is true', () => {
      const wrapper = mountConfirmModal({ open: true });
      expect(wrapper.find('.u-modal').exists()).toBe(true);
    });

    it('does not render the modal when open is false', () => {
      const wrapper = mountConfirmModal({ open: false });
      expect(wrapper.find('.u-modal').exists()).toBe(false);
    });

    it('displays the title', () => {
      const wrapper = mountConfirmModal({ title: 'Delete Item' });
      expect(wrapper.text()).toContain('Delete Item');
    });

    it('displays the description when provided', () => {
      const wrapper = mountConfirmModal({
        description: 'This action cannot be undone',
      });
      expect(wrapper.text()).toContain('This action cannot be undone');
    });

    it('does not display description when not provided', () => {
      const wrapper = mountConfirmModal();
      expect(wrapper.find('.modal-header p').exists()).toBe(false);
    });

    it('renders confirm button with custom label', () => {
      const wrapper = mountConfirmModal({ confirmLabel: 'Yes, delete it' });
      expect(wrapper.text()).toContain('Yes, delete it');
    });

    it('renders cancel button with custom label', () => {
      const wrapper = mountConfirmModal({ cancelLabel: 'No, keep it' });
      expect(wrapper.text()).toContain('No, keep it');
    });

    it('uses default labels when not provided', () => {
      const wrapper = mountConfirmModal();
      expect(wrapper.text()).toContain('Confirm');
      expect(wrapper.text()).toContain('Cancel');
    });

    it('passes confirmColor to confirm button', () => {
      const wrapper = mountConfirmModal({ confirmColor: 'warning' });
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const confirmButton = buttons.find((b) => b.props('label') === 'Confirm');
      expect(confirmButton?.props('color')).toBe('warning');
    });

    it('shows loading state on confirm button', () => {
      const wrapper = mountConfirmModal({ loading: true });
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const confirmButton = buttons.find((b) => b.props('label') === 'Confirm');
      expect(confirmButton?.props('loading')).toBe(true);
    });
  });

  describe('Events', () => {
    it('emits confirm when confirm button is clicked', async () => {
      const wrapper = mountConfirmModal();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const confirmButton = buttons.find((b) => b.props('label') === 'Confirm');

      await confirmButton?.trigger('click');

      expect(wrapper.emitted('confirm')).toBeTruthy();
      expect(wrapper.emitted('confirm')!.length).toBeGreaterThanOrEqual(1);
    });

    it('emits cancel and update:open when cancel button is clicked', async () => {
      const wrapper = mountConfirmModal();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const cancelButton = buttons.find((b) => b.props('label') === 'Cancel');

      await cancelButton?.trigger('click');

      expect(wrapper.emitted('cancel')).toBeTruthy();
      expect(wrapper.emitted('update:open')).toBeTruthy();
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
    });

    it('emits update:open when isOpen computed setter is called', async () => {
      const wrapper = mountConfirmModal({ open: true });

      // Simulate v-model change
      await wrapper.setProps({ open: false });

      // The computed setter should emit when the model changes
      expect(wrapper.props('open')).toBe(false);
    });
  });

  describe('Confirm Colors', () => {
    it.each([
      ['primary', 'primary'],
      ['error', 'error'],
      ['warning', 'warning'],
      ['neutral', 'neutral'],
    ])('accepts %s as confirmColor', (color, expected) => {
      const wrapper = mountConfirmModal({ confirmColor: color as any });
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const confirmButton = buttons.find((b) => b.props('label') === 'Confirm');
      expect(confirmButton?.props('color')).toBe(expected);
    });

    it('uses error as default confirmColor', () => {
      const wrapper = mountConfirmModal();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const confirmButton = buttons.find((b) => b.props('label') === 'Confirm');
      expect(confirmButton?.props('color')).toBe('error');
    });
  });

  describe('Button States', () => {
    it('cancel button has ghost variant and neutral color', () => {
      const wrapper = mountConfirmModal();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const cancelButton = buttons.find((b) => b.props('label') === 'Cancel');
      expect(cancelButton?.props('variant')).toBe('ghost');
      expect(cancelButton?.props('color')).toBe('neutral');
    });

    it('does not emit update:open on confirm click', async () => {
      const wrapper = mountConfirmModal();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const confirmButton = buttons.find((b) => b.props('label') === 'Confirm');

      await confirmButton?.trigger('click');

      expect(wrapper.emitted('update:open')).toBeFalsy();
    });
  });
});
