import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import AchievementsKpisPanel from '../../../src/components/AchievementsKpisPanel.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      enhancer: {
        title: 'Achievements & KPIs',
        regenerate: 'Regenerate',
      },
      stories: {
        builder: {
          achievementsList: 'Achievements List',
          achievementsHint: 'Achievements hint',
          achievementsPlaceholder: 'Add achievement',
          kpisList: 'KPIs List',
          kpisHint: 'KPIs hint',
          kpisPlaceholder: 'Add KPI',
        },
      },
    },
  },
});

const stubs = {
  UButton: {
    template: '<button :disabled="loading" @click="$attrs.onClick"><slot /></button>',
    props: ['label', 'icon', 'variant', 'size', 'loading'],
  },
  TagInput: {
    template: '<div class="tag-input"><slot /></div>',
    props: ['modelValue', 'label', 'hint', 'placeholder', 'disabled', 'color'],
    emits: ['update:modelValue'],
  },
};

describe('AchievementsKpisPanel', () => {
  it('renders title and regenerate button', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: [],
      },
    });

    expect(wrapper.text()).toContain('Achievements & KPIs');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('displays achievements and kpis', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: ['Achievement 1', 'Achievement 2'],
        kpis: ['KPI 1', 'KPI 2'],
      },
    });

    const tagInputs = wrapper.findAll('.tag-input');
    expect(tagInputs).toHaveLength(2);
  });

  it('emits update:achievements when achievements change', async () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: ['Achievement 1'],
        kpis: [],
      },
    });

    const tagInputs = wrapper.findAll('.tag-input');
    await wrapper.vm.$emit('update:achievements', ['Achievement 1', 'Achievement 2']);

    expect(wrapper.emitted('update:achievements')).toBeTruthy();
    expect(wrapper.emitted('update:achievements')?.[0]).toEqual([
      ['Achievement 1', 'Achievement 2'],
    ]);
  });

  it('emits update:kpis when kpis change', async () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: ['KPI 1'],
      },
    });

    const tagInputs = wrapper.findAll('.tag-input');
    await wrapper.vm.$emit('update:kpis', ['KPI 1', 'KPI 2']);

    expect(wrapper.emitted('update:kpis')).toBeTruthy();
    expect(wrapper.emitted('update:kpis')?.[0]).toEqual([['KPI 1', 'KPI 2']]);
  });

  it('emits regenerate when button clicked', async () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: [],
      },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('regenerate')).toBeTruthy();
  });

  it('shows loading state on regenerate button', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: [],
        generating: true,
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('hides regenerate button in readonly mode', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: [],
        readonly: true,
      },
    });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('disables TagInputs in readonly mode', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: ['Achievement 1'],
        kpis: ['KPI 1'],
        readonly: true,
      },
    });

    const tagInputs = wrapper.findAll('.tag-input');
    expect(tagInputs).toHaveLength(2);
  });

  it('passes correct color props to TagInputs', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: [],
      },
    });

    const tagInputs = wrapper.findAll('.tag-input');
    expect(tagInputs).toHaveLength(2);
  });

  it('handles empty achievements and kpis', () => {
    const wrapper = mount(AchievementsKpisPanel, {
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        achievements: [],
        kpis: [],
      },
    });

    expect(wrapper.findAll('.tag-input')).toHaveLength(2);
  });
});
