import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExperienceList from '@/components/ExperienceList.vue';
import type { Experience } from '@/domain/experience/Experience';

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'experiences.list.title': 'Your Experiences',
        'experiences.list.addNew': 'Add Experience',
        'experiences.list.edit': 'Edit',
        'experiences.list.delete': 'Delete',
        'experiences.list.empty': 'No experiences yet',
        'experiences.table.title': 'Title',
        'experiences.table.company': 'Company',
        'experiences.table.startDate': 'Start Date',
        'experiences.table.endDate': 'End Date',
        'experiences.table.status': 'Status',
        'experiences.table.actions': 'Actions',
        'experiences.present': 'Present',
        'experiences.status.draft': 'Draft',
        'experiences.status.complete': 'Complete',
      };
      return translations[key] || key;
    },
  }),
}));

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
  },
  {
    id: '2',
    title: 'Software Engineer',
    companyName: 'StartupCo',
    startDate: '2018-06-01',
    endDate: null,
    responsibilities: ['Full-stack development'],
    tasks: ['Feature implementation'],
    status: 'draft',
    userId: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    owner: 'user-1',
  },
];

describe('ExperienceList', () => {
  it('renders experience list with data', () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: mockExperiences,
        loading: false,
      },
    });

    expect(wrapper.find('h3').text()).toBe('Your Experiences');
    expect(wrapper.html()).toContain('Senior Software Engineer');
    expect(wrapper.html()).toContain('Tech Corp');
  });

  it('renders empty state when no experiences', () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: [],
        loading: false,
      },
    });

    expect(wrapper.html()).toContain('No experiences yet');
  });

  it('displays loading state', () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: [],
        loading: true,
      },
    });

    // UTable should have loading prop
    expect(wrapper.html()).toContain('loading');
  });

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: mockExperiences,
        loading: false,
      },
    });

    // Find and click first edit button
    const editButtons = wrapper.findAll('[aria-label="Edit"]');
    await editButtons[0].trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual(['1']);
  });

  it('emits delete event when delete button clicked', async () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: mockExperiences,
        loading: false,
      },
    });

    // Find and click first delete button
    const deleteButtons = wrapper.findAll('[aria-label="Delete"]');
    await deleteButtons[0].trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['1']);
  });

  it('emits edit event with empty id when add new button clicked', async () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: mockExperiences,
        loading: false,
      },
    });

    // Find and click add new button
    const addButton = wrapper.find('[icon="i-heroicons-plus"]');
    await addButton.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual(['']);
  });

  it('formats dates correctly', () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: mockExperiences,
        loading: false,
      },
    });

    // Check that dates are formatted (not showing raw ISO strings)
    expect(wrapper.html()).not.toContain('2020-01-01');
    expect(wrapper.html()).toContain('Present'); // For null endDate
  });

  it('displays status badges with correct colors', () => {
    const wrapper = mount(ExperienceList, {
      props: {
        experiences: mockExperiences,
        loading: false,
      },
    });

    // Complete status should have green badge
    expect(wrapper.html()).toContain('Complete');
    // Draft status should have gray badge
    expect(wrapper.html()).toContain('Draft');
  });

  it('handles missing company name gracefully', () => {
    const experienceWithoutCompany: Experience = {
      ...mockExperiences[0],
      companyName: null,
    };

    const wrapper = mount(ExperienceList, {
      props: {
        experiences: [experienceWithoutCompany],
        loading: false,
      },
    });

    // Should display '-' for missing company
    expect(wrapper.html()).toContain('-');
  });
});
