<template>
  <UPage>
    <UPageBody>
      <section class="py-12 md:py-16">
        <div class="max-w-2xl space-y-6">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Career clarity, faster
          </p>
          <h1 data-testid="landing-hero" class="text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn your experience into a focused job search in days, not months.
          </h1>
          <p class="text-base text-dimmed">
            On Track Career helps you map your strengths, target roles, and build the materials you need
            to apply with confidence.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              data-testid="landing-cta-signup"
              color="primary"
              size="lg"
              :to="{ path: '/login', query: { mode: 'signup' } }"
              label="Create account"
            />
            <UButton
              data-testid="landing-cta-signin"
              color="neutral"
              variant="outline"
              size="lg"
              :to="{ path: '/login', query: { mode: 'signin' } }"
              label="Sign in"
            />
          </div>
        </div>
      </section>

      <section class="grid gap-6 md:grid-cols-3">
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold">Clarify your direction</h2>
            <p class="text-sm text-dimmed">
              Define the roles you want and the narrative that makes your experience stand out.
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold">Generate ready-to-send materials</h2>
            <p class="text-sm text-dimmed">
              Produce tailored resumes, cover letters, and stories that match each opportunity.
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold">Stay momentum-focused</h2>
            <p class="text-sm text-dimmed">
              Track progress, unlock next steps, and keep the job search moving forward.
            </p>
          </div>
        </UCard>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { useSeoMetaDefaults } from '@/composables/useSeoMetaDefaults';
import { buildAbsoluteUrl } from '@/utils/url';

definePageMeta({
  layout: 'public',
  middleware: ['landing-redirect-client'],
});

const route = useRoute();
const { siteName, baseUrl, ogImage, titleTemplate } = useSeoMetaDefaults();

const title = 'AI Career Coach for Focused Job Search';
const description =
  'Clarify your career direction, target the right roles, and generate tailored materials with guided AI support.';
const canonicalUrl = buildAbsoluteUrl(baseUrl, route.path);
const ogImageUrl = buildAbsoluteUrl(baseUrl, ogImage);

useHead({
  titleTemplate,
  link: [{ rel: 'canonical', href: canonicalUrl }],
});

useSeoMeta({
  title,
  description,
  ogTitle: `${title} | ${siteName}`,
  ogDescription: description,
  ogType: 'website',
  ogImage: ogImageUrl,
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: `${title} | ${siteName}`,
  twitterDescription: description,
  twitterImage: ogImageUrl,
});
</script>
