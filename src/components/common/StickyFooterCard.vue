<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    footerClass?: string;
    cardClass?: string;
  }>(),
  {
    footerClass: 'flex justify-end gap-2',
    cardClass: '',
  }
);
</script>

<template>
  <UCard class="sticky bottom-0 z-10" :class="props.cardClass">
    <template #footer>
      <div :class="props.footerClass">
        <slot />
      </div>
    </template>
  </UCard>
</template>
