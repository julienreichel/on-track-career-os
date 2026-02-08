import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import JobNewPage from '@/pages/jobs/new.vue';
import { createTestI18n } from '../../../utils/createTestI18n';

const selectedFile = ref<File | null>(null);
const errorMessage = ref<string | null>(null);
const isProcessing = ref(false);
const statusMessage = ref<string | null>(null);
const mockHandleFileSelected = vi.fn();
const mockHandleTextSubmitted = vi.fn();
const mockReset = vi.fn();
const toastAdd = vi.fn();

vi.mock('@/composables/useJobUpload', () => ({
  useJobUpload: () => ({
    selectedFile,
    errorMessage,
    isProcessing,
    statusMessage,
    handleFileSelected: mockHandleFileSelected,
    handleTextSubmitted: mockHandleTextSubmitted,
    reset: mockReset,
  }),
}));

vi.mock('#app', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

vi.mock('#imports', () => ({
  useToast: () => ({
    add: toastAdd,
  }),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/jobs/new', component: JobNewPage },
    { path: '/jobs', component: { template: '<div>Jobs List</div>' } },
  ],
});

const i18n = createTestI18n();

const JobUploadStepStub = {
  name: 'JobUploadStep',
  props: ['selectedFile', 'isProcessing', 'statusMessage'],
  emits: ['fileSelected'],
  template: `
    <div class="job-upload-step-stub">
      <button class="upload-trigger" @click="$emit('fileSelected', { name: 'sample.txt' })">
        Upload
      </button>
    </div>
  `,
};

const stubs = {
  UPage: { template: '<div class="u-page"><slot /></div>' },
  UPageHeader: {
    props: ['title', 'description'],
    template: '<header class="u-page-header"><h1>{{ title }}</h1><p>{{ description }}</p></header>',
  },
  UPageBody: { template: '<div class="u-page-body"><slot /></div>' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }} {{ description }}<slot /></div>',
  },
  UCard: { template: '<div class="u-card"><slot /><slot name="footer" /></div>' },
  USeparator: {
    props: ['label'],
    template: '<div class="u-separator">{{ label }}</div>',
  },
  UFormField: {
    props: ['label', 'description'],
    template:
      '<div class="u-form-field"><label>{{ label }}</label><p>{{ description }}</p><slot /></div>',
  },
  UTextarea: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<textarea class="u-textarea" :value="modelValue" @input="onInput" />',
    setup(props: any, { emit }: any) {
      const onInput = (event: Event) => {
        emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
      };
      return { onInput };
    },
  },
  UButton: {
    props: ['disabled'],
    template:
      '<button class="u-button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  JobUploadStep: JobUploadStepStub,
};

async function mountPage() {
  if (router.currentRoute.value.path !== '/jobs/new') {
    await router.push('/jobs/new');
  }
  await router.isReady();

  return mount(JobNewPage, {
    global: {
      plugins: [i18n, router],
      stubs,
    },
  });
}

describe('Job Upload Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectedFile.value = null;
    errorMessage.value = null;
    isProcessing.value = false;
    statusMessage.value = null;
    toastAdd.mockClear();
  });

  it('renders header and upload component', async () => {
    const wrapper = await mountPage();
    const header = wrapper.find('.u-page-header');
    expect(header.text()).toContain(i18n.global.t('jobs.form.createTitle'));
    expect(wrapper.findComponent(JobUploadStepStub).exists()).toBe(true);
  });

  it('notifies via toast when errorMessage is set', async () => {
    errorMessage.value = 'Upload failed';
    const wrapper = await mountPage();
    expect(wrapper.find('.u-alert').exists()).toBe(false);
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: i18n.global.t('jobs.form.errors.generic'),
        description: 'Upload failed',
        color: 'error',
      })
    );
    expect(mockReset).toHaveBeenCalled();
  });

  it('forwards file selection events to the composable handler', async () => {
    const wrapper = await mountPage();
    await wrapper.find('.upload-trigger').trigger('click');
    expect(mockHandleFileSelected).toHaveBeenCalledWith({ name: 'sample.txt' });
  });

  it('submits pasted text to the composable handler', async () => {
    const wrapper = await mountPage();
    const textArea = wrapper.find('.u-textarea');
    await textArea.setValue('Pasted job description');
    await wrapper.find('.u-button').trigger('click');

    expect(mockHandleTextSubmitted).toHaveBeenCalledWith('Pasted job description');
  });
});
