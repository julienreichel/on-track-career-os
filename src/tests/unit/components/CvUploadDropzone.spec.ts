import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CvUploadDropzone from '@/components/CvUploadDropzone.vue';

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'cvUpload.title': 'Upload Your CV',
        'cvUpload.description':
          'Upload your CV to extract your professional experience automatically.',
        'cvUpload.dropzoneText': 'Drop your CV here or click to browse',
        'cvUpload.dropzoneHint': 'Supports PDF and TXT files (max 5MB)',
        'cvUpload.fileUploaded': `File uploaded: ${params?.fileName || ''}`,
        'cvUpload.errors.invalidFileType': 'Invalid file type',
        'cvUpload.errors.fileTooLarge': 'File is too large',
        'cvUpload.errors.noTextExtracted': 'No text could be extracted',
        'cvUpload.errors.fileReadError': 'Error reading file',
        'cvUpload.errors.unknown': 'An unknown error occurred',
      };
      return translations[key] || key;
    },
  }),
}));

describe('CvUploadDropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload UI', () => {
    const wrapper = mount(CvUploadDropzone);

    expect(wrapper.find('h3').text()).toBe('Upload Your CV');
    expect(wrapper.html()).toContain('Drop your CV here or click to browse');
  });

  it('emits upload event with extracted text on successful file upload', async () => {
    const wrapper = mount(CvUploadDropzone);
    const testText = 'CV Content\nSenior Developer\nCompany Name';

    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      result: testText,
    };

    global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

    const file = new File([testText], 'test-cv.txt', { type: 'text/plain' });

    // Trigger file change
    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    const uploadPromise = component.handleFileSelect([file]);

    // Simulate FileReader success
    if (mockFileReader.onload) {
      mockFileReader.onload.call(
        mockFileReader as unknown as FileReader,
        {} as ProgressEvent<FileReader>
      );
    }

    await uploadPromise;

    expect(wrapper.emitted('upload')).toBeTruthy();
    expect(wrapper.emitted('upload')?.[0]).toEqual([testText]);
  });

  it('emits error event for invalid file type', async () => {
    const wrapper = mount(CvUploadDropzone);

    const file = new File(['content'], 'test.doc', { type: 'application/msword' });

    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    await component.handleFileSelect([file]);

    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')?.[0][0]).toContain('Invalid file type');
  });

  it('emits error event for file too large', async () => {
    const wrapper = mount(CvUploadDropzone);

    // Create a file larger than 5MB
    const largeSize = 6 * 1024 * 1024; // 6MB
    const file = new File(['x'.repeat(largeSize)], 'large-cv.pdf', { type: 'application/pdf' });

    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    await component.handleFileSelect([file]);

    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')?.[0][0]).toContain('File is too large');
  });

  it('emits error event when no text extracted', async () => {
    const wrapper = mount(CvUploadDropzone);

    // Mock FileReader with empty result
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      result: '',
    };

    global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

    const file = new File([''], 'empty-cv.txt', { type: 'text/plain' });

    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    const uploadPromise = component.handleFileSelect([file]);

    // Simulate FileReader success with empty result
    if (mockFileReader.onload) {
      mockFileReader.onload.call(
        mockFileReader as unknown as FileReader,
        {} as ProgressEvent<FileReader>
      );
    }

    await uploadPromise;

    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')?.[0][0]).toContain('No text could be extracted');
  });

  it('emits error event on FileReader error', async () => {
    const wrapper = mount(CvUploadDropzone);

    // Mock FileReader with error
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      result: null,
    };

    global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

    const file = new File(['content'], 'test-cv.txt', { type: 'text/plain' });

    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    const uploadPromise = component.handleFileSelect([file]);

    // Simulate FileReader error
    if (mockFileReader.onerror) {
      mockFileReader.onerror.call(
        mockFileReader as unknown as FileReader,
        {} as ProgressEvent<FileReader>
      );
    }

    await uploadPromise;

    expect(wrapper.emitted('error')).toBeTruthy();
    expect(wrapper.emitted('error')?.[0][0]).toContain('Error reading file');
  });

  it('displays success message after upload', async () => {
    const wrapper = mount(CvUploadDropzone);
    const testText = 'CV Content';

    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
      result: testText,
    };

    global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

    const file = new File([testText], 'my-cv.txt', { type: 'text/plain' });

    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    const uploadPromise = component.handleFileSelect([file]);

    // Simulate FileReader success
    if (mockFileReader.onload) {
      mockFileReader.onload.call(
        mockFileReader as unknown as FileReader,
        {} as ProgressEvent<FileReader>
      );
    }

    await uploadPromise;
    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain('File uploaded: my-cv.txt');
  });

  it('handles empty file array gracefully', async () => {
    const wrapper = mount(CvUploadDropzone);

    const component = wrapper.vm as {
      handleFileSelect: (files: File[]) => Promise<void>;
    };
    await component.handleFileSelect([]);

    expect(wrapper.emitted('upload')).toBeFalsy();
    expect(wrapper.emitted('error')).toBeFalsy();
  });
});
