import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import DeleteAccountCard from '@/components/settings/DeleteAccountCard.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot /></div>',
  },
  UButton: {
    name: 'UButton',
    props: ['label', 'loading'],
    template: '<button class="u-button" :data-loading="loading" @click="$emit(\'click\')">{{ label }}</button>',
  },
  ConfirmModal: {
    name: 'ConfirmModal',
    props: ['open', 'title', 'description', 'confirmLabel', 'cancelLabel', 'loading'],
    template: `
      <div class="confirm-modal" :data-open="open" :data-loading="loading">
        <button class="confirm-action" @click="$emit('confirm')">confirm</button>
      </div>
    `,
    emits: ['confirm', 'update:open'],
  },
};

function mountDeleteAccountCard(props: Record<string, unknown> = {}) {
  return mount(DeleteAccountCard, {
    props,
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('DeleteAccountCard', () => {
  it('renders delete account content', () => {
    const wrapper = mountDeleteAccountCard();

    expect(wrapper.text()).toContain('Delete account');
    expect(wrapper.text()).toContain('Delete my account');
    expect(wrapper.text()).toContain('Permanently delete your account and all associated data.');
  });

  it('opens confirmation modal when delete button is clicked', async () => {
    const wrapper = mountDeleteAccountCard();

    expect(wrapper.find('.confirm-modal').attributes('data-open')).toBe('false');
    await wrapper.find('.u-button').trigger('click');
    expect(wrapper.find('.confirm-modal').attributes('data-open')).toBe('true');
  });

  it('emits confirm when confirmation modal confirms', async () => {
    const wrapper = mountDeleteAccountCard();

    await wrapper.find('.confirm-action').trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('confirm')?.length).toBe(1);
  });

  it('passes loading state to button and modal', () => {
    const wrapper = mountDeleteAccountCard({ loading: true });

    expect(wrapper.find('.u-button').attributes('data-loading')).toBe('true');
    expect(wrapper.find('.confirm-modal').attributes('data-loading')).toBe('true');
  });
});
