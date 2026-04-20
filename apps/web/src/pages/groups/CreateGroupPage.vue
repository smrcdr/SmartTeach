<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import GroupModuleBadges from '../../features/groups/components/GroupModuleBadges.vue'
import { getGroupsErrorMessage, type GroupAccessMode } from '../../features/groups/api/groups.api'
import { useCreateGroupMutation } from '../../features/groups/composables/useGroups'
import { getEnabledGroupModules, groupAccessModeDescriptions } from '../../features/groups/lib/groups.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'
import AppSelect from '../../shared/ui/AppSelect.vue'
import AppTextarea from '../../shared/ui/AppTextarea.vue'

type GroupSettingsForm = {
  chatEnabled: boolean
  lessonsEnabled: boolean
  assignmentsEnabled: boolean
  scheduleEnabled: boolean
}

const router = useRouter()
const createGroupMutation = useCreateGroupMutation()

const form = reactive<{
  name: string
  description: string
  accessMode: GroupAccessMode
  settings: GroupSettingsForm
}>({
  name: '',
  description: '',
  accessMode: 'OPEN',
  settings: {
    chatEnabled: true,
    lessonsEnabled: false,
    assignmentsEnabled: false,
    scheduleEnabled: false,
  },
})

const nameError = ref('')
const submitError = ref('')

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
  key: keyof GroupSettingsForm
  label: string
  description: string
}> = [
  {
    key: 'chatEnabled',
    label: 'Чаты',
    description: 'Глобальные и групповые обсуждения сразу доступны в новом рабочем пространстве.',
  },
  {
    key: 'lessonsEnabled',
    label: 'Уроки',
    description: 'Группа готовится к работе с операционным списком уроков и дат.',
  },
  {
    key: 'assignmentsEnabled',
    label: 'Задания',
    description: 'В группе появятся задания, попытки и проверка работ участников.',
  },
  {
    key: 'scheduleEnabled',
    label: 'Расписание',
    description: 'Включает ленту событий и дедлайнов внутри группы.',
  },
]

const enabledModules = computed(() => getEnabledGroupModules(form.settings))
const accessModeDescription = computed(() => groupAccessModeDescriptions[form.accessMode])

async function handleSubmit() {
  if (createGroupMutation.isPending.value) {
    return
  }

  const normalizedName = form.name.trim()
  const normalizedDescription = form.description.trim()

  nameError.value = ''
  submitError.value = ''

  if (normalizedName.length < 2) {
    nameError.value = 'Укажите название не короче 2 символов.'
    return
  }

  try {
    const createdGroup = await createGroupMutation.mutateAsync({
      name: normalizedName,
      description: normalizedDescription || undefined,
      accessMode: form.accessMode,
      settings: {
        ...form.settings,
      },
    })

    await router.push(`/groups/${createdGroup.id}/overview`)
  } catch (error) {
    submitError.value = getGroupsErrorMessage(error, 'Не удалось создать группу')
  }
}
</script>

<template>
  <div class="page-shell">
    <section class="intro catalog-intro">
      <h1>Создать группу</h1>
      <p class="intro-copy">
        Настройте новую группу и сразу подготовьте её к работе с участниками, материалами и внутренними модулями.
      </p>
    </section>

    <section class="create-group-layout">
      <AppCard class="create-group-panel">
        <form class="form-grid" @submit.prevent="handleSubmit">
          <AppInput
            v-model="form.name"
            label="Название группы"
            placeholder="Например, Лаборатория веб-разработки"
            :error="nameError"
            required
            class="span-full"
          />

          <AppTextarea
            v-model="form.description"
            label="Описание"
            hint="Описание опционально, но помогает отличить группу в каталоге и в рабочем списке."
            placeholder="Коротко опишите, для чего нужна группа и что в ней происходит."
            class="span-full"
          />

          <AppSelect
            v-model="form.accessMode"
            label="Режим доступа"
            :options="accessModeOptions"
            class="span-full"
          />

          <fieldset class="modules span-full">
            <legend class="modules__legend">Функции группы</legend>

            <label v-for="option in moduleOptions" :key="option.key" class="modules__item">
              <input v-model="form.settings[option.key]" type="checkbox" />
              <div class="modules__copy">
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </label>
          </fieldset>

          <AppErrorState
            v-if="submitError"
            class="span-full"
            title="Не удалось создать группу"
            :description="submitError"
          />

          <div class="page-actions span-full">
            <AppButton type="submit" :disabled="createGroupMutation.isPending.value">
              {{ createGroupMutation.isPending.value ? 'Создаём группу...' : 'Создать группу' }}
            </AppButton>
            <AppButton to="/groups" variant="secondary">Вернуться к группам</AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard class="create-group-panel" tone="muted">
        <div class="profile-panel-header">
          <h2>Что получится</h2>
        </div>

        <div class="create-group-summary">
          <strong>Режим доступа</strong>
          <span>{{ accessModeDescription }}</span>
        </div>

        <div class="side-block">
          <strong>Включённые модули</strong>
          <GroupModuleBadges :modules="enabledModules" />
        </div>

        <div class="side-block">
          <strong>Важно</strong>
          <ul class="list-copy">
            <li>владелец автоматически становится первым участником</li>
            <li>код группы создаётся на сервере и не вводится вручную</li>
            <li>после сохранения открывается контекст группы</li>
          </ul>
        </div>
      </AppCard>
    </section>
  </div>
</template>

<style scoped>
.modules {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid #c6d3df;
  border-radius: 18px;
  background: #f9fbfd;
}

.modules__legend {
  padding: 0 0.25rem 8px;
  font-weight: 700;
}

.modules__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid #c6d3df;
  border-radius: 16px;
  background: #ffffff;
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

.modules__copy strong {
  font-size: 0.98rem;
}

.modules__copy span {
  color: var(--color-subtle);
}

.side-block {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}
</style>
