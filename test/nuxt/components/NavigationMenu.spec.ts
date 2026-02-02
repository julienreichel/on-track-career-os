import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import NavigationMenu from '@/components/NavigationMenu.vue';

const i18n = createTestI18n();

const stubs = {
  UDropdown: {
    props: ['items', 'popper'],
    template: '<div class="u-dropdown"><slot /></div>',
  },
  UButton: {
    props: ['label', 'variant', 'icon', 'to', 'trailingIcon'],
    template: '<button class="u-button">{{ label }}</button>',
  },
};

describe('NavigationMenu', () => {
  it('renders without errors', () => {
    const wrapper = mount(NavigationMenu, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.u-dropdown').exists()).toBe(true);
  });

  it('passes navigation items with correct structure', () => {
    const wrapper = mount(NavigationMenu, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const component = wrapper.vm;
    const links = component.navigationLinks;

    // Check that we have 3 main items
    expect(links).toHaveLength(3);

    // Check Profile section
    const profileItem = links[0];
    expect(profileItem.label).toBe(i18n.global.t('navigation.profile'));
    expect(profileItem.to).toBe('/profile');
    expect(profileItem.icon).toBe('i-heroicons-user');
    expect(profileItem.children).toHaveLength(3);
    expect(profileItem.children[0].label).toBe(i18n.global.t('navigation.experiences'));
    expect(profileItem.children[0].to).toBe('/profile/experiences');
    expect(profileItem.children[1].label).toBe(i18n.global.t('navigation.stories'));
    expect(profileItem.children[1].to).toBe('/profile/stories');
    expect(profileItem.children[2].label).toBe(i18n.global.t('navigation.personalCanvas'));
    expect(profileItem.children[2].to).toBe('/profile/canvas');

    // Check Jobs section
    const jobsItem = links[1];
    expect(jobsItem.label).toBe(i18n.global.t('navigation.jobs'));
    expect(jobsItem.to).toBe('/jobs');
    expect(jobsItem.icon).toBe('i-heroicons-briefcase');
    expect(jobsItem.children).toHaveLength(1);
    expect(jobsItem.children[0].label).toBe(i18n.global.t('navigation.companies'));
    expect(jobsItem.children[0].to).toBe('/companies');

    // Check Applications section
    const applicationsItem = links[2];
    expect(applicationsItem.label).toBe(i18n.global.t('navigation.applications'));
    expect(applicationsItem.to).toBe('/applications');
    expect(applicationsItem.icon).toBe('i-heroicons-document-text');
    expect(applicationsItem.children).toHaveLength(3);
    expect(applicationsItem.children[0].label).toBe(i18n.global.t('navigation.cvs'));
    expect(applicationsItem.children[0].to).toBe('/applications/cv');
    expect(applicationsItem.children[1].label).toBe(i18n.global.t('navigation.coverLetters'));
    expect(applicationsItem.children[1].to).toBe('/applications/cover-letters');
    expect(applicationsItem.children[2].label).toBe(i18n.global.t('navigation.speeches'));
    expect(applicationsItem.children[2].to).toBe('/applications/speech');
  });

  it('renders dropdown buttons for each navigation item', () => {
    const wrapper = mount(NavigationMenu, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    expect(buttons).toHaveLength(3); // Profile, Jobs, Applications

    expect(buttons[0].props('label')).toBe(i18n.global.t('navigation.profile'));
    expect(buttons[1].props('label')).toBe(i18n.global.t('navigation.jobs'));
    expect(buttons[2].props('label')).toBe(i18n.global.t('navigation.applications'));
  });
});
