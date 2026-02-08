import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import LinkedCompanyBadge from '~/components/company/LinkedCompanyBadge.vue';
import type { Company } from '~/domain/company/Company';

const i18n = createTestI18n();

const stubs = {
  UBadge: {
    name: 'UBadge',
    props: ['color', 'variant'],
    template: '<span class="badge"><slot /></span>',
  },
  UButton: {
    name: 'UButton',
    props: ['size', 'color', 'variant', 'icon', 'label', 'to'],
    template: '<button><slot>{{ label }}</slot></button>',
  },
};

const createMockCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  owner: 'user-1',
  companyName: 'Acme Corporation',
  industry: 'Technology',
  sizeRange: '100-500',
  description: 'Tech company',
  productsServices: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-02-01',
  ...overrides,
});

function mountLinkedCompanyBadge(company: Company | null = null) {
  return mount(LinkedCompanyBadge, {
    props: {
      company,
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('LinkedCompanyBadge', () => {
  describe('With Company', () => {
    it('displays company name badge', () => {
      const company = createMockCompany({ companyName: 'Tech Solutions' });
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.text()).toContain('Tech Solutions');
    });

    it('renders UBadge with neutral color', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.props('color')).toBe('neutral');
    });

    it('renders UBadge with outline variant', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.props('variant')).toBe('outline');
    });

    it('displays view company button', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.text()).toContain('View company');
    });

    it('button has correct size', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('size')).toBe('xs');
    });

    it('button has primary color', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('color')).toBe('primary');
    });

    it('button has ghost variant', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('variant')).toBe('ghost');
    });

    it('button has external link icon', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('icon')).toBe('i-heroicons-arrow-top-right-on-square');
    });

    it('button links to company detail page', () => {
      const company = createMockCompany({ id: 'comp-123' });
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/companies/comp-123');
    });

    it('uses flex layout with gap', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).toContain('flex');
      expect(wrapper.html()).toContain('gap');
    });

    it('is responsive with sm: breakpoint', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).toContain('sm:flex-row');
      expect(wrapper.html()).toContain('sm:items-center');
    });
  });

  describe('Without Company', () => {
    it('displays "no company" message when company is null', () => {
      const wrapper = mountLinkedCompanyBadge(null);
      expect(wrapper.text()).toContain('No company linked');
    });

    it('does not render badge when no company', () => {
      const wrapper = mountLinkedCompanyBadge(null);
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.exists()).toBe(false);
    });

    it('does not render button when no company', () => {
      const wrapper = mountLinkedCompanyBadge(null);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.exists()).toBe(false);
    });

    it('message has gray text color', () => {
      const wrapper = mountLinkedCompanyBadge(null);
      expect(wrapper.html()).toContain('text-gray-500');
      expect(wrapper.html()).toContain('dark:text-gray-400');
    });

    it('message has small text size', () => {
      const wrapper = mountLinkedCompanyBadge(null);
      expect(wrapper.html()).toContain('text-sm');
    });
  });

  describe('Company Name Fallback', () => {
    it('displays fallback when company name is empty', () => {
      const company = createMockCompany({ companyName: '' });
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.text()).toContain('Untitled company');
    });

    it('displays fallback when company name is null', () => {
      const company = createMockCompany({ companyName: null as any });
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.text()).toContain('Untitled company');
    });

    it('button still links when company name is empty', () => {
      const company = createMockCompany({ id: 'comp-456', companyName: '' });
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/companies/comp-456');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined company', () => {
      const wrapper = mountLinkedCompanyBadge(undefined as any);
      expect(wrapper.text()).toContain('No company linked');
    });

    it('handles company with special characters in name', () => {
      const company = createMockCompany({ companyName: '<Company & "Solutions">' });
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).not.toContain('<Company');
      expect(wrapper.text()).toContain('<Company & "Solutions">');
    });

    it('handles very long company name', () => {
      const longName = 'A'.repeat(200);
      const company = createMockCompany({ companyName: longName });
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.text()).toContain(longName);
    });

    it('handles company id with special characters', () => {
      const company = createMockCompany({ id: 'comp-123-abc' });
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('to')).toBe('/companies/comp-123-abc');
    });

    it('does not break with empty company object', () => {
      const company = { id: '', companyName: '' } as any;
      const wrapper = mountLinkedCompanyBadge(company);
      // Should render badge even with empty values
      expect(wrapper.findComponent({ name: 'UBadge' }).exists()).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('hasCompany is true when company provided', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.findComponent({ name: 'UBadge' }).exists()).toBe(true);
    });

    it('hasCompany is false when company is null', () => {
      const wrapper = mountLinkedCompanyBadge(null);
      expect(wrapper.findComponent({ name: 'UBadge' }).exists()).toBe(false);
    });

    it('generates correct link for different company ids', () => {
      const companies = ['id-1', 'id-2', 'id-3'];

      companies.forEach((id) => {
        const company = createMockCompany({ id });
        const wrapper = mountLinkedCompanyBadge(company);
        const button = wrapper.findComponent({ name: 'UButton' });
        expect(button.props('to')).toBe(`/companies/${id}`);
      });
    });
  });

  describe('Layout and Styling', () => {
    it('uses flex-col on mobile', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).toContain('flex-col');
    });

    it('uses items-start on mobile', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).toContain('items-start');
    });

    it('has gap-2 spacing', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).toContain('gap-2');
    });

    it('has sm:gap-3 spacing on larger screens', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      expect(wrapper.html()).toContain('sm:gap-3');
    });
  });

  describe('Accessibility', () => {
    it('button has descriptive label', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('label')).toBe('View company');
    });

    it('icon suggests external navigation', () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);
      const button = wrapper.findComponent({ name: 'UButton' });
      expect(button.props('icon')).toContain('arrow-top-right');
    });
  });

  describe('Props Changes', () => {
    it('updates display when company prop changes', async () => {
      const company1 = createMockCompany({ companyName: 'Company One' });
      const wrapper = mountLinkedCompanyBadge(company1);

      expect(wrapper.text()).toContain('Company One');

      const company2 = createMockCompany({ companyName: 'Company Two' });
      await wrapper.setProps({ company: company2 });

      expect(wrapper.text()).toContain('Company Two');
      expect(wrapper.text()).not.toContain('Company One');
    });

    it('toggles between company and no company states', async () => {
      const company = createMockCompany();
      const wrapper = mountLinkedCompanyBadge(company);

      expect(wrapper.findComponent({ name: 'UBadge' }).exists()).toBe(true);

      await wrapper.setProps({ company: null });

      expect(wrapper.findComponent({ name: 'UBadge' }).exists()).toBe(false);
      expect(wrapper.text()).toContain('No company linked');
    });
  });
});
