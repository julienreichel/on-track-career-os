import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvSettingsForm from '@/components/cv/CvSettingsForm.vue';
import type { CVTemplate } from '@/domain/cvtemplate/CVTemplate';
import type { Experience } from '@/domain/experience/Experience';

const i18n = createTestI18n();

const templates: CVTemplate[] = [
  {
    id: 'template-1',
    name: 'Classic',
    content: '# Classic',
    source: 'user',
  } as CVTemplate,
];

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
  UFormField: { template: '<div class="form-field"><slot /></div>' },
  USelect: {
    props: ['modelValue', 'items'],
    emits: ['update:modelValue'],
    template:
      '<select @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
  },
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
  it('renders sections and templates', () => {
    const wrapper = mount(CvSettingsForm, {
      props: {
        modelValue: {
          askEachTime: false,
          defaultTemplateId: null,
          defaultEnabledSections: ['summary'],
          defaultIncludedExperienceIds: [],
          showProfilePhoto: true,
        },
        templates,
        experiences,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('cvSettings.sections.other.title'));
    expect(wrapper.text()).toContain('Classic');
  });

  it('emits updates when sections are toggled and saved', async () => {
    const wrapper = mount(CvSettingsForm, {
      props: {
        modelValue: {
          askEachTime: false,
          defaultTemplateId: null,
          defaultEnabledSections: ['summary'],
          defaultIncludedExperienceIds: [],
          showProfilePhoto: true,
        },
        templates,
        experiences,
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    const sectionButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('cvSettings.sectionLabels.skills'));
    await sectionButton?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('common.save'));
    await saveButton?.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
  });
});
