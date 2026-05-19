<script setup lang="ts">
import type { GroupSettings } from '@/features/groups/api/groups.api'
import { groupSettingOptions, type GroupSettingKey } from '@/features/groups/lib/group-form-options'
import GroupModuleSwitch from './GroupModuleSwitch.vue'

const props = withDefaults(defineProps<{
  modelValue: GroupSettings
  showScheduleSubmodules?: boolean
  titleId?: string
}>(), {
  showScheduleSubmodules: false,
  titleId: 'group-modules-title'
})

const emit = defineEmits<{
  'update:modelValue': [value: GroupSettings]
}>()

function updateSetting(key: GroupSettingKey, value: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<template>
  <section class="group-modules" :aria-labelledby="titleId">
    <h2 :id="titleId">Разделы</h2>
    <div class="group-modules__grid">
      <GroupModuleSwitch
        v-for="option in groupSettingOptions"
        :key="option.key"
        :model-value="modelValue[option.key]"
        :name="option.key"
        :label="option.label"
        @update:model-value="updateSetting(option.key, $event)"
      />
    </div>
    <div v-if="showScheduleSubmodules && modelValue.scheduleEnabled" class="group-modules__schedule">
      <h3>Расписание</h3>
      <GroupModuleSwitch
        :model-value="modelValue.scheduleWeeklyEnabled"
        name="scheduleWeeklyEnabled"
        label="Еженедельные события"
        @update:model-value="updateSetting('scheduleWeeklyEnabled', $event)"
      />
      <GroupModuleSwitch
        :model-value="modelValue.scheduleSpecialEnabled"
        name="scheduleSpecialEnabled"
        label="Особые события"
        @update:model-value="updateSetting('scheduleSpecialEnabled', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.group-modules {
  display: grid;
  gap: 14px;
}

.group-modules h2 {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.group-modules__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.group-modules__schedule {
  border-left: 3px solid var(--color-primary);
  display: grid;
  gap: 12px;
  padding-left: 16px;
}

.group-modules__schedule h3 {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .group-modules__grid {
    grid-template-columns: 1fr;
  }
}
</style>
