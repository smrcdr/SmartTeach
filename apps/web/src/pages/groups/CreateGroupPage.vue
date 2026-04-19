<script setup lang="ts">
import { reactive } from 'vue'

import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppInput from '../../shared/ui/AppInput.vue'
import AppSelect from '../../shared/ui/AppSelect.vue'
import AppTextarea from '../../shared/ui/AppTextarea.vue'

const form = reactive({
  name: 'Frontend Patterns Lab',
  description: 'Группа для разбора интерфейсных паттернов и совместной практики.',
  accessMode: 'OPEN',
  chatEnabled: true,
  lessonsEnabled: false,
  assignmentsEnabled: false,
  scheduleEnabled: false,
})

const accessModeOptions = [
  {
    label: 'OPEN',
    value: 'OPEN',
  },
  {
    label: 'BY_REQUEST',
    value: 'BY_REQUEST',
  },
  {
    label: 'CLOSED',
    value: 'CLOSED',
  },
]
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Groups / Create</span>
      <h1 class="page-title">Экран создания группы уже готов как отдельная product-форма.</h1>
      <p class="page-lead">
        На этом шаге форма пока статична, но все поля соответствуют backend DTO: `name`, `description`, `accessMode` и
        `settings`.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-8">
        <form class="form-grid" @submit.prevent>
          <AppInput v-model="form.name" label="Название группы" class="span-full" />
          <AppTextarea
            v-model="form.description"
            label="Описание"
            hint="Описание опционально, но каркас уже готов под product-copy вместо placeholder course data."
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
            <label class="modules__item">
              <input v-model="form.chatEnabled" type="checkbox" />
              <span>Chat enabled</span>
            </label>
            <label class="modules__item">
              <input v-model="form.lessonsEnabled" type="checkbox" />
              <span>Lessons enabled</span>
            </label>
            <label class="modules__item">
              <input v-model="form.assignmentsEnabled" type="checkbox" />
              <span>Assignments enabled</span>
            </label>
            <label class="modules__item">
              <input v-model="form.scheduleEnabled" type="checkbox" />
              <span>Schedule enabled</span>
            </label>
          </fieldset>

          <div class="page-actions span-full">
            <AppButton type="submit">Подключить create flow на шаге 7</AppButton>
            <AppButton to="/groups" variant="secondary">Вернуться к группам</AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard class="span-4" tone="accent">
        <h2 class="section-title">Согласованные дефолты</h2>
        <ul class="list-copy">
          <li>`accessMode = OPEN`</li>
          <li>`chatEnabled = true`</li>
          <li>`lessonsEnabled = false`</li>
          <li>`assignmentsEnabled = false`</li>
          <li>`scheduleEnabled = false`</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.modules {
  display: grid;
  gap: 0.75rem;
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
  align-items: center;
  gap: 0.65rem;
  color: var(--color-text);
}

.modules__item input {
  width: 1rem;
  height: 1rem;
}
</style>
