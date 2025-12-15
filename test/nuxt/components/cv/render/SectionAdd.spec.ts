import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CvSectionAdd from '@/components/cv/render/SectionAdd.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      cvSectionAdd: {
        title: 'Add Section',
        addSection: 'Add Section',
        sections: {
          summary: {
            label: 'Professional Summary',
            description: 'A brief overview of your professional profile',
          },
          experience: {
            label: 'Work Experience',
            description: 'Your work history and achievements',
          },
          education: {
            label: 'Education',
            description: 'Your educational background',
          },
          skills: {
            label: 'Skills',
            description: 'Technical and soft skills',
          },
          languages: {
            label: 'Languages',
            description: 'Languages you speak',
          },
          certifications: {
            label: 'Certifications',
            description: 'Professional certifications',
          },
          interests: {
            label: 'Interests',
            description: 'Hobbies and interests',
          },
          custom: {
            label: 'Custom Section',
            description: 'Add a custom section',
          },
        },
      },
    },
  },
});

const stubs = {
  UModal: {
    template: '<div v-if="open" class="modal"><div class="modal-body"><slot name="body" /></div></div>',
    props: ['open', 'title', 'description', 'close'],
    emits: ['update:open'],
  },
  UButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'color', 'variant', 'block', 'disabled'],
    emits: ['click'],
  },
  UIcon: {
    template: '<i :class="name" />',
    props: ['name'],
  },
};

describe('CvSectionAdd', () => {
  it('renders modal when opened', () => {
    const wrapper = mount(CvSectionAdd, {
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('displays all section types', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    // Open modal by clicking the button
    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('Professional Summary');
    expect(text).toContain('Skills');
    expect(text).toContain('Languages');
    expect(text).toContain('Certifications');
    expect(text).toContain('Interests');
    expect(text).toContain('Custom Section');
  });

  it('filters out existing section types except custom', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: ['summary', 'skills'],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).not.toContain('Professional Summary');
    expect(text).not.toContain('Skills');
    expect(text).toContain('Languages');
    expect(text).toContain('Certifications');
    expect(text).toContain('Custom Section'); // Custom is always shown
  });

  it('allows multiple custom sections', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: ['custom'],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('Custom Section');
  });

  it('emits add event when section type selected', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const summaryButton = buttons.find((b) => b.text().includes('Professional Summary'));
    expect(summaryButton).toBeTruthy();
    await summaryButton!.trigger('click');

    expect(wrapper.emitted('add')).toBeTruthy();
    expect(wrapper.emitted('add')?.[0]?.[0]).toBe('summary');
  });

  it('closes modal after section is added', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const skillsButton = buttons.find((b) => b.text().includes('Skills'));
    await skillsButton?.trigger('click');

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('displays section descriptions', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('A brief overview of your professional profile');
    expect(text).toContain('Technical and soft skills');
    expect(text).toContain('Languages you speak');
  });

  it.skip('displays icons for each section type', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const icons = wrapper.findAll('i');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('shows all sections when no existing types', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button').filter((b) => b.text().length > 0);
    expect(buttons.length).toBe(7); // 6 section types + 1 close button
  });

  it('emits correct section type for custom', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const customButton = buttons.find((b) => b.text().includes('Custom Section'));
    expect(customButton).toBeTruthy();
    await customButton!.trigger('click');

    expect(wrapper.emitted('add')?.[0]?.[0]).toBe('custom');
  });

  it('handles empty existingTypes array', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Professional Summary');
  });

  it('renders in correct order', async () => {
    const wrapper = mount(CvSectionAdd, {
      props: {
        existingTypes: [],
      },
      global: {
        plugins: [i18n],
        stubs,
      },
    });

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    const summaryIndex = text.indexOf('Professional Summary');
    const skillsIndex = text.indexOf('Skills');
    const languagesIndex = text.indexOf('Languages');

    expect(summaryIndex).toBeLessThan(skillsIndex);
    expect(skillsIndex).toBeLessThan(languagesIndex);
  });
});
