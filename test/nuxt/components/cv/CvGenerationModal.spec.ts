import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CvGenerationModal from '@/components/cv/CvGenerationModal.vue';
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
  UModal: {
    props: ['title', 'description'],
    template:
      '<div><h2>{{ title }}</h2><p>{{ description }}</p><slot /><slot name="body" /><slot name="footer" /></div>',
  },
  UCard: { template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>' },
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
  CvExperienceMultiSelect: {
    props: ['modelValue', 'experiences'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" data-testid="experience" @click="$emit(\'update:modelValue\', [experiences[0]?.id].filter(Boolean))">select</button>',
  },
};

describe('CvGenerationModal', () => {
  it('renders modal content when open', () => {
    const wrapper = mount(CvGenerationModal, {
      props: {
        open: true,
        templates,
        experiences,
        initialTemplateId: 'template-1',
        initialEnabledSections: ['summary', 'skills'],
        initialSelectedExperienceIds: ['exp-1'],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.text()).toContain(i18n.global.t('cvGenerate.modal.title'));
    expect(wrapper.text()).toContain('Classic');
    expect(wrapper.text()).toContain(i18n.global.t('cvGenerate.modal.sectionsLabel'));
  });

  it('emits confirm with selections', async () => {
    const wrapper = mount(CvGenerationModal, {
      props: {
        open: true,
        templates,
        experiences,
        initialTemplateId: 'template-1',
        initialEnabledSections: ['summary'],
        initialSelectedExperienceIds: [],
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

    await wrapper.find('[data-testid="experience"]').trigger('click');

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text() === i18n.global.t('cvGenerate.actions.generate'));
    await confirmButton?.trigger('click');

    const emitted = wrapper.emitted('confirm');
    expect(emitted).toBeTruthy();
    const payload = emitted?.[0]?.[0] as {
      templateId: string | null;
      enabledSections: string[];
      selectedExperienceIds: string[];
    };
    expect(payload.templateId).toBe('template-1');
    expect(payload.enabledSections).toContain('skills');
    expect(payload.selectedExperienceIds).toEqual(['exp-1']);
  });
});
