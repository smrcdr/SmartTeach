<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const code = ref('WEBSPRING26')
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Groups / Join By Code</span>
      <h1 class="page-title">Отдельный flow для ввода кода уже выделен в новый router.</h1>
      <p class="page-lead">
        На шаге 7 здесь появится lookup по `/groups/by-code/{code}` и переход в preview, а пока skeleton уже разводит
        сценарий с каталогом и созданием группы.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-7">
        <form class="join-form" @submit.prevent>
          <AppInput
            v-model="code"
            label="Код группы"
            hint="Для ручной проверки можно использовать WEBSPRING26, MATHLAB26 и ARCHIVE26."
          />
          <div class="page-actions">
            <AppButton type="submit">Подключить lookup на шаге 7</AppButton>
            <AppButton to="/groups" variant="secondary">Назад к группам</AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard class="span-5" tone="muted">
        <AppErrorState
          title="Ошибочные сценарии уже выделены"
          description="На следующем шаге сюда добавятся not found, already joined и access-mode специфичные состояния без отдельного мокового экрана."
        />
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.join-form {
  display: grid;
  gap: 1rem;
}
</style>
