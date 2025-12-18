import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostConfirmationTriggerEvent } from 'aws-lambda';

// Mock AWS Amplify and dependencies
vi.mock('$amplify/env/post-confirmation', () => ({
  env: {
    // Mock environment variables
  },
}));

vi.mock('@aws-amplify/backend/function/runtime', () => ({
  getAmplifyDataClientConfig: vi.fn(() => ({
    resourceConfig: {},
    libraryOptions: {},
  })),
}));

vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
}));

const mockCreate = vi.fn();
vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => ({
    models: {
      UserProfile: {
        create: mockCreate,
      },
    },
  })),
}));

describe('post-confirmation handler', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('@amplify/auth/post-confirmation/handler');
    handler = module.handler;
  });

  const createEvent = (
    attributes: Partial<PostConfirmationTriggerEvent['request']['userAttributes']>
  ): PostConfirmationTriggerEvent => ({
    version: '1',
    region: 'us-east-1',
    userPoolId: 'test-pool',
    userName: 'test-user',
    callerContext: {
      awsSdkVersion: '1.0.0',
      clientId: 'test-client',
    },
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: 'test-user-id',
        email: 'test@example.com',
        email_verified: 'true',
        ...attributes,
      },
    },
    response: {},
  });

  describe('successful user profile creation', () => {
    it('should create UserProfile with email when fullname is missing', async () => {
      mockCreate.mockResolvedValueOnce({ data: { id: 'test-user-id' } });

      const event = createEvent({
        sub: 'user-123',
        email: 'john@example.com',
      });

      const result = await handler(event);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          fullName: 'john@example.com',
          owner: 'user-123::user-123',
          primaryEmail: 'john@example.com',
        })
      );
      expect(result).toEqual(event);
    });

    it('should create UserProfile with fullname when provided', async () => {
      mockCreate.mockResolvedValueOnce({ data: { id: 'test-user-id' } });

      const event = createEvent({
        sub: 'user-456',
        email: 'jane@example.com',
        fullname: 'Jane Doe',
      });

      const result = await handler(event);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-456',
          fullName: 'Jane Doe',
          owner: 'user-456::user-456',
          primaryEmail: 'jane@example.com',
        })
      );
      expect(result).toEqual(event);
    });

    it('should trim whitespace from fullname', async () => {
      mockCreate.mockResolvedValueOnce({ data: { id: 'test-user-id' } });

      const event = createEvent({
        sub: 'user-789',
        email: 'test@example.com',
        fullname: '  Spaced Name  ',
      });

      const result = await handler(event);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-789',
          fullName: 'Spaced Name',
          owner: 'user-789::user-789',
          primaryEmail: 'test@example.com',
        })
      );
      expect(result).toEqual(event);
    });

    it('should persist primary phone when provided', async () => {
      mockCreate.mockResolvedValueOnce({ data: { id: 'test-user-id' } });

      const event = createEvent({
        sub: 'user-phone',
        email: 'phone@example.com',
        phone_number: '+12025550123',
      });

      await handler(event);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-phone',
          primaryPhone: '+12025550123',
          primaryEmail: 'phone@example.com',
        })
      );
    });

    it('should fallback to email when fullname is empty after trimming', async () => {
      mockCreate.mockResolvedValueOnce({ data: { id: 'test-user-id' } });

      const event = createEvent({
        sub: 'user-999',
        email: 'fallback@example.com',
        fullname: '   ',
      });

      const result = await handler(event);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-999',
          fullName: 'fallback@example.com',
          owner: 'user-999::user-999',
          primaryEmail: 'fallback@example.com',
        })
      );
      expect(result).toEqual(event);
    });

    it('should handle creation errors gracefully and return event', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockCreate.mockRejectedValueOnce(new Error('Database error'));

      const event = createEvent({
        sub: 'user-error',
        email: 'error@example.com',
      });

      const result = await handler(event);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(result).toEqual(event);

      consoleLogSpy.mockRestore();
    });
  });

  describe('validation errors', () => {
    it('should throw error when email is missing', async () => {
      const event = createEvent({
        sub: 'user-no-email',
        email: undefined as any,
      });

      await expect(handler(event)).rejects.toThrow('Missing required user attribute: email');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should throw error when sub (id) is missing', async () => {
      const event = createEvent({
        sub: undefined as any,
        email: 'test@example.com',
      });

      await expect(handler(event)).rejects.toThrow('Missing required user attribute: sub (id)');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should throw error when both email and sub are missing', async () => {
      const event = createEvent({
        sub: undefined as any,
        email: undefined as any,
      });

      // Should throw on email check first
      await expect(handler(event)).rejects.toThrow('Missing required user attribute: email');
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('owner field format', () => {
    it('should format owner field correctly as "id::id"', async () => {
      mockCreate.mockResolvedValueOnce({ data: { id: 'test-user-id' } });

      const event = createEvent({
        sub: 'abc-123-xyz',
        email: 'owner@example.com',
      });

      await handler(event);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'abc-123-xyz::abc-123-xyz',
          primaryEmail: 'owner@example.com',
        })
      );
    });
  });
});
