import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvGenerateEntryCard from '@/components/cv/CvGenerateEntryCard.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: { template: '<div class="card"><slot name="header" /><slot /></div>' },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
};

describe('CvGenerateEntryCard', () => {
  it('renders defaults and labels', () => {
    const wrapper = mount(CvGenerateEntryCard, {
      props: {
        templateName: 'Classic',
        sectionCount: 5,
        experienceCount: 3,
        showProfilePhoto: false,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('applications.cvs.generate.entry.title'));
    expect(wrapper.text()).toContain('Classic');
    expect(wrapper.text()).toContain(
      i18n.global.t('applications.cvs.generate.entry.sections', { count: 5 })
    );
    expect(wrapper.text()).toContain(
      i18n.global.t('applications.cvs.generate.entry.experiences', { count: 3 })
    );
    expect(wrapper.text()).toContain(
      i18n.global.t('applications.cvs.generate.entry.showProfilePhotoDisabled')
    );
  });

  it('emits generate when button is clicked', async () => {
    const wrapper = mount(CvGenerateEntryCard, {
      props: {
        templateName: 'Classic',
        sectionCount: 2,
        experienceCount: 1,
        showProfilePhoto: true,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const generateButton = wrapper
      .findAll('button')
      .find(
        (button) => button.text() === i18n.global.t('applications.cvs.generate.actions.generate')
      );
    await generateButton?.trigger('click');

    expect(wrapper.emitted('generate')).toBeTruthy();
  });
});
