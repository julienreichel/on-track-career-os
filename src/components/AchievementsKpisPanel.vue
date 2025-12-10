<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  achievements: string[];
  kpis: string[];
  generating?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:achievements': [achievements: string[]];
  'update:kpis': [kpis: string[]];
  regenerate: [];
}>();

const { t } = useI18n();
const newAchievement = ref('');
const newKpi = ref('');

const addAchievement = () => {
  if (!newAchievement.value.trim()) return;
  emit('update:achievements', [...props.achievements, newAchievement.value.trim()]);
  newAchievement.value = '';
};

const removeAchievement = (index: number) => {
  const updated = [...props.achievements];
  updated.splice(index, 1);
  emit('update:achievements', updated);
};

const updateAchievement = (index: number, value: string) => {
  const updated = [...props.achievements];
  updated[index] = value;
  emit('update:achievements', updated);
};

const addKpi = () => {
  if (!newKpi.value.trim()) return;
  emit('update:kpis', [...props.kpis, newKpi.value.trim()]);
  newKpi.value = '';
};

const removeKpi = (index: number) => {
  const updated = [...props.kpis];
  updated.splice(index, 1);
  emit('update:kpis', updated);
};

const updateKpi = (index: number, value: string) => {
  const updated = [...props.kpis];
  updated[index] = value;
  emit('update:kpis', updated);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ t('enhancer.title') }}</h3>
      <UButton
        v-if="!readonly"
        :label="t('enhancer.regenerate')"
        icon="i-heroicons-arrow-path"
        variant="ghost"
        size="sm"
        :loading="generating"
        @click="emit('regenerate')"
      />
    </div>

    <!-- Achievements Section -->
    <div class="space-y-3">
      <div class="flex items-center space-x-2">
        <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-primary-500" />
        <h4 class="font-medium">{{ t('enhancer.achievements') }}</h4>
      </div>

      <div v-if="achievements.length === 0" class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('enhancer.noAchievements') }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(achievement, index) in achievements"
          :key="`achievement-${index}`"
          class="flex items-start space-x-2"
        >
          <UInput
            :model-value="achievement"
            :readonly="readonly"
            class="flex-1"
            @update:model-value="updateAchievement(index, $event)"
          />
          <UButton
            v-if="!readonly"
            icon="i-heroicons-trash"
            variant="ghost"
            color="red"
            size="sm"
            @click="removeAchievement(index)"
          />
        </div>
      </div>

      <div v-if="!readonly" class="flex space-x-2">
        <UInput
          v-model="newAchievement"
          :placeholder="t('enhancer.addAchievementPlaceholder')"
          class="flex-1"
          @keyup.enter="addAchievement"
        />
        <UButton
          icon="i-heroicons-plus"
          :disabled="!newAchievement.trim()"
          @click="addAchievement"
        />
      </div>
    </div>

    <!-- KPIs Section -->
    <div class="space-y-3">
      <div class="flex items-center space-x-2">
        <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-primary-500" />
        <h4 class="font-medium">{{ t('enhancer.kpis') }}</h4>
      </div>

      <div v-if="kpis.length === 0" class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('enhancer.noKpis') }}
      </div>

      <div v-else class="space-y-2">
        <div v-for="(kpi, index) in kpis" :key="`kpi-${index}`" class="flex items-start space-x-2">
          <UInput
            :model-value="kpi"
            :readonly="readonly"
            class="flex-1"
            @update:model-value="updateKpi(index, $event)"
          />
          <UButton
            v-if="!readonly"
            icon="i-heroicons-trash"
            variant="ghost"
            color="red"
            size="sm"
            @click="removeKpi(index)"
          />
        </div>
      </div>

      <div v-if="!readonly" class="flex space-x-2">
        <UInput
          v-model="newKpi"
          :placeholder="t('enhancer.addKpiPlaceholder')"
          class="flex-1"
          @keyup.enter="addKpi"
        />
        <UButton icon="i-heroicons-plus" :disabled="!newKpi.trim()" @click="addKpi" />
      </div>
    </div>
  </div>
</template>
