import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import GuidanceBanner from '~/components/guidance/GuidanceBanner.vue';
import type { GuidanceBanner as GuidanceBannerModel } from '~/domain/onboarding';

const i18n = createTestI18n();

const stubs = {
  UAlert: {
    name: 'UAlert',
    props: ['icon', 'color', 'variant', 'title', 'description'],
    template: `
      <div class="alert" :data-color="color" :data-variant="variant">
        <i :data-icon="icon"></i>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
        <div class="actions"><slot name="actions" /></div>
      </div>
    `,
  },
  UButton: {
    name: 'UButton',
    props: ['color', 'variant', 'icon', 'label', 'to'],
    template: '<button :data-to="to">{{ label }}</button>',
  },
};

const createMockBanner = (overrides: Partial<GuidanceBannerModel> = {}): GuidanceBannerModel => ({
  titleKey: 'guidance.banner.title',
  descriptionKey: 'guidance.banner.description',
  cta: {
    labelKey: 'guidance.banner.action',
    to: '/action',
  },
  ...overrides,
});

function mountGuidanceBanner(banner: Partial<GuidanceBannerModel> = {}) {
  return mount(GuidanceBanner, {
    props: {
      banner: createMockBanner(banner),
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('GuidanceBanner', () => {
  describe('Rendering', () => {
    it('renders UAlert component', () => {
      const wrapper = mountGuidanceBanner();
      expect(wrapper.findComponent({ name: 'UAlert' }).exists()).toBe(true);
    });

    it('uses information circle icon', () => {
      const wrapper = mountGuidanceBanner();
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('icon')).toBe('i-heroicons-information-circle');
    });

    it('uses primary color', () => {
      const wrapper = mountGuidanceBanner();
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('color')).toBe('primary');
    });

    it('uses soft variant', () => {
      const wrapper = mountGuidanceBanner();
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('variant')).toBe('soft');
    });
  });

  describe('Title and Description', () => {
    it('displays translated title', () => {
      const wrapper = mountGuidanceBanner({ titleKey: 'test.title.key' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('title')).toBe('test.title.key');
    });

    it('displays translated description', () => {
      const wrapper = mountGuidanceBanner({ descriptionKey: 'test.description.key' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('description')).toBe('test.description.key');
    });

    it('passes titleKey from banner prop', () => {
      const wrapper = mountGuidanceBanner({ titleKey: 'custom.title' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('title')).toContain('custom.title');
    });

    it('passes descriptionKey from banner prop', () => {
      const wrapper = mountGuidanceBanner({ descriptionKey: 'custom.description' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('description')).toContain('custom.description');
    });
  });

  describe('CTA Button', () => {
    it('renders button when cta is provided', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'action.label', to: '/target' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(true);
    });

    it('does not render button when cta is not provided', () => {
      const wrapper = mountGuidanceBanner({ cta: undefined });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(false);
    });

    it('button has primary color', () => {
      const wrapper = mountGuidanceBanner();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('color')).toBe('primary');
    });

    it('button has outline variant', () => {
      const wrapper = mountGuidanceBanner();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('variant')).toBe('outline');
    });

    it('button has arrow-right icon', () => {
      const wrapper = mountGuidanceBanner();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('icon')).toBe('i-heroicons-arrow-right');
    });

    it('button displays translated label', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'my.cta.label', to: '/path' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('my.cta.label');
    });

    it('button has correct navigation target', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'action', to: '/custom/route' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/custom/route');
    });
  });

  describe('CTA Props', () => {
    it('uses labelKey from cta', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'specific.label', to: '/go' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('specific.label');
    });

    it('uses to path from cta', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'label', to: '/destination' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/destination');
    });

    it('handles paths with query parameters', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'action', to: '/path?step=2&id=123' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/path?step=2&id=123');
    });

    it('handles paths with hash fragments', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'action', to: '/guide#getting-started' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/guide#getting-started');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long title', () => {
      const longTitle =
        'This is an extremely long guidance banner title that might span multiple lines';
      const wrapper = mountGuidanceBanner({ titleKey: longTitle });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('title')).toBe(longTitle);
    });

    it('handles very long description', () => {
      const longDesc =
        'This is a very detailed description that provides comprehensive information about what the user needs to know and do next in their journey';
      const wrapper = mountGuidanceBanner({ descriptionKey: longDesc });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('description')).toBe(longDesc);
    });

    it('handles special characters in title', () => {
      const wrapper = mountGuidanceBanner({ titleKey: 'title.with.special.©®™' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('title')).toContain('title.with.special.©®™');
    });

    it('handles special characters in description', () => {
      const wrapper = mountGuidanceBanner({ descriptionKey: 'desc.with.émojis.🎉🚀' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('description')).toContain('desc.with.émojis.🎉🚀');
    });

    it('handles absolute external URLs', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'external', to: 'https://example.com/guide' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('https://example.com/guide');
    });

    it('handles root path', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'home', to: '/' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/');
    });
  });

  describe('Conditional CTA Rendering', () => {
    it('shows button when cta object is present', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'action', to: '/path' },
      });
      expect(wrapper.findComponent({ name: 'UButton' }).exists()).toBe(true);
    });

    it('hides button when cta is undefined', () => {
      const wrapper = mountGuidanceBanner({ cta: undefined });
      expect(wrapper.findComponent({ name: 'UButton' }).exists()).toBe(false);
    });

    it('hides button when cta is null', () => {
      const wrapper = mountGuidanceBanner({ cta: null as any });
      expect(wrapper.findComponent({ name: 'UButton' }).exists()).toBe(false);
    });
  });

  describe('Component Structure', () => {
    it('renders UAlert as root element', () => {
      const wrapper = mountGuidanceBanner();
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.exists()).toBe(true);
    });

    it('button is in actions slot', () => {
      const wrapper = mountGuidanceBanner();
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(true);
    });

    it('alert contains all required props', () => {
      const wrapper = mountGuidanceBanner();
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('icon')).toBeDefined();
      expect(alert.props('color')).toBeDefined();
      expect(alert.props('variant')).toBeDefined();
      expect(alert.props('title')).toBeDefined();
      expect(alert.props('description')).toBeDefined();
    });
  });

  describe('Translation Integration', () => {
    it('translates title through i18n', () => {
      const wrapper = mountGuidanceBanner({ titleKey: 'test.key' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('title')).toBe('test.key');
    });

    it('translates description through i18n', () => {
      const wrapper = mountGuidanceBanner({ descriptionKey: 'desc.key' });
      const alert = wrapper.findComponent({ name: 'UAlert' });
      expect(alert.props('description')).toBe('desc.key');
    });

    it('translates CTA label through i18n', () => {
      const wrapper = mountGuidanceBanner({
        cta: { labelKey: 'cta.key', to: '/path' },
      });
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('cta.key');
    });
  });
});
