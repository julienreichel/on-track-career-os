import { AiOperationsRepository } from './AiOperationsRepository';
import type { ParsedCV } from './ParsedCV';
import { isParsedCV } from './ParsedCV';
import type { ExperiencesResult } from './Experience';
import { isExperiencesResult } from './Experience';
import type { STARStory } from './STARStory';
import { isSTARStory } from './STARStory';
import type { AchievementsAndKpis } from './AchievementsAndKpis';
import { isAchievementsAndKpis } from './AchievementsAndKpis';
import type { PersonalCanvas, PersonalCanvasInput } from './PersonalCanvas';
import { isPersonalCanvas } from './PersonalCanvas';
import type { CVBlocksResult, GenerateCvBlocksInput } from './CVBlocks';
import { isCVBlocksResult } from './CVBlocks';
import type { GenerateCvInput, GenerateCvResult } from './types/generateCv';

/**
 * Service for AI-powered CV and experience operations
 *
 * Provides business logic layer between application (composables) and data (repository).
 * Handles validation, error handling, and data transformation.
 */
export class AiOperationsService {
  constructor(private repo = new AiOperationsRepository()) {}

  /**
   * Parse CV text into structured sections with validation
   * @param cvText - Raw CV text content
   * @returns Structured CV data with confidence score
   * @throws Error if parsing fails or validation fails
   */
  async parseCvText(cvText: string): Promise<ParsedCV> {
    // Validate input
    if (!cvText || cvText.trim().length === 0) {
      throw new Error('CV text cannot be empty');
    }

    try {
      const result = await this.repo.parseCvText(cvText);

      // Validate output structure
      if (!isParsedCV(result)) {
        throw new Error('Invalid CV parsing result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to parse CV text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract structured experience data from text blocks with validation
   * @param experienceTextBlocks - Array of experience text sections
   * @returns Structured experience objects
   * @throws Error if extraction fails or validation fails
   */
  async extractExperienceBlocks(experienceTextBlocks: string[]): Promise<ExperiencesResult> {
    // Validate input
    if (!experienceTextBlocks || experienceTextBlocks.length === 0) {
      throw new Error('Experience text blocks cannot be empty');
    }

    if (experienceTextBlocks.some((block) => !block || block.trim().length === 0)) {
      throw new Error('Experience text blocks cannot contain empty strings');
    }

    try {
      const result = await this.repo.extractExperienceBlocks(experienceTextBlocks);

      // Validate output structure
      if (!isExperiencesResult(result)) {
        throw new Error('Invalid experience extraction result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to extract experience blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate STAR stories from experience text with validation
   * @param sourceText - Experience text to convert to STAR format
   * @returns Array of STAR stories (one or more extracted from text)
   * @throws Error if generation fails or validation fails
   */
  async generateStarStory(sourceText: string): Promise<STARStory[]> {
    // Validate input
    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error('Source text cannot be empty');
    }

    try {
      const result = await this.repo.generateStarStory(sourceText);

      // Validate output structure (array of STAR stories)
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Invalid STAR story result: expected non-empty array');
      }

      // Validate each story
      for (const story of result) {
        if (!isSTARStory(story)) {
          throw new Error('Invalid STAR story structure in array');
        }
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate STAR story: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate achievements and KPIs from STAR story with validation
   * @param starStory - STAR story to extract achievements and KPIs from
   * @returns Achievements and KPI suggestions
   * @throws Error if generation fails or validation fails
   */
  async generateAchievementsAndKpis(starStory: STARStory): Promise<AchievementsAndKpis> {
    // Validate input
    if (!isSTARStory(starStory)) {
      throw new Error('Invalid STAR story structure');
    }

    // Check that all STAR story fields have content
    if (
      !starStory.situation?.trim() ||
      !starStory.task?.trim() ||
      !starStory.action?.trim() ||
      !starStory.result?.trim()
    ) {
      throw new Error('All STAR story fields (situation, task, action, result) must be non-empty');
    }

    try {
      const result = await this.repo.generateAchievementsAndKpis(starStory);

      // Validate output structure
      if (!isAchievementsAndKpis(result)) {
        throw new Error('Invalid achievements and KPIs result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate achievements and KPIs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate Personal Business Model Canvas with validation
   * @param input - User profile, experiences, and stories
   * @returns Complete Personal Canvas with all 9 sections
   * @throws Error if generation fails or validation fails
   */
  async generatePersonalCanvas(input: PersonalCanvasInput): Promise<PersonalCanvas> {
    // Validate input structure
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input structure');
    }

    if (!input.profile || typeof input.profile !== 'object') {
      throw new Error('Profile is required');
    }

    if (!Array.isArray(input.experiences)) {
      throw new Error('Experiences must be an array');
    }

    if (!Array.isArray(input.stories)) {
      throw new Error('Stories must be an array');
    }

    try {
      const result = await this.repo.generatePersonalCanvas(input);

      // Validate output structure
      if (!isPersonalCanvas(result)) {
        throw new Error('Invalid Personal Canvas result structure');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate Personal Canvas: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate CV blocks input structure
   * @private
   */
  private validateCvBlocksInput(input: GenerateCvBlocksInput): void {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input structure');
    }

    if (!input.userProfile || typeof input.userProfile !== 'object') {
      throw new Error('User profile is required');
    }

    if (!input.userProfile.fullName?.trim()) {
      throw new Error('User profile must have a fullName');
    }

    if (!Array.isArray(input.selectedExperiences)) {
      throw new Error('Selected experiences must be an array');
    }

    if (input.selectedExperiences.length === 0) {
      throw new Error('At least one experience must be selected');
    }

    // Validate each experience has required fields
    for (const exp of input.selectedExperiences) {
      if (!exp.id || !exp.title || !exp.company) {
        throw new Error('Each experience must have id, title, and company');
      }
    }
  }

  /**
   * Generate tailored CV blocks from user profile and experiences with validation
   * @param input - User profile, experiences, stories, skills, and optional job description
   * @returns Structured CV sections (blocks) ready for rendering
   * @throws Error if generation fails or validation fails
   */
  async generateCvBlocks(input: GenerateCvBlocksInput): Promise<CVBlocksResult> {
    // Validate input
    this.validateCvBlocksInput(input);

    try {
      const result = await this.repo.generateCvBlocks(input);

      // Validate output structure
      if (!isCVBlocksResult(result)) {
        throw new Error('Invalid CV blocks result structure');
      }

      if (result.sections.length === 0) {
        throw new Error('CV generation produced no sections');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate CV blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }



  /**
   * Validate CV input structure
   * @private
   */
  private validateCvInput(input: GenerateCvInput): void {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input structure');
    }

    if (!input.userProfile || typeof input.userProfile !== 'object') {
      throw new Error('User profile is required');
    }

    if (!input.userProfile.fullName?.trim()) {
      throw new Error('User profile must have a fullName');
    }

    if (!Array.isArray(input.selectedExperiences)) {
      throw new Error('Selected experiences must be an array');
    }

    if (input.selectedExperiences.length === 0) {
      throw new Error('At least one experience must be selected');
    }

    // Validate each experience has required fields
    for (const exp of input.selectedExperiences) {
      if (!exp.id || !exp.title || !exp.company) {
        throw new Error('Each experience must have id, title, and company');
      }
    }
  }

  /**
   * Generate complete CV in Markdown format with validation
   * @param input - User profile, experiences, stories, skills, and optional job description
   * @returns CV as plain Markdown text
   * @throws Error if generation fails or validation fails
   */
  async generateCv(input: GenerateCvInput): Promise<GenerateCvResult> {
    // Validate input
    this.validateCvInput(input);

    try {
      const result = await this.repo.generateCv(input);

      // Validate output is a non-empty string
      if (typeof result !== 'string') {
        throw new Error('Invalid CV result: expected string');
      }

      if (!result.trim()) {
        throw new Error('CV generation produced empty markdown');
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Failed to generate CV: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
