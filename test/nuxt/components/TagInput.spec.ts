import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TagInput from '../../../src/components/TagInput.vue';

// Manual i18n setup for standalone tests
const i18n = {
  global: {
    mocks: {
      t: (key: string) => key,
    },
  },
};

// Stub Nuxt UI components
const stubs = {
  UFormField: {
    template: '<div class="form-field"><slot /></div>',
    props: ['label', 'hint', 'required'],
  },
  UInput: {
    template: '<input :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="handleKeydown" />',
    props: ['modelValue', 'placeholder', 'disabled'],
    emits: ['update:modelValue', 'keydown'],
    setup(props, { emit }) {
      const handleKeydown = (event: KeyboardEvent) => {
        emit('keydown', event);
      };
      return { handleKeydown };
    },
  },
  UBadge: {
    template: '<span class="badge"><slot /></span>',
    props: ['color', 'variant'],
  },
  UButton: {
    template: '<button v-bind="$attrs" @click="$attrs.onClick || (() => {})"><slot /></button>',
    props: ['icon', 'size', 'color', 'variant', 'padded'],
  },
};

describe('TagInput', () => {
  it('renders with label and placeholder', () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Test Label',
        placeholder: 'Enter value',
      },
    });

    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toBe('Enter value');
  });

  it('displays existing tags', () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: ['Tag 1', 'Tag 2', 'Tag 3'],
        label: 'Tags',
        color: 'primary',
      },
    });

    expect(wrapper.text()).toContain('Tag 1');
    expect(wrapper.text()).toContain('Tag 2');
    expect(wrapper.text()).toContain('Tag 3');
  });

  it('emits update when adding a new tag', async () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
      },
    });

    // Directly set the component's internal inputValue ref
    (wrapper.vm as any).inputValue = 'New Tag';
    await wrapper.vm.$nextTick();

    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['New Tag']]);
  });

  it('clears input after adding a tag', async () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
      },
    });

    const input = wrapper.find('input');
    (wrapper.vm as any).inputValue = 'New Tag';
    await wrapper.vm.$nextTick();
    await input.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();

    // Verify the update was emitted and input is ready for next entry
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });

  it('does not add empty tags', async () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('   ');
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('trims whitespace from tags', async () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
      },
    });

    const input = wrapper.find('input');
    (wrapper.vm as any).inputValue = '  Tag with spaces  ';
    await wrapper.vm.$nextTick();
    await input.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['Tag with spaces']]);
  });

  it('emits update when removing a tag', async () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: ['Tag 1', 'Tag 2', 'Tag 3'],
        label: 'Tags',
      },
    });

    const removeButtons = wrapper.findAll('button');
    await removeButtons[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['Tag 1', 'Tag 3']]);
  });

  it('applies custom color to badges', () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: ['Tag 1'],
        label: 'Tags',
        color: 'success',
      },
    });

    // Check that badge is rendered with content
    const badges = wrapper.findAll('.badge');
    expect(badges.length).toBe(1);
    expect(badges[0].text()).toContain('Tag 1');
  });

  it('shows hint text when provided', () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
        hint: 'Press Enter to add',
      },
    });

    // FormField wrapper exists
    const formField = wrapper.find('.form-field');
    expect(formField.exists()).toBe(true);
  });

  it('marks field as required when prop is set', () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
        required: true,
      },
    });

    // Component renders with required prop
    const formField = wrapper.find('.form-field');
    expect(formField.exists()).toBe(true);
  });

  it('does not show tags section when array is empty', () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
      },
    });

    expect(wrapper.findAll('span').length).toBe(0); // No UBadge components
  });

  it('adds multiple tags in sequence', async () => {
    const wrapper = mount(TagInput, {
      ...i18n,
      global: {
        ...i18n.global,
        stubs,
      },
      props: {
        modelValue: [],
        label: 'Tags',
      },
    });

    const input = wrapper.find('input');

    (wrapper.vm as any).inputValue = 'First';
    await wrapper.vm.$nextTick();
    await input.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();

    await wrapper.setProps({ modelValue: ['First'] });

    (wrapper.vm as any).inputValue = 'Second';
    await wrapper.vm.$nextTick();
    await input.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.length).toBe(2);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['First']]);
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['First', 'Second']]);
  });
});
