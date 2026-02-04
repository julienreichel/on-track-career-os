import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvSettingsForm from '@/components/cv/CvSettingsForm.vue';
import type { Experience } from '@/domain/experience/Experience';

const i18n = createTestI18n();

const experiences: Experience[] = [
  {
    id: 'exp-1',
    userId: 'user-1',
    title: 'Engineer',
    companyName: 'Acme',
    startDate: '2021-01-01',
    endDate: null,
  } as Experience,
];

const stubs = {
  UCard: { template: '<div class="card"><slot name="header" /><slot /></div>' },
  UCheckbox: {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" @click="$emit(\'update:modelValue\', !modelValue)">{{ label }}</button>',
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
  },
  USwitch: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" @click="$emit(\'update:modelValue\', !modelValue)">toggle</button>',
  },
  CvExperienceMultiSelect: {
    props: ['modelValue', 'experiences'],
    emits: ['update:modelValue'],
    template:
      '<div class="experience-select"><button @click="$emit(\'update:modelValue\', [experiences[0]?.id].filter(Boolean))">select</button></div>',
  },
};

describe('CvSettingsForm', () => {
  it('renders sections and other settings', () => {
    const wrapper = mount(CvSettingsForm, {
      props: {
        modelValue: {
          defaultTemplateId: null,
          defaultEnabledSections: ['summary'],
          defaultIncludedExperienceIds: [],
          showProfilePhoto: true,
        },
        experiences,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(
      i18n.global.t('applications.cvs.settings.sections.other.title')
    );
  });

  it('emits updates when sections are toggled and saved', async () => {
    const wrapper = mount(CvSettingsForm, {
      props: {
        modelValue: {
          defaultTemplateId: null,
          defaultEnabledSections: ['summary'],
          defaultIncludedExperienceIds: [],
          showProfilePhoto: true,
        },
        experiences,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const sectionButton = wrapper
      .findAll('button')
      .find(
        (button) =>
          button.text() === i18n.global.t('applications.cvs.settings.sectionLabels.skills')
      );
    await sectionButton?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('common.actions.save'));
    await saveButton?.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
  });
});
