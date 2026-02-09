import { describe, it, expect } from 'vitest';
import { isPublicRoute, resolveAuthRedirect, AUTHENTICATED_HOME } from '@/utils/authRouting';

describe('authRouting', () => {
  it('marks public routes correctly', () => {
    expect(isPublicRoute('/')).toBe(true);
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/password-reset/abc')).toBe(true);
    expect(isPublicRoute('/reset-password')).toBe(true);
    expect(isPublicRoute('/forgot-password/request')).toBe(true);
    expect(isPublicRoute('/home')).toBe(false);
    expect(isPublicRoute('/jobs')).toBe(false);
  });

  it('redirects anonymous users away from protected routes', () => {
    expect(
      resolveAuthRedirect({
        path: '/jobs',
        isAuthenticated: false,
      })
    ).toBe('/login');
  });

  it('allows anonymous users on public routes', () => {
    expect(
      resolveAuthRedirect({
        path: '/',
        isAuthenticated: false,
      })
    ).toBeNull();
  });

  it('redirects authenticated users away from login', () => {
    expect(
      resolveAuthRedirect({
        path: '/login',
        isAuthenticated: true,
      })
    ).toBe(AUTHENTICATED_HOME);
  });
});
