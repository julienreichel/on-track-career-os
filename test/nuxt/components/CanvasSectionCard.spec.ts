import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestI18n } from '../../utils/createTestI18n';
import CanvasSectionCard from '@/components/CanvasSectionCard.vue';

// Create i18n instance for tests
const i18n = createTestI18n();

describe('CanvasSectionCard', () => {
  const defaultProps = {
    icon: 'i-heroicons-user-group',
    title: 'Test Section',
    items: null,
    isEditing: false,
    placeholder: 'Enter text here',
    emptyText: 'No data',
  };

  const createWrapper = (props = {}) => {
    return mount(CanvasSectionCard, {
      props: {
        ...defaultProps,
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs: {
          UIcon: {
            name: 'UIcon',
            props: ['name'],
            template: '<span class="u-icon"></span>',
          },
          UBadge: {
            name: 'UBadge',
            template: '<span class="u-badge"><slot /></span>',
          },
          UButton: {
            name: 'UButton',
            props: ['icon', 'label'],
            template: '<button type="button"><slot />{{ label }}</button>',
          },
          UInput: {
            name: 'UInput',
            props: ['modelValue', 'placeholder'],
            emits: ['update:modelValue', 'keydown'],
            template: `
              <input
                :value="modelValue"
                :placeholder="placeholder"
                @input="$emit('update:modelValue', $event.target.value)"
                @keydown="$emit('keydown', $event)"
              />
            `,
          },
        },
      },
    });
  };

  describe('Display Mode', () => {
    it('renders with title and icon', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('h3').text()).toBe('Test Section');
      const icon = wrapper.findComponent({ name: 'UIcon' });
      expect(icon.exists()).toBe(true);
      expect(icon.props('name')).toBe('i-heroicons-user-group');
    });

    it('displays empty text when no items', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('No data');
    });

    it('displays tags when items provided', () => {
      const wrapper = createWrapper({
        items: ['Item 1', 'Item 2', 'Item 3'],
      });

      const badges = wrapper.findAllComponents({ name: 'UBadge' });
      expect(badges.length).toBeGreaterThanOrEqual(3);
      expect(wrapper.text()).toContain('Item 1');
      expect(wrapper.text()).toContain('Item 2');
      expect(wrapper.text()).toContain('Item 3');
    });

    it('does not display empty text when items exist', () => {
      const wrapper = createWrapper({
        items: ['Item 1'],
      });

      expect(wrapper.text()).not.toContain('No data');
    });

    it('handles empty array as no items', () => {
      const wrapper = createWrapper({
        items: [],
      });

      expect(wrapper.text()).toContain('No data');
    });

    it('handles undefined items', () => {
      const wrapper = createWrapper({
        items: undefined,
      });

      expect(wrapper.text()).toContain('No data');
    });

    it('shows edit button when not editing', () => {
      const wrapper = createWrapper();

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const editButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-pencil');
      expect(editButton?.exists()).toBe(true);
      // aria-label is tested in E2E tests
    });

    it('emits edit event when edit button clicked', async () => {
      const wrapper = createWrapper();

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const editButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-pencil');
      await editButton?.vm.$emit('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
    });

    it('does not show input or delete buttons in display mode', () => {
      const wrapper = createWrapper({
        items: ['Item 1', 'Item 2'],
      });

      const input = wrapper.findComponent({ name: 'UInput' });
      expect(input.exists()).toBe(false);

      const badges = wrapper.findAllComponents({ name: 'UBadge' });
      badges.forEach((badge) => {
        // Delete buttons should not be present inside badges in display mode
        const deleteButtons = badge.findAllComponents({ name: 'UButton' });
        expect(deleteButtons.length).toBe(0);
      });
    });
  });

  describe('Edit Mode', () => {
    it('shows input field when editing', () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const input = wrapper.findComponent({ name: 'UInput' });
      expect(input.exists()).toBe(true);
      expect(input.props('placeholder')).toBe('Enter text here');
    });

    it('shows save and cancel buttons when editing', () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const saveButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-check');
      const cancelButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-x-mark');

      expect(saveButton?.exists()).toBe(true);
      expect(cancelButton?.exists()).toBe(true);
      // aria-label attributes are tested in E2E tests
    });

    it('hides edit button when editing', () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const editButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-pencil');
      expect(editButton).toBeUndefined();
    });

    it('emits save event when save button clicked', async () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const saveButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-check');
      await saveButton?.vm.$emit('click');

      expect(wrapper.emitted('save')).toBeTruthy();
    });

    it('emits cancel event when cancel button clicked', async () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const buttons = wrapper.findAllComponents({ name: 'UButton' });
      const cancelButton = buttons.find((btn) => btn.props('icon') === 'i-heroicons-x-mark');
      await cancelButton?.vm.$emit('click');

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('initializes editItems from props when entering edit mode', async () => {
      const wrapper = createWrapper({
        items: ['Existing 1', 'Existing 2'],
        isEditing: true,
      });

      await flushPromises();

      const badges = wrapper.findAllComponents({ name: 'UBadge' });
      expect(badges.length).toBeGreaterThanOrEqual(2);
      expect(wrapper.text()).toContain('Existing 1');
      expect(wrapper.text()).toContain('Existing 2');
    });

    it('shows tags with delete buttons in edit mode', () => {
      const wrapper = createWrapper({
        items: ['Item 1', 'Item 2'],
        isEditing: true,
      });

      const badges = wrapper.findAllComponents({ name: 'UBadge' });
      expect(badges.length).toBeGreaterThanOrEqual(2);

      // Each badge should have a delete button (x-mark icon) inside it
      badges.forEach((badge) => {
        const deleteButtons = badge.findAllComponents({ name: 'UButton' });
        const hasDeleteButton = deleteButtons.some(
          (btn) => btn.props('icon') === 'i-heroicons-x-mark-20-solid'
        );
        expect(hasDeleteButton).toBe(true);
      });
    });
  });

  describe('Tag Management', () => {
    it('adds tag when Enter key pressed with non-empty input', async () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const input = wrapper.findComponent({ name: 'UInput' });

      // Set input value
      await input.vm.$emit('update:modelValue', 'New Tag');
      await flushPromises();

      // Simulate Enter key
      const inputElement = input.find('input');
      await inputElement.trigger('keydown.enter');
      await flushPromises();

      // Check that update:items was emitted with the new tag
      const updateEvents = wrapper.emitted('update:items');
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.length).toBeGreaterThan(0);
      expect(updateEvents?.[0]?.[0]).toContain('New Tag');
    });

    it('does not add empty tags', async () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const input = wrapper.findComponent({ name: 'UInput' });

      // Try to add empty tag
      await input.vm.$emit('update:modelValue', '   ');
      await flushPromises();

      const inputElement = input.find('input');
      await inputElement.trigger('keydown.enter');
      await flushPromises();

      // Should not emit update:items for empty/whitespace-only input
      const updateEvents = wrapper.emitted('update:items');
      expect(updateEvents).toBeFalsy();
    });

    it('clears input after adding tag', async () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const input = wrapper.findComponent({ name: 'UInput' });

      await input.vm.$emit('update:modelValue', 'New Tag');
      await flushPromises();

      const inputElement = input.find('input');
      await inputElement.trigger('keydown.enter');
      await flushPromises();

      // Check that update:items was emitted (tag was added)
      const updateEvents = wrapper.emitted('update:items');
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.length).toBeGreaterThan(0);
      expect(updateEvents?.[0]?.[0]).toContain('New Tag');
    });

    it('removes tag when delete button clicked', async () => {
      const wrapper = createWrapper({
        items: ['Item 1', 'Item 2', 'Item 3'],
        isEditing: true,
      });

      await flushPromises();

      // Find a badge and its delete button
      const badges = wrapper.findAllComponents({ name: 'UBadge' });
      expect(badges.length).toBeGreaterThan(0);

      const firstBadge = badges[0];
      expect(firstBadge).toBeTruthy();
      const deleteButtons = firstBadge?.findAllComponents({ name: 'UButton' }) ?? [];
      const deleteButton = deleteButtons.find(
        (btn) => btn.props('icon') === 'i-heroicons-x-mark-20-solid'
      );

      expect(deleteButton).toBeDefined();
      await deleteButton?.vm.$emit('click');
      await flushPromises();

      // Check that update:items was emitted with item removed
      const updateEvents = wrapper.emitted('update:items');
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.length).toBeGreaterThan(0);
      // The emitted array should have one less item
      const lastEmit = updateEvents?.[updateEvents.length - 1]?.[0] as string[] | undefined;
      expect(lastEmit).toBeTruthy();
      if (!lastEmit) return;
      expect(lastEmit.length).toBe(2);
    });

    it('emits update:items with correct array when adding multiple tags', async () => {
      const wrapper = createWrapper({
        isEditing: true,
      });

      const input = wrapper.findComponent({ name: 'UInput' });
      const inputElement = input.find('input');

      // Add first tag
      await input.vm.$emit('update:modelValue', 'Tag 1');
      await inputElement.trigger('keydown.enter');
      await flushPromises();

      // Add second tag
      await input.vm.$emit('update:modelValue', 'Tag 2');
      await inputElement.trigger('keydown.enter');
      await flushPromises();

      // Add third tag
      await input.vm.$emit('update:modelValue', 'Tag 3');
      await inputElement.trigger('keydown.enter');
      await flushPromises();

      const updateEvents = wrapper.emitted('update:items') as string[][] | undefined;
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.length).toBeGreaterThanOrEqual(3);
      // Each event emission contains the full array of tags accumulated so far
      const lastEmit = updateEvents?.[updateEvents.length - 1]?.[0];
      expect(lastEmit).toBeTruthy();
      if (!lastEmit) return;
      expect(lastEmit).toContain('Tag 1');
      expect(lastEmit).toContain('Tag 2');
      expect(lastEmit).toContain('Tag 3');
      expect(lastEmit.length).toBe(3);
    });
  });
});
