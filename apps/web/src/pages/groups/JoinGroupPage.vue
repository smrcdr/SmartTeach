<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { getGroupsErrorMessage } from '../../features/groups/api/groups.api'
import { useLookupGroupByCodeMutation } from '../../features/groups/composables/useGroups'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'

const router = useRouter()
const lookupGroupMutation = useLookupGroupByCodeMutation()

const code = ref('')
const codeError = ref('')
const submitError = ref('')

async function handleSubmit() {
  if (lookupGroupMutation.isPending.value) {
    return
  }

  const normalizedCode = code.value.trim().toUpperCase()

  codeError.value = ''
  submitError.value = ''

  if (!normalizedCode) {
    codeError.value = 'Введите код группы, который вам прислали.'
    return
  }

  code.value = normalizedCode

  try {
    const group = await lookupGroupMutation.mutateAsync(normalizedCode)

    await router.push(`/groups/${group.id}`)
  } catch (error) {
    submitError.value = getGroupsErrorMessage(error, 'Не удалось найти группу по этому коду')
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Groups / Join By Code</span>
      <h1 class="page-title">Код группы теперь ведёт в её контекст без обхода через моковый каталог.</h1>
      <p class="page-lead">
        Введите код из приглашения, чтобы сразу открыть карточку группы и проверить, подходит ли она вам по доступу и
        контексту.
      </p>
    </header>

    <div class="section-grid">
      <AppCard class="span-7">
        <form class="join-form" @submit.prevent="handleSubmit">
          <AppInput
            v-model="code"
            label="Код группы"
            hint="Для ручной проверки можно использовать WEBSPRING26 или MATHLAB26."
            placeholder="Например, WEBSPRING26"
            :error="codeError"
            autocomplete="off"
            autocapitalize="characters"
          />

          <div class="page-actions">
            <AppButton type="submit" :disabled="lookupGroupMutation.isPending.value">
              {{ lookupGroupMutation.isPending.value ? 'Ищем группу...' : 'Открыть группу' }}
            </AppButton>
            <AppButton to="/groups" variant="secondary">Назад к группам</AppButton>
          </div>
        </form>

        <AppErrorState
          v-if="submitError"
          title="Не удалось открыть группу"
          :description="submitError"
        />
      </AppCard>

      <AppCard class="span-5" tone="muted">
        <h2 class="section-title">Что поддерживает этот flow</h2>
        <ul class="list-copy">
          <li>код сразу проверяется через реальный backend endpoint `/groups/by-code/{code}`</li>
          <li>открытая группа и группа по заявке ведут на отдельный preview вместо старых моков</li>
          <li>закрытые или недоступные группы честно возвращают ошибку поиска</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.join-form {
  display: grid;
  gap: 1rem;
}

.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
</style>
