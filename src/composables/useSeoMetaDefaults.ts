export const useSeoMetaDefaults = () => {
  const runtimeConfig = useRuntimeConfig();
  const siteName = 'On Track Career';
  const baseUrl = String(runtimeConfig.public.siteUrl || '').trim();
  const defaultDescription =
    'An AI-guided career platform to clarify your direction, build standout materials, and keep your job search on track.';
  const ogImage = '/social-preview.svg';

  const titleTemplate = (titleChunk?: string) =>
    titleChunk ? `${titleChunk} · ${siteName}` : siteName;

  return {
    siteName,
    baseUrl,
    defaultDescription,
    ogImage,
    titleTemplate,
  };
};
