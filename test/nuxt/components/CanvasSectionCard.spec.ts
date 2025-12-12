import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasSectionCard from '@/components/CanvasSectionCard.vue';

describe('CanvasSectionCard', () => {
  const defaultProps = {
    icon: 'i-heroicons-user-group',
    title: 'Test Section',
    items: null,
    isEditing: false,
    editValue: '',
    placeholder: 'Enter text here',
    emptyText: 'No data',
  };

  it('renders with title and icon', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: defaultProps,
    });

    expect(wrapper.find('h3').text()).toBe('Test Section');
    // Verify icon component exists with correct name prop
    const icon = wrapper.findComponent({ name: 'UIcon' });
    expect(icon.exists()).toBe(true);
    expect(icon.props('name')).toBe('i-heroicons-user-group');
  });

  it('displays empty text when no items', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('No data');
  });

  it('displays list of items when provided', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        items: ['Item 1', 'Item 2', 'Item 3'],
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(3);
    expect(wrapper.text()).toContain('Item 1');
    expect(wrapper.text()).toContain('Item 2');
    expect(wrapper.text()).toContain('Item 3');
  });

  it('does not display empty text when items exist', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        items: ['Item 1'],
      },
    });

    expect(wrapper.text()).not.toContain('No data');
  });

  it('shows textarea in edit mode', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
        editValue: 'Edit text',
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);
    expect(textarea.element.value).toBe('Edit text');
  });

  it('hides list items in edit mode', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        items: ['Item 1', 'Item 2'],
        isEditing: true,
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(0);
  });

  it('shows placeholder in textarea', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
        placeholder: 'Custom placeholder',
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('placeholder')).toBe('Custom placeholder');
  });

  it('emits update:editValue when textarea changes', async () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
        editValue: 'Initial text',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('New text');

    expect(wrapper.emitted('update:editValue')).toBeTruthy();
    expect(wrapper.emitted('update:editValue')?.[0]).toEqual(['New text']);
  });

  it('handles empty array as no items', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        items: [],
      },
    });

    expect(wrapper.text()).toContain('No data');
    expect(wrapper.findAll('li')).toHaveLength(0);
  });

  it('handles undefined items', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        items: undefined,
      },
    });

    expect(wrapper.text()).toContain('No data');
  });

  it('applies correct number of rows to textarea', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('rows')).toBe('8');
  });

  it('shows edit button when not editing', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: defaultProps,
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-pencil');
    expect(editButton?.exists()).toBe(true);
  });

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(CanvasSectionCard, {
      props: defaultProps,
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-pencil');
    await editButton?.vm.$emit('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
  });

  it('shows save and cancel buttons when editing', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
      },
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const saveButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-check');
    const cancelButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-x-mark');
    
    expect(saveButton?.exists()).toBe(true);
    expect(cancelButton?.exists()).toBe(true);
  });

  it('emits save event when save button clicked', async () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
      },
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const saveButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-check');
    await saveButton?.vm.$emit('click');

    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('emits cancel event when cancel button clicked', async () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
      },
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const cancelButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-x-mark');
    await cancelButton?.vm.$emit('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('hides edit button when editing', () => {
    const wrapper = mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        isEditing: true,
      },
    });

    const buttons = wrapper.findAllComponents({ name: 'UButton' });
    const editButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-pencil');
    expect(editButton).toBeUndefined();
  });
});
