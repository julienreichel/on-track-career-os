export const buildAbsoluteUrl = (baseUrl: string, path: string) => {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!trimmedBase) {
    return normalizedPath;
  }

  return `${trimmedBase}${normalizedPath}`;
};
