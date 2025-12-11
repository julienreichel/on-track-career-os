import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import StarInterviewChat from '../../../src/components/StarInterviewChat.vue';
import type { ChatMessage } from '../../../src/composables/useStarInterview';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      interview: {
        assistant: 'Assistant',
        you: 'You',
        thinking: 'Thinking...',
        yourAnswer: 'Your Answer',
        answerPlaceholder: 'Enter your answer',
        submit: 'Submit',
        noMessages: 'No messages yet',
      },
    },
  },
});

const stubs = {
  UCard: {
    template: '<div class="card"><slot /></div>',
  },
  UFormField: {
    template: '<div class="form-field"><slot /></div>',
    props: ['label', 'required'],
  },
  UTextarea: {
    template:
      '<textarea :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows', 'disabled'],
    emits: ['update:modelValue'],
  },
  UButton: {
    template: '<button :disabled="disabled" @click="$attrs.onClick"><slot /></button>',
    props: ['label', 'icon', 'disabled'],
  },
  USkeleton: {
    template: '<div class="skeleton" />',
    props: ['class'],
  },
  UEmpty: {
    template: '<div class="empty"><slot /></div>',
    props: ['title', 'icon'],
  },
};

describe('StarInterviewChat', () => {
  it('renders empty state when no messages and no current question', () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
      },
    });

    expect(wrapper.find('.empty').exists()).toBe(true);
  });

  it('displays chat messages', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: 'Hello, how are you?' },
      { role: 'user', content: 'I am fine, thank you.' },
    ];

    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages,
      },
    });

    expect(wrapper.text()).toContain('Hello, how are you?');
    expect(wrapper.text()).toContain('I am fine, thank you.');
  });

  it('shows answer input when currentQuestion is provided', () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
      },
    });

    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('disables submit button when answer is empty', () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
      },
    });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('enables submit button when answer has content', async () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('John Doe');
    await wrapper.vm.$nextTick();

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('emits submit with answer when button clicked', async () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('John Doe');
    await wrapper.vm.$nextTick();

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')?.[0]).toEqual(['John Doe']);
  });

  it('clears input after submitting', async () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('John Doe');
    await wrapper.vm.$nextTick();

    const button = wrapper.find('button');
    await button.trigger('click');
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).currentAnswer).toBe('');
  });

  it('shows loading state', () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
        loading: true,
      },
    });

    expect(wrapper.find('.skeleton').exists()).toBe(true);
    expect(wrapper.text()).toContain('Thinking...');
  });

  it('disables input during loading', () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
        loading: true,
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('disabled')).toBeDefined();
  });

  it('applies correct styling to assistant messages', () => {
    const messages: ChatMessage[] = [{ role: 'assistant', content: 'Hello!' }];

    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages,
      },
    });

    const messageDiv = wrapper.find('.bg-primary-50');
    expect(messageDiv.exists()).toBe(true);
  });

  it('applies correct styling to user messages', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello!' }];

    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages,
      },
    });

    const messageDiv = wrapper.find('.bg-gray-50');
    expect(messageDiv.exists()).toBe(true);
  });

  it('does not submit when answer is only whitespace', async () => {
    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages: [],
        currentQuestion: 'What is your name?',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('   ');
    await wrapper.vm.$nextTick();

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('displays multiple messages in order', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: 'Question 1' },
      { role: 'user', content: 'Answer 1' },
      { role: 'assistant', content: 'Question 2' },
      { role: 'user', content: 'Answer 2' },
    ];

    const wrapper = mount(StarInterviewChat, {
      
      global: {
        plugins: [i18n],
        stubs,
      },
      props: {
        messages,
      },
    });

    const text = wrapper.text();
    const q1Index = text.indexOf('Question 1');
    const a1Index = text.indexOf('Answer 1');
    const q2Index = text.indexOf('Question 2');
    const a2Index = text.indexOf('Answer 2');

    expect(q1Index).toBeLessThan(a1Index);
    expect(a1Index).toBeLessThan(q2Index);
    expect(q2Index).toBeLessThan(a2Index);
  });
});
