import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../../../utils/createTestI18n';
import OnboardingStepCvUpload from '~/components/onboarding/steps/OnboardingStepCvUpload.vue';

const i18n = createTestI18n();

const stubs = {
  UCard: {
    name: 'UCard',
    template: `
      <div class="card">
        <div class="header"><slot name="header" /></div>
        <div class="content"><slot /></div>
      </div>
    `,
  },
  CvUploadStep: {
    name: 'CvUploadStep',
    template:
      '<div class="cv-upload"><button @click="$emit(\'file-selected\', testFile)">Upload</button></div>',
    setup() {
      return {
        testFile: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
      };
    },
  },
  CvParsingStep: {
    name: 'CvParsingStep',
    template: '<div class="cv-parsing">Parsing...</div>',
  },
};

function mountOnboardingStepCvUpload(props: { isProcessing?: boolean } = {}) {
  return mount(OnboardingStepCvUpload, {
    props: {
      isProcessing: false,
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs,
    },
  });
}

describe('OnboardingStepCvUpload', () => {
  describe('Rendering', () => {
    it('renders component', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.exists()).toBe(true);
    });

    it('has space-y-6 spacing class', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.html()).toContain('space-y-6');
    });

    it('renders instruction card', () => {
      const wrapper = mountOnboardingStepCvUpload();
      const cards = wrapper.findAllComponents({ name: 'UCard' });
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Header Content', () => {
    it('displays title in header', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.text()).toContain('Upload your CV');
    });

    it('title has text-lg font-semibold classes', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.html()).toContain('text-lg font-semibold');
    });

    it('displays hint text', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.text()).toContain('Upload a PDF or Word document');
    });

    it('hint has text-sm text-dimmed classes', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.html()).toContain('text-sm text-dimmed');
    });
  });

  describe('CvUploadStep Component', () => {
    it('renders CvUploadStep', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.findComponent({ name: 'CvUploadStep' }).exists()).toBe(true);
    });

    it('emits fileSelected when CvUploadStep emits file-selected', async () => {
      const wrapper = mountOnboardingStepCvUpload();
      const uploadStep = wrapper.findComponent({ name: 'CvUploadStep' });
      const testFile = new File(['test'], 'upload.pdf', { type: 'application/pdf' });

      await uploadStep.vm.$emit('file-selected', testFile);

      expect(wrapper.emitted('fileSelected')).toBeTruthy();
      expect(wrapper.emitted('fileSelected')?.[0]).toEqual([testFile]);
    });

    it('always renders CvUploadStep regardless of processing state', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: true });
      expect(wrapper.findComponent({ name: 'CvUploadStep' }).exists()).toBe(true);
    });
  });

  describe('CvParsingStep Component', () => {
    it('does not render CvParsingStep when not processing', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: false });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(false);
    });

    it('renders CvParsingStep when processing', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: true });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(true);
    });

    it('shows parsing step when isProcessing is true', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: true });
      expect(wrapper.text()).toContain('Parsing');
    });

    it('hides parsing step when isProcessing is false', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: false });
      expect(wrapper.text()).not.toContain('Parsing');
    });
  });

  describe('Props', () => {
    it('accepts isProcessing prop', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: true });
      expect(wrapper.props('isProcessing')).toBe(true);
    });

    it('isProcessing defaults to false', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.props('isProcessing')).toBe(false);
    });

    it('reacts to isProcessing prop changes', async () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: false });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(false);

      await wrapper.setProps({ isProcessing: true });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(true);
    });
  });

  describe('Event Emissions', () => {
    it('emits fileSelected event', async () => {
      const wrapper = mountOnboardingStepCvUpload();
      const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      const uploadStep = wrapper.findComponent({ name: 'CvUploadStep' });

      await uploadStep.vm.$emit('file-selected', file);

      expect(wrapper.emitted()).toHaveProperty('fileSelected');
    });

    it('passes correct file in fileSelected event', async () => {
      const wrapper = mountOnboardingStepCvUpload();
      const file = new File(['data'], 'cv.pdf', { type: 'application/pdf' });
      const uploadStep = wrapper.findComponent({ name: 'CvUploadStep' });

      await uploadStep.vm.$emit('file-selected', file);

      const emitted = wrapper.emitted('fileSelected');
      expect(emitted).toBeTruthy();
      expect(emitted?.[0][0]).toBe(file);
    });

    it('emits fileSelected only once per upload', async () => {
      const wrapper = mountOnboardingStepCvUpload();
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const uploadStep = wrapper.findComponent({ name: 'CvUploadStep' });

      await uploadStep.vm.$emit('file-selected', file);

      expect(wrapper.emitted('fileSelected')?.length).toBe(1);
    });

    it('can emit fileSelected multiple times', async () => {
      const wrapper = mountOnboardingStepCvUpload();
      const uploadStep = wrapper.findComponent({ name: 'CvUploadStep' });
      const file1 = new File(['1'], 'cv1.pdf', { type: 'application/pdf' });
      const file2 = new File(['2'], 'cv2.pdf', { type: 'application/pdf' });

      await uploadStep.vm.$emit('file-selected', file1);
      await uploadStep.vm.$emit('file-selected', file2);

      expect(wrapper.emitted('fileSelected')?.length).toBe(2);
    });
  });

  describe('Component Structure', () => {
    it('wraps content in div with space-y-6', () => {
      const wrapper = mountOnboardingStepCvUpload();
      const root = wrapper.find('.space-y-6');
      expect(root.exists()).toBe(true);
    });

    it('instruction card comes first', () => {
      const wrapper = mountOnboardingStepCvUpload();
      const cards = wrapper.findAllComponents({ name: 'UCard' });
      expect(cards[0].text()).toContain('Upload your CV');
    });

    it('CvUploadStep comes after instruction card', () => {
      const wrapper = mountOnboardingStepCvUpload();
      const html = wrapper.html();
      const cardIndex = html.indexOf('onboarding.steps.cvUpload.title');
      const uploadIndex = html.indexOf('cv-upload');
      expect(uploadIndex).toBeGreaterThan(cardIndex);
    });

    it('CvParsingStep comes last when visible', () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: true });
      const html = wrapper.html();
      const uploadIndex = html.indexOf('cv-upload');
      const parsingIndex = html.indexOf('cv-parsing');
      expect(parsingIndex).toBeGreaterThan(uploadIndex);
    });
  });

  describe('Translation Keys', () => {
    it('uses correct title translation key', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.text()).toContain('Upload your CV');
    });

    it('uses correct hint translation key', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.text()).toContain('Upload a PDF or Word document');
    });
  });

  describe('Edge Cases', () => {
    it('handles toggling isProcessing multiple times', async () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: false });

      await wrapper.setProps({ isProcessing: true });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(true);

      await wrapper.setProps({ isProcessing: false });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(false);

      await wrapper.setProps({ isProcessing: true });
      expect(wrapper.findComponent({ name: 'CvParsingStep' }).exists()).toBe(true);
    });

    it('handles file selection during processing', async () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: true });
      const file = new File(['test'], 'file.pdf', { type: 'application/pdf' });
      const uploadStep = wrapper.findComponent({ name: 'CvUploadStep' });

      await uploadStep.vm.$emit('file-selected', file);

      expect(wrapper.emitted('fileSelected')).toBeTruthy();
    });

    it('maintains upload component during processing', async () => {
      const wrapper = mountOnboardingStepCvUpload({ isProcessing: false });
      const uploadBefore = wrapper.findComponent({ name: 'CvUploadStep' });
      expect(uploadBefore.exists()).toBe(true);

      await wrapper.setProps({ isProcessing: true });
      const uploadAfter = wrapper.findComponent({ name: 'CvUploadStep' });
      expect(uploadAfter.exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has semantic heading for title', () => {
      const wrapper = mountOnboardingStepCvUpload();
      expect(wrapper.html()).toContain('<h2');
    });

    it('provides descriptive hint text', () => {
      const wrapper = mountOnboardingStepCvUpload();
      const hint = wrapper.find('.text-dimmed');
      expect(hint.exists()).toBe(true);
    });
  });
});
