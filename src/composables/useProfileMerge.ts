import { logWarn } from '@/utils/logError';
import { UserProfileRepository } from '@/domain/user-profile/UserProfileRepository';
import type { ParseCvTextOutput } from '@amplify/data/ai-operations/parseCvText';
import type { ParsedCV } from '@/domain/ai-operations/ParsedCV';

/**
 * Composable for merging CV profile data with existing user profile
 * Handles deduplication and merging of array fields
 */
export function useProfileMerge() {
  const userProfileRepo = new UserProfileRepository();

  /**
   * Helper to merge arrays without duplicates
   * Filters out null values and removes duplicates
   */
  function mergeArrays<T = string>(
    existing: (T | null)[] | null | undefined,
    incoming: (T | null)[] | T[] | undefined
  ): T[] {
    const existingFiltered = (existing || []).filter((item): item is T => item !== null);
    const incomingFiltered = (incoming || []).filter((item): item is T => item !== null);
    const resultSet = new Set<T>(existingFiltered);
    incomingFiltered.forEach((item) => resultSet.add(item));
    return Array.from(resultSet);
  }

  /**
   * Update user profile with extracted CV data
   */
  async function mergeProfile(
    userId: string,
    profile: ParseCvTextOutput['profile'],
    _parsedCv: ParsedCV | null
  ): Promise<void> {
    // Get existing profile
    const existingProfile = await userProfileRepo.get(userId);

    if (!existingProfile) {
      logWarn('User profile not found, skipping profile update');
      return;
    }

    // Prepare update with merged data
    const updateData: Record<string, unknown> = {
      id: userId,
    };

    // Only update fields that have new data
    if (profile.fullName && !existingProfile.fullName) {
      updateData.fullName = profile.fullName;
    }
    if (profile.headline) {
      updateData.headline = profile.headline || existingProfile.headline;
    }
    if (profile.location) {
      updateData.location = profile.location || existingProfile.location;
    }
    if (profile.seniorityLevel) {
      updateData.seniorityLevel = profile.seniorityLevel || existingProfile.seniorityLevel;
    }
    if (profile.primaryEmail && !existingProfile.primaryEmail) {
      updateData.primaryEmail = profile.primaryEmail;
    }
    if (profile.primaryPhone && !existingProfile.primaryPhone) {
      updateData.primaryPhone = profile.primaryPhone;
    }
    if (profile.workPermitInfo && !existingProfile.workPermitInfo) {
      updateData.workPermitInfo = profile.workPermitInfo;
    }

    // Merge arrays
    updateData.aspirations = mergeArrays(existingProfile.aspirations, profile.aspirations);
    updateData.personalValues = mergeArrays(existingProfile.personalValues, profile.personalValues);
    updateData.strengths = mergeArrays(existingProfile.strengths, profile.strengths);
    updateData.interests = mergeArrays(existingProfile.interests, profile.interests);
    updateData.languages = mergeArrays(existingProfile.languages, profile.languages);
    updateData.socialLinks = mergeArrays(existingProfile.socialLinks, profile.socialLinks);

    updateData.skills = mergeArrays(existingProfile.skills, profile.skills);
    updateData.certifications = mergeArrays(existingProfile.certifications, profile.certifications);

    await userProfileRepo.update(updateData as never);
  }

  return {
    mergeProfile,
  };
}
