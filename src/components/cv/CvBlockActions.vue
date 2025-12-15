<template>
  <div class="flex items-center gap-1">
    <UButton
      v-if="showMove && !isFirst"
      icon="i-heroicons-arrow-up"
      size="xs"
      color="gray"
      variant="ghost"
      :aria-label="$t('cvBlockActions.moveUp')"
      @click="emit('move-up')"
    />

    <UButton
      v-if="showMove && !isLast"
      icon="i-heroicons-arrow-down"
      size="xs"
      color="gray"
      variant="ghost"
      :aria-label="$t('cvBlockActions.moveDown')"
      @click="emit('move-down')"
    />

    <UButton
      v-if="showEdit"
      icon="i-heroicons-pencil"
      size="xs"
      color="gray"
      variant="ghost"
      :aria-label="$t('cvBlockActions.edit')"
      @click="emit('edit')"
    />

    <UButton
      v-if="showRegenerate"
      icon="i-heroicons-arrow-path"
      size="xs"
      color="gray"
      variant="ghost"
      :loading="isRegenerating"
      :aria-label="$t('cvBlockActions.regenerate')"
      @click="emit('regenerate')"
    />

    <UButton
      v-if="showRemove"
      icon="i-heroicons-trash"
      size="xs"
      color="red"
      variant="ghost"
      :aria-label="$t('cvBlockActions.remove')"
      @click="handleRemove"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  showMove?: boolean;
  showEdit?: boolean;
  showRegenerate?: boolean;
  showRemove?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isRegenerating?: boolean;
  confirmRemove?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showMove: true,
  showEdit: true,
  showRegenerate: true,
  showRemove: true,
  isFirst: false,
  isLast: false,
  isRegenerating: false,
  confirmRemove: true,
});

const emit = defineEmits<{
  'move-up': [];
  'move-down': [];
  edit: [];
  regenerate: [];
  remove: [];
}>();

const { t } = useI18n();

const handleRemove = () => {
  if (props.confirmRemove) {
    if (confirm(t('cvBlockActions.confirmRemove'))) {
      emit('remove');
    }
  } else {
    emit('remove');
  }
};
</script>
