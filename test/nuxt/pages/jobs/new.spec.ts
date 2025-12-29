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
const mockReset = vi.fn();

vi.mock('@/composables/useJobUpload', () => ({
  useJobUpload: () => ({
    selectedFile,
    errorMessage,
    isProcessing,
    statusMessage,
    handleFileSelected: mockHandleFileSelected,
    reset: mockReset,
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
  UContainer: { template: '<div class="u-container"><slot /></div>' },
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
  });

  it('renders header and upload component', async () => {
    const wrapper = await mountPage();
    const header = wrapper.find('.u-page-header');
    expect(header.text()).toContain(i18n.global.t('jobUpload.title'));
    expect(wrapper.findComponent(JobUploadStepStub).exists()).toBe(true);
  });

  it('displays error alert when errorMessage is set', async () => {
    errorMessage.value = 'Upload failed';
    const wrapper = await mountPage();
    expect(wrapper.find('.u-alert').text()).toContain('Upload failed');
  });

  it('forwards file selection events to the composable handler', async () => {
    const wrapper = await mountPage();
    await wrapper.find('.upload-trigger').trigger('click');
    expect(mockHandleFileSelected).toHaveBeenCalledWith({ name: 'sample.txt' });
  });
});
