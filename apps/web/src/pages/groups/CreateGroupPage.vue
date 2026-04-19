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
    description: 'Глобальные и групповые обсуждения сразу доступны в новом workspace.',
  },
  {
    key: 'lessonsEnabled',
    label: 'Уроки',
    description: 'Группа готовится к работе с операционным списком уроков и дат.',
  },
  {
    key: 'assignmentsEnabled',
    label: 'Задания',
    description: 'В группе появятся задания, попытки и проверка submissions.',
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
    <header class="page-header">
      <span class="page-eyebrow">Группы / Создание</span>
      <h1 class="page-title">Создание группы теперь начинается с одной рабочей формы без лишних промежуточных шагов.</h1>
      <p class="page-lead">
        Код группы сгенерируется автоматически, а владелец сразу попадёт в собственное рабочее пространство после успешного
        создания.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-8">
        <form class="form-grid" @submit.prevent="handleSubmit">
          <AppInput
            v-model="form.name"
            label="Название группы"
            placeholder="Например, Frontend Patterns Lab"
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
            <legend class="modules__legend">Модули группы</legend>

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

      <AppCard class="span-4" tone="accent">
        <span class="page-eyebrow">Что получится</span>
        <h2 class="side-title">Дефолтный сценарий сразу собирает открытую группу с включённым чатом.</h2>
        <p class="muted">{{ accessModeDescription }}</p>

        <div class="side-block">
          <strong>Включённые модули</strong>
          <GroupModuleBadges :modules="enabledModules" />
        </div>

        <div class="side-block">
          <strong>Важно</strong>
          <ul class="list-copy">
            <li>владелец автоматически становится первым участником</li>
            <li>код группы создаётся на backend и не вводится вручную</li>
            <li>после сохранения открывается контекст группы</li>
          </ul>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
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

.modules__copy strong {
  font-size: 0.98rem;
}

.modules__copy span {
  color: var(--color-subtle);
}

.side-title {
  font-size: 1.15rem;
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.side-block {
  display: grid;
  gap: 0.75rem;
}
</style>
