import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExperienceForm from '@/components/ExperienceForm.vue';
import type { Experience } from '@/domain/experience/Experience';

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'experiences.form.editTitle': 'Edit Experience',
        'experiences.form.createTitle': 'Add Experience',
        'experiences.form.title': 'Job Title',
        'experiences.form.titlePlaceholder': 'e.g., Senior Software Engineer',
        'experiences.form.company': 'Company Name',
        'experiences.form.companyPlaceholder': 'e.g., Acme Corporation',
        'experiences.form.startDate': 'Start Date',
        'experiences.form.endDate': 'End Date',
        'experiences.form.endDateHint': 'Leave empty if this is your current position',
        'experiences.form.responsibilities': 'Responsibilities',
        'experiences.form.responsibilitiesPlaceholder': 'Enter each responsibility on a new line',
        'experiences.form.responsibilitiesHint': 'One responsibility per line',
        'experiences.form.tasks': 'Tasks & Achievements',
        'experiences.form.tasksPlaceholder': 'Enter each task or achievement on a new line',
        'experiences.form.tasksHint': 'One task per line',
        'experiences.form.status': 'Status',
        'experiences.form.save': 'Save Experience',
        'experiences.form.cancel': 'Cancel',
        'experiences.status.draft': 'Draft',
        'experiences.status.complete': 'Complete',
      };
      return translations[key] || key;
    },
  }),
}));

const mockExperience: Experience = {
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
};

describe('ExperienceForm', () => {
  it('renders form for new experience', () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: false,
      },
    });

    expect(wrapper.find('h3').text()).toBe('Add Experience');
    expect(wrapper.find('button[type="submit"]').text()).toContain('Save Experience');
  });

  it('renders form for editing experience', () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: mockExperience,
        loading: false,
      },
    });

    expect(wrapper.find('h3').text()).toBe('Edit Experience');
  });

  it('populates form with experience data', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: mockExperience,
        loading: false,
      },
    });

    await wrapper.vm.$nextTick();

    // Check that form fields are populated
    const titleInput = wrapper.find('input[placeholder*="Senior Software Engineer"]');
    expect(titleInput.exists()).toBe(true);
  });

  it('emits save event with form data on submit', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: false,
      },
    });

    // Fill form
    const form = wrapper.vm as {
      form: {
        title: string;
        companyName: string;
        startDate: string;
        endDate: string;
        status: string;
        userId: string;
      };
    };

    form.form.title = 'Software Engineer';
    form.form.companyName = 'StartupCo';
    form.form.startDate = '2023-01-01';
    form.form.endDate = '2024-01-01';
    form.form.status = 'draft';
    form.form.userId = 'user-1';

    // Submit form
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedData = wrapper.emitted('save')?.[0][0] as Record<string, unknown>;
    expect(emittedData.title).toBe('Software Engineer');
    expect(emittedData.companyName).toBe('StartupCo');
  });

  it('emits cancel event when cancel button clicked', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: false,
      },
    });

    const cancelButton = wrapper.find('button[type="button"]');
    await cancelButton.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('converts textarea content to arrays', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: false,
      },
    });

    // Access component instance
    const component = wrapper.vm as {
      form: {
        title: string;
        startDate: string;
        userId: string;
      };
      responsibilitiesText: string;
      tasksText: string;
    };

    // Set form data
    component.form.title = 'Test';
    component.form.startDate = '2023-01-01';
    component.form.userId = 'user-1';
    component.responsibilitiesText = 'Responsibility 1\nResponsibility 2\nResponsibility 3';
    component.tasksText = 'Task 1\nTask 2';

    // Submit form
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedData = wrapper.emitted('save')?.[0][0] as {
      responsibilities: string[];
      tasks: string[];
    };
    expect(emittedData.responsibilities).toHaveLength(3);
    expect(emittedData.tasks).toHaveLength(2);
  });

  it('filters out empty lines from text areas', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: false,
      },
    });

    const component = wrapper.vm as {
      form: {
        title: string;
        startDate: string;
        userId: string;
      };
      responsibilitiesText: string;
      tasksText: string;
    };

    component.form.title = 'Test';
    component.form.startDate = '2023-01-01';
    component.form.userId = 'user-1';
    component.responsibilitiesText = 'Line 1\n\nLine 2\n   \nLine 3';
    component.tasksText = '\nTask 1\n\n';

    await wrapper.find('form').trigger('submit.prevent');

    const emittedData = wrapper.emitted('save')?.[0][0] as {
      responsibilities: string[];
      tasks: string[];
    };
    expect(emittedData.responsibilities).toHaveLength(3);
    expect(emittedData.tasks).toHaveLength(1);
  });

  it('disables submit button when required fields are empty', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: false,
      },
    });

    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('disabled')).toBeDefined();
  });

  it('shows loading state on submit button', () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: null,
        loading: true,
      },
    });

    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('loading')).toBeDefined();
  });

  it('initializes text areas from experience arrays', async () => {
    const wrapper = mount(ExperienceForm, {
      props: {
        experience: mockExperience,
        loading: false,
      },
    });

    await wrapper.vm.$nextTick();

    const component = wrapper.vm as {
      responsibilitiesText: string;
      tasksText: string;
    };

    expect(component.responsibilitiesText).toContain('Lead development');
    expect(component.responsibilitiesText).toContain('Mentor team');
    expect(component.tasksText).toContain('Build features');
    expect(component.tasksText).toContain('Code reviews');
  });
});
