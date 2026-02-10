export const PUBLIC_ROUTES = ['/', '/login', '/eula', '/privacy'];
export const AUTHENTICATED_HOME = '/home';

const PUBLIC_ROUTE_PREFIXES = [
  '/password-reset',
  '/reset-password',
  '/forgot-password',
];

export const isPublicRoute = (path: string) => {
  if (PUBLIC_ROUTES.includes(path)) {
    return true;
  }

  return PUBLIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
};

type AuthRedirectArgs = {
  path: string;
  isAuthenticated: boolean;
};

export const resolveAuthRedirect = ({ path, isAuthenticated }: AuthRedirectArgs) => {
  if (!isAuthenticated && !isPublicRoute(path)) {
    return '/login';
  }

  if (isAuthenticated && path === '/login') {
    return AUTHENTICATED_HOME;
  }

  return null;
};
