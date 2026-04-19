<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GroupModuleBadges from '../../features/groups/components/GroupModuleBadges.vue'
import { getGroupsErrorMessage, type GroupAccessMode } from '../../features/groups/api/groups.api'
import {
  useDeleteGroupMutation,
  useUpdateGroupMutation,
  useUpdateGroupSettingsMutation,
} from '../../features/groups/composables/useGroups'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import {
  getEnabledGroupModules,
  groupAccessModeDescriptions,
  groupAccessModeLabels,
  groupStatusLabels,
} from '../../features/groups/lib/groups.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'
import AppSelect from '../../shared/ui/AppSelect.vue'
import AppTextarea from '../../shared/ui/AppTextarea.vue'

type GroupSettingsFormKey = 'chatEnabled' | 'lessonsEnabled' | 'assignmentsEnabled' | 'scheduleEnabled'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const updateGroupMutation = useUpdateGroupMutation(groupId)
const updateGroupSettingsMutation = useUpdateGroupSettingsMutation(groupId)
const deleteGroupMutation = useDeleteGroupMutation(groupId)

const generalForm = reactive<{
  name: string
  description: string
  accessMode: GroupAccessMode
}>({
  name: '',
  description: '',
  accessMode: 'OPEN',
})
const settingsForm = reactive<Record<GroupSettingsFormKey, boolean>>({
  chatEnabled: true,
  lessonsEnabled: false,
  assignmentsEnabled: false,
  scheduleEnabled: false,
})

const generalError = ref('')
const settingsError = ref('')
const lifecycleError = ref('')
const nameError = ref('')
const busyActionKey = ref('')

const group = computed(() => workspace.group.value)
const settings = computed(() => workspace.settings.value)
const enabledModules = computed(() => getEnabledGroupModules(settingsForm))
const generalDirty = computed(() => {
  if (!group.value) {
    return false
  }

  return (
    generalForm.name.trim() !== group.value.name ||
    normalizeOptionalText(generalForm.description) !== normalizeOptionalText(group.value.description) ||
    generalForm.accessMode !== group.value.accessMode
  )
})
const settingsDirty = computed(() => {
  if (!settings.value) {
    return false
  }

  return (
    settingsForm.chatEnabled !== settings.value.chatEnabled ||
    settingsForm.lessonsEnabled !== settings.value.lessonsEnabled ||
    settingsForm.assignmentsEnabled !== settings.value.assignmentsEnabled ||
    settingsForm.scheduleEnabled !== settings.value.scheduleEnabled
  )
})
const accessModeDescription = computed(() => groupAccessModeDescriptions[generalForm.accessMode])
const isAnyMutationPending = computed(
  () => updateGroupMutation.isPending.value || updateGroupSettingsMutation.isPending.value || deleteGroupMutation.isPending.value,
)

const accessModeOptions = [
  {
    label: 'Открытая',
    value: 'OPEN',
  },
  {
    label: 'По заявке',
    value: 'BY_REQUEST',
  },
  {
    label: 'Закрытая',
    value: 'CLOSED',
  },
]

const moduleOptions: Array<{
  key: GroupSettingsFormKey
  label: string
  description: string
}> = [
  {
    key: 'chatEnabled',
    label: 'Чаты',
    description: 'Участники видят глобальные и групповые чаты в workspace.',
  },
  {
    key: 'lessonsEnabled',
    label: 'Уроки',
    description: 'В навигации группы появляется модуль уроков и все связанные экраны.',
  },
  {
    key: 'assignmentsEnabled',
    label: 'Задания',
    description: 'Workspace открывает поток заданий, попыток и проверки submissions.',
  },
  {
    key: 'scheduleEnabled',
    label: 'Расписание',
    description: 'Включается лента с уроками, дедлайнами и пользовательскими событиями.',
  },
]

watch(
  [group, settings],
  ([nextGroup, nextSettings]) => {
    if (nextGroup) {
      generalForm.name = nextGroup.name
      generalForm.description = normalizeOptionalText(nextGroup.description)
      generalForm.accessMode = nextGroup.accessMode
    }

    if (nextSettings) {
      settingsForm.chatEnabled = nextSettings.chatEnabled
      settingsForm.lessonsEnabled = nextSettings.lessonsEnabled
      settingsForm.assignmentsEnabled = nextSettings.assignmentsEnabled
      settingsForm.scheduleEnabled = nextSettings.scheduleEnabled
    }
  },
  {
    immediate: true,
  },
)

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function resetErrors(scope: 'general' | 'settings' | 'lifecycle') {
  if (scope === 'general') {
    generalError.value = ''
    nameError.value = ''
    return
  }

  if (scope === 'settings') {
    settingsError.value = ''
    return
  }

  lifecycleError.value = ''
}

function handleModuleToggle(key: GroupSettingsFormKey, event: Event) {
  const input = event.target as HTMLInputElement
  const nextValue = input.checked

  if (!nextValue && settingsForm[key]) {
    const option = moduleOptions.find((item) => item.key === key)
    const shouldDisable = window.confirm(
      `Выключить модуль "${option?.label ?? 'этот модуль'}"? Данные не удалятся, раздел исчезнет из навигации, а участники потеряют к нему доступ.`,
    )

    if (!shouldDisable) {
      input.checked = true
      return
    }
  }

  settingsForm[key] = nextValue
}

async function handleGeneralSubmit() {
  if (!group.value || workspace.isReadOnly.value || !generalDirty.value) {
    return
  }

  const normalizedName = generalForm.name.trim()
  const normalizedDescription = generalForm.description.trim()
  const isClosingRequestFlow = group.value.accessMode === 'BY_REQUEST' && generalForm.accessMode !== 'BY_REQUEST'

  resetErrors('general')

  if (normalizedName.length < 2) {
    nameError.value = 'Название должно быть не короче 2 символов.'
    return
  }

  if (isClosingRequestFlow) {
    const shouldProceed = window.confirm(
      'Переключение режима доступа завершит сценарий join requests: все pending-заявки будут автоматически отклонены. Продолжить?',
    )

    if (!shouldProceed) {
      return
    }
  }

  busyActionKey.value = 'general'

  try {
    await updateGroupMutation.mutateAsync({
      name: normalizedName,
      description: normalizedDescription,
      accessMode: generalForm.accessMode,
    })
  } catch (error) {
    generalError.value = getGroupsErrorMessage(error, 'Не удалось обновить базовые настройки группы')
  } finally {
    busyActionKey.value = ''
  }
}

async function handleSettingsSubmit() {
  if (!settings.value || workspace.isReadOnly.value || !settingsDirty.value) {
    return
  }

  resetErrors('settings')
  busyActionKey.value = 'modules'

  try {
    await updateGroupSettingsMutation.mutateAsync({
      ...settingsForm,
    })
  } catch (error) {
    settingsError.value = getGroupsErrorMessage(error, 'Не удалось обновить модули группы')
  } finally {
    busyActionKey.value = ''
  }
}

async function handleStatusUpdate(nextStatus: 'ACTIVE' | 'ARCHIVED') {
  if (!group.value) {
    return
  }

  const shouldProceed = window.confirm(
    nextStatus === 'ARCHIVED'
      ? `Архивировать группу "${group.value.name}"? Рабочее пространство станет доступным только для чтения во всех внутренних разделах.`
      : `Восстановить группу "${group.value.name}"? После этого редактирующие действия снова станут доступны.`,
  )

  if (!shouldProceed) {
    return
  }

  resetErrors('lifecycle')
  busyActionKey.value = nextStatus === 'ARCHIVED' ? 'archive' : 'restore'

  try {
    await updateGroupMutation.mutateAsync({
      status: nextStatus,
    })
  } catch (error) {
    lifecycleError.value = getGroupsErrorMessage(error, 'Не удалось обновить статус группы')
  } finally {
    busyActionKey.value = ''
  }
}

async function handleDeleteGroup() {
  if (!group.value || !workspace.isOwner.value) {
    return
  }

  const shouldProceed = window.confirm(
    `Удалить группу "${group.value.name}"? Группа перейдёт в статус DELETED и исчезнет из пользовательского интерфейса.`,
  )

  if (!shouldProceed) {
    return
  }

  resetErrors('lifecycle')
  busyActionKey.value = 'delete'

  try {
    await deleteGroupMutation.mutateAsync()
    await router.push({
      name: 'groups',
    })
  } catch (error) {
    lifecycleError.value = getGroupsErrorMessage(error, 'Не удалось удалить группу')
  } finally {
    busyActionKey.value = ''
  }
}
</script>

<template>
  <div v-if="group && settings" class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Настройки</span>
      <h1 class="page-title">Настройки держат жизненный цикл группы, доступ и модули в одном управляемом экране.</h1>
      <p class="page-lead">
        Здесь owner/admin меняют базовые поля группы, включённые модули и жизненный цикл. Сценарий выхода вынесен в
        `Участников`, потому что сам экран `Настройки` остаётся доступным только управляющим ролям.
      </p>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Базовые поля и переключатели модулей заблокированы, пока группа не будет восстановлена.
    </div>

    <div class="section-grid">
      <AppCard class="span-8 settings-card">
        <form class="form-grid" @submit.prevent="handleGeneralSubmit">
          <AppInput
            v-model="generalForm.name"
            label="Название группы"
            placeholder="Например, Frontend Patterns Lab"
            :error="nameError"
            :disabled="workspace.isReadOnly.value || isAnyMutationPending"
            required
            class="span-full"
          />

          <AppTextarea
            v-model="generalForm.description"
            label="Описание"
            placeholder="Коротко опишите, как используется группа и для кого она предназначена."
            :disabled="workspace.isReadOnly.value || isAnyMutationPending"
            class="span-full"
          />

          <AppSelect
            v-model="generalForm.accessMode"
            label="Режим доступа"
            :options="accessModeOptions"
            :disabled="workspace.isReadOnly.value || isAnyMutationPending"
            class="span-full"
          />

          <p class="muted span-full">{{ accessModeDescription }}</p>

          <AppErrorState
            v-if="generalError"
            class="span-full"
            title="Не удалось сохранить базовые настройки"
            :description="generalError"
          />

          <div class="page-actions span-full">
            <AppButton
              type="submit"
              :disabled="workspace.isReadOnly.value || !generalDirty || isAnyMutationPending"
            >
              {{ busyActionKey === 'general' ? 'Сохраняем...' : 'Сохранить базовые настройки' }}
            </AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard class="span-4 summary-card" tone="accent">
        <span class="page-eyebrow">Текущее состояние</span>
        <div class="pill-list">
          <span class="pill">{{ groupStatusLabels[group.status] }}</span>
          <span class="pill">{{ groupAccessModeLabels[group.accessMode] }}</span>
          <span class="pill">{{ group.code }}</span>
        </div>

        <div class="summary-card__block">
          <strong>Сейчас включено</strong>
          <GroupModuleBadges :modules="enabledModules" />
        </div>

        <div class="summary-card__block">
          <strong>Важно</strong>
          <ul class="list-copy">
            <li>выключенный модуль исчезает из sidebar и быстрых переходов во всём workspace</li>
            <li>архивная группа остаётся доступной для просмотра, но редактирующие CTA централизованно скрываются</li>
            <li>удаление доступно только владельцу, даже если backend-права в будущем изменятся шире</li>
          </ul>
        </div>
      </AppCard>

      <AppCard class="span-8 settings-card">
        <form class="settings-card__form" @submit.prevent="handleSettingsSubmit">
          <div>
            <h2 class="settings-card__title">Модули группы</h2>
            <p class="muted">Отключение модуля требует явного подтверждения, потому что доступ к разделу пропадёт у всей группы.</p>
          </div>

          <fieldset class="modules">
            <legend class="modules__legend">Feature toggles</legend>

            <label v-for="option in moduleOptions" :key="option.key" class="modules__item">
              <input
                :checked="settingsForm[option.key]"
                type="checkbox"
                :disabled="workspace.isReadOnly.value || isAnyMutationPending"
                @change="handleModuleToggle(option.key, $event)"
              />
              <div class="modules__copy">
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </label>
          </fieldset>

          <AppErrorState
            v-if="settingsError"
            title="Не удалось обновить модули"
            :description="settingsError"
          />

          <div class="page-actions">
            <AppButton
              type="submit"
              :disabled="workspace.isReadOnly.value || !settingsDirty || isAnyMutationPending"
            >
              {{ busyActionKey === 'modules' ? 'Сохраняем...' : 'Сохранить модули' }}
            </AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard class="span-4 settings-card">
        <div>
          <span class="page-eyebrow">Жизненный цикл</span>
          <h2 class="settings-card__title">Статус и опасные действия</h2>
          <p class="muted">Архивирование переводит рабочее пространство в режим только для чтения. Восстановление возвращает рабочий режим.</p>
        </div>

        <AppErrorState
          v-if="lifecycleError"
          title="Не удалось выполнить lifecycle-действие"
          :description="lifecycleError"
        />

        <div class="lifecycle-actions">
          <AppButton
            v-if="group.status === 'ACTIVE'"
            variant="secondary"
            block
            :disabled="isAnyMutationPending"
            @click="handleStatusUpdate('ARCHIVED')"
          >
            {{ busyActionKey === 'archive' ? 'Архивируем...' : 'Архивировать группу' }}
          </AppButton>

          <AppButton
            v-else
            variant="secondary"
            block
            :disabled="isAnyMutationPending"
            @click="handleStatusUpdate('ACTIVE')"
          >
            {{ busyActionKey === 'restore' ? 'Восстанавливаем...' : 'Восстановить группу' }}
          </AppButton>

          <AppButton
            v-if="workspace.isOwner.value"
            variant="ghost"
            block
            :disabled="isAnyMutationPending"
            @click="handleDeleteGroup"
          >
            {{ busyActionKey === 'delete' ? 'Удаляем...' : 'Удалить группу' }}
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.settings-card,
.summary-card {
  gap: 1.2rem;
}

.settings-card__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.settings-card__form {
  display: grid;
  gap: 1.2rem;
}

.summary-card__block {
  display: grid;
  gap: 0.75rem;
}

.modules {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-panel-muted);
}

.modules__legend {
  padding: 0 0.25rem;
  font-weight: 700;
}

.modules__item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.95rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.72);
}

.modules__item input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.2rem;
}

.modules__copy {
  display: grid;
  gap: 0.3rem;
}

.modules__copy span {
  color: var(--color-subtle);
}

.lifecycle-actions {
  display: grid;
  gap: 0.75rem;
}
</style>
