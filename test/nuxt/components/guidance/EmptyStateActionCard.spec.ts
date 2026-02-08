import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import EmptyStateActionCard from '~/components/guidance/EmptyStateActionCard.vue';
import type { GuidanceEmptyState } from '~/domain/onboarding';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="card" data-testid="guidance-card"><slot /></div>',
  },
  UEmpty: {
    name: 'UEmpty',
    props: ['title', 'description', 'icon'],
    template: `
      <div class="empty-state">
        <div class="icon" :data-icon="icon"></div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
        <div class="actions"><slot name="actions" /></div>
      </div>
    `,
  },
  UButton: {
    name: 'UButton',
    props: ['color', 'icon', 'label', 'to'],
    template: '<button @click="$emit(\'click\')" :data-to="to">{{ label }}</button>',
  },
};

const createMockEmptyState = (overrides: Partial<GuidanceEmptyState> = {}): GuidanceEmptyState => ({
  titleKey: 'guidance.empty.title',
  descriptionKey: 'guidance.empty.description',
  icon: 'i-heroicons-light-bulb',
  cta: {
    labelKey: 'guidance.empty.action',
    to: '/action',
  },
  ...overrides,
});

function mountEmptyStateActionCard(
  emptyState: Partial<GuidanceEmptyState> = {},
  onAction?: () => void
) {
  return mount(EmptyStateActionCard, {
    props: {
      emptyState: createMockEmptyState(emptyState),
      ...(onAction ? { onAction } : {}),
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('EmptyStateActionCard', () => {
  describe('Rendering', () => {
    it('renders UCard wrapper', () => {
      const wrapper = mountEmptyStateActionCard();
      expect(wrapper.findComponent({ name: 'UCard' }).exists()).toBe(true);
    });

    it('has guidance-empty-state data-testid', () => {
      const wrapper = mountEmptyStateActionCard();
      expect(wrapper.find('[data-testid="guidance-empty-state"]').exists()).toBe(true);
    });

    it('renders UEmpty component', () => {
      const wrapper = mountEmptyStateActionCard();
      expect(wrapper.findComponent({ name: 'UEmpty' }).exists()).toBe(true);
    });
  });

  describe('Title and Description', () => {
    it('displays translated title', () => {
      const wrapper = mountEmptyStateActionCard({ titleKey: 'test.title' });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('title')).toBe('test.title');
    });

    it('displays translated description', () => {
      const wrapper = mountEmptyStateActionCard({ descriptionKey: 'test.description' });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('description')).toBe('test.description');
    });

    it('passes title key to UEmpty', () => {
      const wrapper = mountEmptyStateActionCard({ titleKey: 'my.custom.title' });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('title')).toContain('my.custom.title');
    });

    it('passes description key to UEmpty', () => {
      const wrapper = mountEmptyStateActionCard({ descriptionKey: 'my.custom.desc' });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('description')).toContain('my.custom.desc');
    });
  });

  describe('Icon', () => {
    it('uses custom icon when provided', () => {
      const wrapper = mountEmptyStateActionCard({ icon: 'i-heroicons-rocket' });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('icon')).toBe('i-heroicons-rocket');
    });

    it('uses default light bulb icon when not specified', () => {
      const wrapper = mountEmptyStateActionCard({ icon: undefined });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('icon')).toBe('i-heroicons-light-bulb');
    });

    it('can override default icon', () => {
      const wrapper = mountEmptyStateActionCard({ icon: 'i-heroicons-star' });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('icon')).toBe('i-heroicons-star');
    });
  });

  describe('CTA Button with onAction', () => {
    it('renders button when onAction is provided', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(true);
    });

    it('calls onAction when button clicked', async () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });

      await button.trigger('click');

      expect(onAction).toHaveBeenCalled();
    });

    it('button has primary color', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('color')).toBe('primary');
    });

    it('button has plus icon', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('icon')).toBe('i-heroicons-plus');
    });

    it('button displays translated CTA label', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard(
        { cta: { labelKey: 'custom.action', to: '/path' } },
        onAction
      );
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('custom.action');
    });

    it('button does not have to prop when onAction provided', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBeUndefined();
    });
  });

  describe('CTA Button with Link', () => {
    it('renders button when onAction is not provided', () => {
      const wrapper = mountEmptyStateActionCard();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(true);
    });

    it('button has navigation link', () => {
      const wrapper = mountEmptyStateActionCard({ cta: { labelKey: 'test', to: '/target' } });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/target');
    });

    it('button has primary color', () => {
      const wrapper = mountEmptyStateActionCard();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('color')).toBe('primary');
    });

    it('button has plus icon', () => {
      const wrapper = mountEmptyStateActionCard();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('icon')).toBe('i-heroicons-plus');
    });

    it('button displays translated CTA label', () => {
      const wrapper = mountEmptyStateActionCard({
        cta: { labelKey: 'link.action', to: '/somewhere' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('link.action');
    });
  });

  describe('CTA Props', () => {
    it('uses CTA label from emptyState', () => {
      const wrapper = mountEmptyStateActionCard({
        cta: { labelKey: 'my.cta.label', to: '/go' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('my.cta.label');
    });

    it('uses CTA target path from emptyState', () => {
      const wrapper = mountEmptyStateActionCard({ cta: { labelKey: 'label', to: '/custom/path' } });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/custom/path');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long title', () => {
      const longTitle = 'This is an extremely long title that might cause layout issues';
      const wrapper = mountEmptyStateActionCard({ titleKey: longTitle });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('title')).toBe(longTitle);
    });

    it('handles very long description', () => {
      const longDesc =
        'This is a very long description that spans multiple lines and contains a lot of detailed information about what the user should do next';
      const wrapper = mountEmptyStateActionCard({ descriptionKey: longDesc });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('description')).toBe(longDesc);
    });

    it('handles special characters in translations', () => {
      const wrapper = mountEmptyStateActionCard({
        titleKey: 'test.with.special.chars.©®™',
      });
      const empty = wrapper.findComponent({ name: 'UEmpty' });
      expect(empty.props('title')).toContain('test.with.special.chars.©®™');
    });

    it('handles paths with query parameters', () => {
      const wrapper = mountEmptyStateActionCard({
        cta: { labelKey: 'action', to: '/path?param=value&other=123' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/path?param=value&other=123');
    });

    it('handles paths with hash fragments', () => {
      const wrapper = mountEmptyStateActionCard({
        cta: { labelKey: 'action', to: '/path#section' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/path#section');
    });

    it('handles onAction being called multiple times', async () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });

      await button.trigger('click');
      await button.trigger('click');
      await button.trigger('click');

      expect(onAction).toHaveBeenCalled();
      expect(onAction.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Component Structure', () => {
    it('renders UCard as root element', () => {
      const wrapper = mountEmptyStateActionCard();
      const card = wrapper.findComponent({ name: 'UCard' });
      expect(card.exists()).toBe(true);
    });

    it('UEmpty is child of UCard', () => {
      const wrapper = mountEmptyStateActionCard();
      const card = wrapper.findComponent({ name: 'UCard' });
      const empty = card.findComponent({ name: 'UEmpty' });
      expect(empty.exists()).toBe(true);
    });

    it('button is in actions slot', () => {
      const wrapper = mountEmptyStateActionCard();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(true);
    });
  });

  describe('Conditional Rendering', () => {
    it('renders action button variant when onAction provided', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard({}, onAction);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBeUndefined();
    });

    it('renders link button variant when onAction not provided', () => {
      const wrapper = mountEmptyStateActionCard({ cta: { labelKey: 'test', to: '/test' } });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/test');
    });

    it('prioritizes onAction over link when both could be present', () => {
      const onAction = vi.fn();
      const wrapper = mountEmptyStateActionCard(
        { cta: { labelKey: 'test', to: '/test' } },
        onAction
      );
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBeUndefined();

      button.trigger('click');
      expect(onAction).toHaveBeenCalled();
    });
  });
});
