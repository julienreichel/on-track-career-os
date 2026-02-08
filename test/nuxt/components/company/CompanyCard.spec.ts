import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CompanyCard from '~/components/company/CompanyCard.vue';
import type { Company } from '~/domain/company/Company';

const i18n = createTestI18n();

const stubs = {
  ItemCard: {
    name: 'ItemCard',
    props: ['title', 'subtitle'],
    template: `
      <div class="item-card" data-testid="item-card">
        <div class="header">
          <h3>{{ title }}</h3>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <div class="content"><slot /></div>
        <div class="actions"><slot name="actions" /></div>
      </div>
    `,
    emits: ['edit', 'delete'],
  },
  UButton: {
    name: 'UButton',
    props: ['label', 'icon', 'size', 'color', 'variant'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
};

const createMockCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  owner: 'user-1',
  companyName: 'Tech Solutions Inc',
  industry: 'Technology',
  sizeRange: '100-500',
  description: 'A leading technology company specializing in innovative solutions',
  productsServices: ['Cloud Platform', 'AI Tools', 'Mobile Apps'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
  ...overrides,
});

function mountCompanyCard(company: Partial<Company> = {}) {
  return mount(CompanyCard, {
    props: {
      company: createMockCompany(company),
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('CompanyCard', () => {
  describe('Title Display', () => {
    it('displays company name', () => {
      const wrapper = mountCompanyCard({ companyName: 'Acme Corporation' });
      expect(wrapper.text()).toContain('Acme Corporation');
    });

    it('displays fallback when company name is missing', () => {
      const wrapper = mountCompanyCard({ companyName: '' });
      expect(wrapper.text()).toContain('Untitled company');
    });
  });

  describe('Subtitle Display', () => {
    it('displays industry and size range', () => {
      const wrapper = mountCompanyCard({
        industry: 'Finance',
        sizeRange: '50-100',
      });
      expect(wrapper.text()).toContain('Finance • 50-100');
    });

    it('displays only industry when size range missing', () => {
      const wrapper = mountCompanyCard({
        industry: 'Healthcare',
        sizeRange: '',
      });
      expect(wrapper.text()).toContain('Healthcare');
    });

    it('displays only size range when industry missing', () => {
      const wrapper = mountCompanyCard({
        industry: '',
        sizeRange: '1000+',
      });
      expect(wrapper.text()).toContain('1000+');
    });

    it('displays fallback when both industry and size are missing', () => {
      const wrapper = mountCompanyCard({
        industry: '',
        sizeRange: '',
      });
      expect(wrapper.text()).toContain('Industry not specified');
    });
  });

  describe('Description Display', () => {
    it('displays company description when available', () => {
      const wrapper = mountCompanyCard({
        description: 'Leading provider of innovative solutions',
      });
      expect(wrapper.text()).toContain('Leading provider of innovative solutions');
    });

    it('falls back to products/services preview when description is empty', () => {
      const wrapper = mountCompanyCard({
        description: '',
        productsServices: ['Product A', 'Product B', 'Product C', 'Product D'],
      });
      const text = wrapper.text();
      expect(text).toContain('Product A');
      expect(text).toContain('Product B');
      expect(text).toContain('Product C');
      // Only shows first 3 products
      expect(text).not.toContain('Product D');
    });

    it('displays empty description fallback when nothing available', () => {
      const wrapper = mountCompanyCard({
        description: '',
        productsServices: [],
      });
      expect(wrapper.text()).toContain('Add a short description or list of products');
    });

    it('trims whitespace from description', () => {
      const wrapper = mountCompanyCard({
        description: '   ',
        productsServices: [],
      });
      // Should fall back since trimmed description is empty
      expect(wrapper.text()).toContain('Add a short description or list of products');
    });

    it('joins products with commas', () => {
      const wrapper = mountCompanyCard({
        description: '',
        productsServices: ['Service 1', 'Service 2'],
      });
      expect(wrapper.text()).toContain('Service 1, Service 2');
    });
  });

  describe('Last Updated Display', () => {
    it('displays last updated date', () => {
      const wrapper = mountCompanyCard({
        updatedAt: '2024-02-08T12:00:00Z',
      });
      // formatListDate will format this - check it exists
      expect(wrapper.html()).toContain('2024');
    });

    it('falls back to createdAt when updatedAt is missing', () => {
      const wrapper = mountCompanyCard({
        updatedAt: undefined,
        createdAt: '2024-01-01T00:00:00Z',
      });
      expect(wrapper.html()).toContain('2024');
    });

    it('does not display date section when both dates are missing', () => {
      const wrapper = mountCompanyCard({
        updatedAt: undefined,
        createdAt: '',
      });
      // Component should still render
      expect(wrapper.find('[data-testid="company-card"]').exists()).toBe(true);
    });
  });

  describe('Actions', () => {
    it('emits open event when ItemCard emits edit', async () => {
      const wrapper = mountCompanyCard({ id: 'company-456' });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });

      await itemCard.vm.$emit('edit');

      expect(wrapper.emitted('open')).toBeTruthy();
      expect(wrapper.emitted('open')?.[0]).toEqual(['company-456']);
    });

    it('emits delete event with company id when ItemCard emits delete', async () => {
      const wrapper = mountCompanyCard({ id: 'company-789' });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });

      await itemCard.vm.$emit('delete');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual(['company-789']);
    });

    it('renders view button with correct props', () => {
      const wrapper = mountCompanyCard();
      const button = wrapper.findComponent({ name: 'UButton' });

      expect(button.props('label')).toBe('View');
      expect(button.props('icon')).toBe('i-heroicons-eye');
      expect(button.props('size')).toBe('xs');
      expect(button.props('color')).toBe('primary');
      expect(button.props('variant')).toBe('outline');
    });
  });

  describe('Data Testid', () => {
    it('has company-card data-testid', () => {
      const wrapper = mountCompanyCard();
      expect(wrapper.find('[data-testid="company-card"]').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles company with all empty fields', () => {
      const wrapper = mountCompanyCard({
        companyName: '',
        industry: '',
        sizeRange: '',
        description: '',
        productsServices: [],
      });
      expect(wrapper.find('[data-testid="company-card"]').exists()).toBe(true);
    });

    it('handles long descriptions', () => {
      const longDescription = 'a'.repeat(500);
      const wrapper = mountCompanyCard({ description: longDescription });
      expect(wrapper.text()).toContain('a'.repeat(100));
    });

    it('handles special characters in company name', () => {
      const wrapper = mountCompanyCard({ companyName: '<Company & "Solutions">' });
      expect(wrapper.html()).not.toContain('<Company');
      expect(wrapper.text()).toContain('<Company & "Solutions">');
    });

    it('handles empty products array gracefully', () => {
      const wrapper = mountCompanyCard({
        description: '',
        productsServices: [],
      });
      expect(wrapper.find('[data-testid="company-card"]').exists()).toBe(true);
    });

    it('handles single product in array', () => {
      const wrapper = mountCompanyCard({
        description: '',
        productsServices: ['Single Product'],
      });
      expect(wrapper.text()).toContain('Single Product');
    });
  });

  describe('Props Passing', () => {
    it('passes title to ItemCard', () => {
      const wrapper = mountCompanyCard({ companyName: 'Test Company' });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });
      expect(itemCard.props('title')).toBe('Test Company');
    });

    it('passes subtitle to ItemCard', () => {
      const wrapper = mountCompanyCard({
        industry: 'Tech',
        sizeRange: '50-100',
      });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });
      expect(itemCard.props('subtitle')).toBe('Tech • 50-100');
    });
  });
});
