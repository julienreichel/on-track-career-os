<template>
  <UPage>
    <UPageBody>
      <section class="py-12 md:py-16">
        <div class="max-w-2xl space-y-6">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {{ t('landing.hero.eyebrow') }}
          </p>
          <h1 data-testid="landing-hero" class="text-3xl font-semibold tracking-tight sm:text-4xl">
            {{ t('landing.hero.title') }}
          </h1>
          <p class="text-base text-dimmed">
            {{ t('landing.hero.description') }}
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              data-testid="landing-cta-signup"
              color="primary"
              size="lg"
              :to="{ path: '/login', query: { mode: 'signup' } }"
              :label="t('landing.hero.ctaPrimary')"
            />
            <UButton
              data-testid="landing-cta-signin"
              color="neutral"
              variant="outline"
              size="lg"
              :to="{ path: '/login', query: { mode: 'signin' } }"
              :label="t('landing.hero.ctaSecondary')"
            />
          </div>
        </div>
      </section>

      <section class="grid gap-6 md:grid-cols-3">
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold">{{ t('landing.features.clarity.title') }}</h2>
            <p class="text-sm text-dimmed">
              {{ t('landing.features.clarity.description') }}
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold">{{ t('landing.features.materials.title') }}</h2>
            <p class="text-sm text-dimmed">
              {{ t('landing.features.materials.description') }}
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="space-y-2">
            <h2 class="text-lg font-semibold">{{ t('landing.features.momentum.title') }}</h2>
            <p class="text-sm text-dimmed">
              {{ t('landing.features.momentum.description') }}
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
import { useI18n } from 'vue-i18n';

definePageMeta({
  layout: 'public',
  middleware: ['landing-redirect-client'],
});

const route = useRoute();
const { t } = useI18n();
const { siteName, baseUrl, ogImage, titleTemplate } = useSeoMetaDefaults();

const title = t('landing.seo.title');
const description = t('landing.seo.description');
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
