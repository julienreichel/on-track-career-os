const isTestEnvironment =
  (typeof process !== 'undefined' && process.env.VITEST === 'true') ||
  (typeof import.meta !== 'undefined' && (import.meta as { vitest?: boolean }).vitest === true);

export default defineNuxtPlugin({
  name: 'AmplifyAuthRedirect',
  enforce: 'pre',
  setup() {
    if (isTestEnvironment) {
      return;
    }

    addRouteMiddleware(
      'AmplifyAuthMiddleware',
      defineNuxtRouteMiddleware(async (to) => {
        try {
          const session = await useNuxtApp().$Amplify.Auth.fetchAuthSession();

          // If the request is not associated with a valid user session
          // redirect to the `/login` route.
          const whiteList = ['/login'];
          if (session.tokens === undefined && !whiteList.includes(to.path)) {
            return navigateTo('/login');
          }

          if (session.tokens !== undefined) {
            if (to.path === '/login') {
              return navigateTo('/');
            }
          }
        } catch (e) {
          console.error(e);
          if (to.path !== '/login') {
            return navigateTo('/login');
          }
        }
      }),
      { global: true }
    );
  },
});
