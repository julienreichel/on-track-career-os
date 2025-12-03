import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ExperienceList from '~/components/ExperienceList.vue';
import type { Experience } from '~/domain/experience/Experience';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      experiences: {
        present: 'Present',
        list: {
          title: 'Your Experiences',
          addNew: 'Add Experience',
          edit: 'Edit',
          delete: 'Delete',
          empty: 'No experiences yet. Upload a CV or add one manually.',
        },
        table: {
          title: 'Title',
          company: 'Company',
          startDate: 'Start Date',
          endDate: 'End Date',
          status: 'Status',
          actions: 'Actions',
        },
        status: {
          draft: 'Draft',
          complete: 'Complete',
        },
      },
    },
  },
});

// Stub Nuxt UI components
const stubs = {
  UCard: {
    name: 'UCard',
    template: '<div class="u-card"><slot name="header" /><slot /></div>',
  },
  UButton: {
    name: 'UButton',
    template:
      '<button class="u-button" @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
    props: ['label', 'icon', 'size', 'color', 'variant', 'ariaLabel'],
  },
  UTable: {
    name: 'UTable',
    template: `
      <div class="u-table">
        <div v-if="rows.length === 0"><slot name="empty-state" /></div>
        <table v-else>
          <thead>
            <tr><th v-for="col in columns" :key="col.key">{{ col.label }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="col in columns" :key="col.key">
                <slot :name="col.key + '-data'" :row="row">{{ row[col.key] }}</slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    props: ['columns', 'rows', 'loading'],
  },
  UBadge: {
    name: 'UBadge',
    template: '<span class="u-badge" :class="color"><slot>{{ label }}</slot></span>',
    props: ['color', 'label', 'size'],
  },
  UIcon: {
    name: 'UIcon',
    template: '<span class="u-icon" />',
    props: ['name'],
  },
};

const mockExperiences: Experience[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    responsibilities: ['Lead development', 'Mentor team'],
    tasks: ['Build features', 'Code reviews'],
    status: 'complete',
    userId: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    owner: 'user-1',
    rawText: '',
  },
  {
    id: '2',
    title: 'Software Engineer',
    companyName: 'StartupCo',
    startDate: '2018-06-01',
    endDate: '',
    responsibilities: ['Write code'],
    tasks: ['Feature development'],
    status: 'draft',
    userId: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    owner: 'user-1',
    rawText: '',
  },
] as unknown as Experience[];

describe('ExperienceList', () => {
  const createWrapper = (props = {}) => {
    return mount(ExperienceList, {
      props: {
        experiences: [],
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });
  };

  it('renders correctly', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.find('.u-table').exists()).toBe(true);
  });

  it('displays title', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Your Experiences');
  });

  it('displays add new button', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    expect(buttons.some((btn) => btn.props('label') === 'Add Experience')).toBe(true);
  });

  it('emits edit event with empty id when add new button clicked', async () => {
    const wrapper = createWrapper();
    const addButton = wrapper
      .findAllComponents({ name: 'UButton' })
      .find((btn) => btn.props('label') === 'Add Experience');

    await addButton?.trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual(['']);
  });

  it('displays empty state when no experiences', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('No experiences yet');
  });

  it('displays experiences in table', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    expect(wrapper.text()).toContain('Senior Software Engineer');
    expect(wrapper.text()).toContain('Tech Corp');
    expect(wrapper.text()).toContain('Software Engineer');
    expect(wrapper.text()).toContain('StartupCo');
  });

  it('displays correct number of table columns', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const headers = wrapper.findAll('th');
    expect(headers.length).toBe(6); // title, company, startDate, endDate, status, actions
  });

  it('formats dates correctly', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    // Dates should be formatted (implementation depends on locale)
    expect(wrapper.text()).toContain('2020');
    expect(wrapper.text()).toContain('2023');
  });

  it('displays Present for empty end date', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    expect(wrapper.text()).toContain('Present');
  });

  it('displays status badges', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const badges = wrapper.findAllComponents({ name: 'UBadge' });
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays draft status with gray badge', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const badges = wrapper.findAllComponents({ name: 'UBadge' });
    const draftBadge = badges.find((badge) => badge.props('label') === 'Draft');
    expect(draftBadge?.props('color')).toBe('gray');
  });

  it('displays complete status with green badge', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const badges = wrapper.findAllComponents({ name: 'UBadge' });
    const completeBadge = badges.find((badge) => badge.props('label') === 'Complete');
    expect(completeBadge?.props('color')).toBe('green');
  });

  it('displays edit and delete buttons for each experience', () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    // Should have: 1 add button + 2 * (edit + delete) for 2 experiences = 5 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  it('emits edit event with experience id when edit button clicked', async () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const editButtons = buttons.filter((btn) => btn.props('icon') === 'i-heroicons-pencil');

    await editButtons[0].trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual(['1']);
  });

  it('emits delete event with experience id when delete button clicked', async () => {
    const wrapper = createWrapper({ experiences: mockExperiences });
    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const deleteButtons = buttons.filter((btn) => btn.props('icon') === 'i-heroicons-trash');

    await deleteButtons[0].trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['1']);
  });

  it('handles missing company name gracefully', () => {
    const experienceWithoutCompany = {
      ...mockExperiences[0],
      companyName: null,
    };
    const wrapper = createWrapper({ experiences: [experienceWithoutCompany] });
    expect(wrapper.text()).toContain('-');
  });
});
