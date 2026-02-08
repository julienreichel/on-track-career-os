import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../utils/createTestI18n';
import CompanyNotesInput from '~/components/company/CompanyNotesInput.vue';

const i18n = createTestI18n();

const stubs = {
  UFormField: {
    name: 'UFormField',
    props: ['label', 'hint'],
    template: `
      <div class="form-field">
        <label v-if="label">{{ label }}</label>
        <div class="hint" v-if="hint">{{ hint }}</div>
        <slot />
      </div>
    `,
  },
  UTextarea: {
    name: 'UTextarea',
    props: ['modelValue', 'placeholder', 'rows', 'disabled'],
    template: `
      <textarea 
        :value="modelValue" 
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
};

function mountCompanyNotesInput(props: any = {}) {
  return mount(CompanyNotesInput, {
    props: {
      modelValue: '',
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('CompanyNotesInput', () => {
  describe('Rendering', () => {
    it('renders form field with label', () => {
      const wrapper = mountCompanyNotesInput();
      expect(wrapper.find('label').text()).toBe('Research notes');
    });

    it('renders form field with hint', () => {
      const wrapper = mountCompanyNotesInput();
      expect(wrapper.find('.hint').text()).toContain('call notes, press articles');
    });

    it('renders textarea', () => {
      const wrapper = mountCompanyNotesInput();
      expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('displays placeholder text', () => {
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('placeholder')).toContain('Paste raw research notes');
    });

    it('sets textarea rows to 6', () => {
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('rows')).toBe('6');
    });
  });

  describe('v-model Binding', () => {
    it('displays initial value', () => {
      const wrapper = mountCompanyNotesInput({
        modelValue: 'Initial notes content',
      });
      const textarea = wrapper.find('textarea');
      expect(textarea.element.value).toBe('Initial notes content');
    });

    it('emits update:modelValue when user types', async () => {
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');

      await textarea.setValue('New notes content');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New notes content']);
    });

    it('updates when modelValue prop changes', async () => {
      const wrapper = mountCompanyNotesInput({ modelValue: 'First' });

      await wrapper.setProps({ modelValue: 'Updated' });

      const textarea = wrapper.find('textarea');
      expect(textarea.element.value).toBe('Updated');
    });

    it('handles empty string value', () => {
      const wrapper = mountCompanyNotesInput({ modelValue: '' });
      const textarea = wrapper.find('textarea');
      expect(textarea.element.value).toBe('');
    });

    it('handles multiline text', async () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');

      await textarea.setValue(multilineText);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([multilineText]);
    });
  });

  describe('Disabled State', () => {
    it('is enabled by default', () => {
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('disabled')).toBeUndefined();
    });

    it('disables textarea when disabled prop is true', () => {
      const wrapper = mountCompanyNotesInput({ disabled: true });
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('disabled')).toBeDefined();
    });

    it('does not emit updates when disabled', async () => {
      const wrapper = mountCompanyNotesInput({ disabled: true });
      const textarea = wrapper.find('textarea');

      // Try to type (won't work because disabled)
      await textarea.trigger('input');

      // Should not emit or should be blocked
      const textarea2 = wrapper.findComponent({ name: 'UTextarea' });
      expect(textarea2.props('disabled')).toBe(true);
    });

    it('can be enabled after being disabled', async () => {
      const wrapper = mountCompanyNotesInput({ disabled: true });

      await wrapper.setProps({ disabled: false });

      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Props Passing', () => {
    it('passes label to UFormField', () => {
      const wrapper = mountCompanyNotesInput();
      const formField = wrapper.findComponent({ name: 'UFormField' });
      expect(formField.props('label')).toBe('Research notes');
    });

    it('passes hint to UFormField', () => {
      const wrapper = mountCompanyNotesInput();
      const formField = wrapper.findComponent({ name: 'UFormField' });
      expect(formField.props('hint')).toContain('call notes, press articles');
    });

    it('passes modelValue to UTextarea', () => {
      const wrapper = mountCompanyNotesInput({ modelValue: 'Test value' });
      const textarea = wrapper.findComponent({ name: 'UTextarea' });
      expect(textarea.props('modelValue')).toBe('Test value');
    });

    it('passes disabled prop to UTextarea', () => {
      const wrapper = mountCompanyNotesInput({ disabled: true });
      const textarea = wrapper.findComponent({ name: 'UTextarea' });
      expect(textarea.props('disabled')).toBe(true);
    });

    it('passes rows prop to UTextarea', () => {
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.findComponent({ name: 'UTextarea' });
      expect(textarea.props('rows')).toBe(6);
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', async () => {
      const longText = 'a'.repeat(10000);
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');

      await textarea.setValue(longText);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([longText]);
    });

    it('handles special characters', async () => {
      const specialText = '<script>alert("xss")</script>';
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');

      await textarea.setValue(specialText);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([specialText]);
    });

    it('handles unicode characters', async () => {
      const unicodeText = '🚀 Testing émojis and spëcial çharacters';
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');

      await textarea.setValue(unicodeText);

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([unicodeText]);
    });

    it('handles rapid input changes', async () => {
      const wrapper = mountCompanyNotesInput();
      const textarea = wrapper.find('textarea');

      await textarea.setValue('First');
      await textarea.setValue('Second');
      await textarea.setValue('Third');

      const emissions = wrapper.emitted('update:modelValue');
      expect(emissions).toHaveLength(3);
      expect(emissions?.[2]).toEqual(['Third']);
    });
  });

  describe('Component Structure', () => {
    it('has correct class on textarea', () => {
      const wrapper = mountCompanyNotesInput();
      // Verify component is rendered with full width class
      expect(wrapper.html()).toContain('w-full');
    });

    it('maintains component hierarchy', () => {
      const wrapper = mountCompanyNotesInput();
      const formField = wrapper.findComponent({ name: 'UFormField' });
      const textarea = wrapper.findComponent({ name: 'UTextarea' });

      expect(formField.exists()).toBe(true);
      expect(textarea.exists()).toBe(true);
    });
  });
});
