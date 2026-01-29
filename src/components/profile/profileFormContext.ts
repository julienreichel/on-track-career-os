import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { ProfileForm } from './types';

export interface ProfileFormContext {
  form: Ref<ProfileForm>;
  isEditing: Ref<boolean>;
  editingSection: Ref<string | null>;
  sectionEditingEnabled: ComputedRef<boolean>;
  loading: Ref<boolean>;
  hasValidationErrors: ComputedRef<boolean>;
  photoPreviewUrl: Ref<string | null>;
  uploadingPhoto: Ref<boolean>;
  photoError: Ref<string | null>;
  photoInputRef: Ref<HTMLInputElement | null>;
  hasCoreIdentity: ComputedRef<boolean>;
  hasWorkPermit: ComputedRef<boolean>;
  hasContactInfo: ComputedRef<boolean>;
  hasSocialLinks: ComputedRef<boolean>;
  hasCareerDirection: ComputedRef<boolean>;
  hasIdentityValues: ComputedRef<boolean>;
  hasProfessionalAttributes: ComputedRef<boolean>;
  emailError: ComputedRef<string | undefined>;
  phoneError: ComputedRef<string | undefined>;
  startSectionEditing: (section: string) => void;
  cancelSectionEditing: () => void;
  saveSectionEditing: () => Promise<void>;
  triggerPhotoPicker: () => void;
  handlePhotoSelected: (event: Event) => Promise<void>;
  handleRemovePhoto: () => Promise<void>;
  formatSocialLink: (link: string) => string;
}

export const profileFormContextKey: InjectionKey<ProfileFormContext> = Symbol('ProfileForm');
