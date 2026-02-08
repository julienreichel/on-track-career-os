import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import JobApplicationStatusRow from '~/components/dashboard/JobApplicationStatusRow.vue';
import type { JobApplicationState } from '~/composables/useActiveJobsDashboard';

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
        <div class="badges"><slot name="badges" /></div>
        <div class="content"><slot /></div>
        <div class="actions"><slot name="actions" /></div>
      </div>
    `,
  },
  UBadge: {
    name: 'UBadge',
    props: ['color', 'variant', 'size'],
    template: '<span class="badge" :data-color="color" :data-variant="variant">(<slot /></span>',
  },
  UIcon: {
    name: 'UIcon',
    props: ['name', 'class'],
    template: '<i :class="$props.class" :data-icon="name"></i>',
  },
  UButton: {
    name: 'UButton',
    props: ['size', 'color', 'variant', 'label', 'to'],
    template: '<button :data-to="to">{{ label }}</button>',
  },
};

const createMockState = (overrides: Partial<JobApplicationState> = {}): JobApplicationState => ({
  jobId: 'job-123',
  title: 'Senior Software Engineer',
  companyName: 'Tech Corp',
  matchStatus: 'ready',
  matchLabelKey: 'dashboard.activeJobs.match.ready',
  matchLabelParams: {},
  materials: {
    cv: true,
    coverLetter: false,
    speech: true,
  },
  cta: {
    labelKey: 'dashboard.activeJobs.cta.apply',
    to: '/applications/new?jobId=job-123',
  },
  ...overrides,
});

function mountJobApplicationStatusRow(state: Partial<JobApplicationState> = {}) {
  return mount(JobApplicationStatusRow, {
    props: {
      state: createMockState(state),
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('JobApplicationStatusRow', () => {
  describe('Job Title and Company', () => {
    it('renders job title', () => {
      const wrapper = mountJobApplicationStatusRow({ title: 'Full Stack Developer' });
      expect(wrapper.text()).toContain('Full Stack Developer');
    });

    it('displays company name', () => {
      const wrapper = mountJobApplicationStatusRow({ companyName: 'Acme Inc' });
      expect(wrapper.text()).toContain('Acme Inc');
    });

    it('displays dash when company name is missing', () => {
      const wrapper = mountJobApplicationStatusRow({ companyName: '' });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });
      expect(itemCard.props('subtitle')).toBe('-');
    });

    it('displays dash when company name is null', () => {
      const wrapper = mountJobApplicationStatusRow({ companyName: null as any });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });
      expect(itemCard.props('subtitle')).toBe('-');
    });
  });

  describe('Match Badge', () => {
    it('renders match badge with ready status', () => {
      const wrapper = mountJobApplicationStatusRow({
        matchStatus: 'ready',
        matchLabelKey: 'dashboard.match.good',
      });
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.exists()).toBe(true);
      expect(badge.props('color')).toBe('secondary');
    });

    it('renders match badge with warning status', () => {
      const wrapper = mountJobApplicationStatusRow({
        matchStatus: 'incomplete',
        matchLabelKey: 'dashboard.match.needsWork',
      });
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.props('color')).toBe('warning');
    });

    it('uses outline variant for badge', () => {
      const wrapper = mountJobApplicationStatusRow();
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.props('variant')).toBe('outline');
    });

    it('uses xs size for badge', () => {
      const wrapper = mountJobApplicationStatusRow();
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.props('size')).toBe('xs');
    });

    it('displays translated match label', () => {
      const wrapper = mountJobApplicationStatusRow({
        matchLabelKey: 'test.label',
      });
      const badge = wrapper.findComponent({ name: 'UBadge' });
      expect(badge.text()).toContain('test.label');
    });

    it('passes match label params to translation', () => {
      const wrapper = mountJobApplicationStatusRow({
        matchLabelKey: 'test.key',
        matchLabelParams: { count: 3 },
      });
      expect(wrapper.html()).toContain('test.key');
    });
  });

  describe('Materials List', () => {
    it('displays CV material status', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: true, coverLetter: false, speech: false },
      });
      expect(wrapper.text()).toContain('CV');
    });

    it('displays cover letter material status', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: false, coverLetter: true, speech: false },
      });
      expect(wrapper.text()).toContain('Cover letter');
    });

    it('displays speech material status', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: false, coverLetter: false, speech: true },
      });
      expect(wrapper.text()).toContain('Speech');
    });

    it('shows check icon for ready materials', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: true, coverLetter: false, speech: false },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const checkIcon = icons.find((icon) => icon.props('name') === 'i-heroicons-check-circle');
      expect(checkIcon).toBeTruthy();
    });

    it('shows x icon for incomplete materials', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: false, coverLetter: false, speech: false },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const xIcons = icons.filter((icon) => icon.props('name') === 'i-heroicons-x-circle');
      expect(xIcons.length).toBe(3);
    });

    it('applies success color to ready materials', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: true, coverLetter: false, speech: false },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const successIcon = icons.find((icon) => icon.props('class')?.includes('text-success'));
      expect(successIcon).toBeTruthy();
    });

    it('applies warning color to incomplete materials', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: false, coverLetter: true, speech: false },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const warningIcons = icons.filter((icon) => icon.props('class')?.includes('text-warning'));
      expect(warningIcons.length).toBe(2);
    });

    it('renders all three materials', () => {
      const wrapper = mountJobApplicationStatusRow();
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      expect(icons.length).toBe(3);
    });
  });

  describe('Action Buttons', () => {
    it('renders primary CTA button', () => {
      const wrapper = mountJobApplicationStatusRow({
        cta: { labelKey: 'action.apply', to: '/apply' },
      });
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const ctaButton = buttons[0];
      expect(ctaButton.props('label')).toBe('action.apply');
      expect(ctaButton.props('to')).toBe('/apply');
    });

    it('renders view job button', () => {
      const wrapper = mountJobApplicationStatusRow({ jobId: 'job-456' });
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const viewButton = buttons[1];
      expect(viewButton.props('label')).toContain('View job');
      expect(viewButton.props('to')).toBe('/jobs/job-456');
    });

    it('CTA button has primary color', () => {
      const wrapper = mountJobApplicationStatusRow();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      expect(buttons[0].props('color')).toBe('primary');
    });

    it('view job button has neutral color', () => {
      const wrapper = mountJobApplicationStatusRow();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      expect(buttons[1].props('color')).toBe('neutral');
    });

    it('both buttons have outline variant', () => {
      const wrapper = mountJobApplicationStatusRow();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      expect(buttons[0].props('variant')).toBe('outline');
      expect(buttons[1].props('variant')).toBe('outline');
    });

    it('both buttons have xs size', () => {
      const wrapper = mountJobApplicationStatusRow();
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      expect(buttons[0].props('size')).toBe('xs');
      expect(buttons[1].props('size')).toBe('xs');
    });
  });

  describe('Data Testid', () => {
    it('has active-job-row data-testid', () => {
      const wrapper = mountJobApplicationStatusRow();
      const itemCard = wrapper.find('[data-testid="active-job-row"]');
      expect(itemCard.exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles all materials ready', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: true, coverLetter: true, speech: true },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const checkIcons = icons.filter((icon) => icon.props('name') === 'i-heroicons-check-circle');
      expect(checkIcons.length).toBe(3);
    });

    it('handles all materials incomplete', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: false, coverLetter: false, speech: false },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const xIcons = icons.filter((icon) => icon.props('name') === 'i-heroicons-x-circle');
      expect(xIcons.length).toBe(3);
    });

    it('handles mixed material statuses', () => {
      const wrapper = mountJobApplicationStatusRow({
        materials: { cv: true, coverLetter: false, speech: true },
      });
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      const checkIcons = icons.filter((icon) => icon.props('name') === 'i-heroicons-check-circle');
      const xIcons = icons.filter((icon) => icon.props('name') === 'i-heroicons-x-circle');
      expect(checkIcons.length).toBe(2);
      expect(xIcons.length).toBe(1);
    });

    it('handles very long job title', () => {
      const longTitle = 'Senior Principal Distinguished Software Engineering Architect Lead';
      const wrapper = mountJobApplicationStatusRow({ title: longTitle });
      expect(wrapper.text()).toContain(longTitle);
    });

    it('handles special characters in company name', () => {
      const wrapper = mountJobApplicationStatusRow({ companyName: 'AT&T © Inc.' });
      expect(wrapper.text()).toContain('AT&T © Inc.');
    });

    it('generates correct job link for different job IDs', () => {
      const wrapper = mountJobApplicationStatusRow({ jobId: 'job-abc-123' });
      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      expect(buttons[1].props('to')).toBe('/jobs/job-abc-123');
    });

    it('handles empty match label params', () => {
      const wrapper = mountJobApplicationStatusRow({
        matchLabelKey: 'test.key',
        matchLabelParams: {},
      });
      expect(wrapper.html()).toContain('test.key');
    });

    it('handles undefined match label params', () => {
      const wrapper = mountJobApplicationStatusRow({
        matchLabelKey: 'test.key',
        matchLabelParams: undefined,
      });
      expect(wrapper.html()).toContain('test.key');
    });
  });

  describe('Component Structure', () => {
    it('renders within ItemCard', () => {
      const wrapper = mountJobApplicationStatusRow();
      expect(wrapper.findComponent({ name: 'ItemCard' }).exists()).toBe(true);
    });

    it('passes title to ItemCard', () => {
      const wrapper = mountJobApplicationStatusRow({ title: 'DevOps Engineer' });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });
      expect(itemCard.props('title')).toBe('DevOps Engineer');
    });

    it('passes subtitle to ItemCard', () => {
      const wrapper = mountJobApplicationStatusRow({ companyName: 'StartupXYZ' });
      const itemCard = wrapper.findComponent({ name: 'ItemCard' });
      expect(itemCard.props('subtitle')).toBe('StartupXYZ');
    });

    it('renders materials in content area', () => {
      const wrapper = mountJobApplicationStatusRow();
      const icons = wrapper.findAllComponents({ name: 'UIcon' });
      expect(icons.length).toBeGreaterThan(0);
    });

    it('has proper spacing classes', () => {
      const wrapper = mountJobApplicationStatusRow();
      expect(wrapper.html()).toContain('space-y-2');
    });
  });
});
