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
    <section class="intro catalog-intro">
      <h1>Вступить в группу</h1>
      <p class="intro-copy">
        Введите код приглашения, чтобы сразу открыть карточку группы и продолжить работу в нужном учебном потоке.
      </p>
    </section>

    <section class="join-layout">
      <section class="join-panel">
        <div class="profile-panel-header">
          <h2>Код приглашения</h2>
        </div>

        <form class="join-form" @submit.prevent="handleSubmit">
          <label class="join-field">
            <span>Введите код</span>
            <input
              v-model="code"
              type="text"
              maxlength="40"
              placeholder="Например: WEBSPRING26"
              autocomplete="off"
              autocapitalize="characters"
              @keydown.enter.prevent="handleSubmit"
            />
          </label>

          <p v-if="codeError" class="join-error">{{ codeError }}</p>

          <div class="join-actions">
            <AppButton type="submit" :disabled="lookupGroupMutation.isPending.value">
              {{ lookupGroupMutation.isPending.value ? 'Ищем группу...' : 'Открыть группу' }}
            </AppButton>
            <AppButton to="/groups" variant="secondary">Назад к группам</AppButton>
          </div>
        </form>

        <AppErrorState v-if="submitError" title="Не удалось открыть группу" :description="submitError" />
      </section>
    </section>
  </div>
</template>

<style scoped>
.join-form {
  display: grid;
  gap: 16px;
}

.join-error {
  color: #8a2f2f;
  font-size: 0.9rem;
}
</style>
