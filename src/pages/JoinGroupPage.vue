<script setup lang="ts">
import { computed, ref } from 'vue'
import { joinGroupCodes } from '../data/mockDashboard'

const inviteCode = ref('')
const joinState = ref<'idle' | 'success' | 'error'>('idle')
const joinedGroupTitle = ref('')

const normalizedCode = computed(() => inviteCode.value.trim().toUpperCase())

const matchedGroup = computed(
  () => joinGroupCodes.find((item) => item.code === normalizedCode.value) ?? null,
)

const submitJoinCode = () => {
  if (!normalizedCode.value) {
    joinState.value = 'error'
    joinedGroupTitle.value = ''
    return
  }

  if (matchedGroup.value) {
    joinState.value = 'success'
    joinedGroupTitle.value = matchedGroup.value.title
    return
  }

  joinState.value = 'error'
  joinedGroupTitle.value = ''
}

</script>

<template>
  <main class="dashboard-layout">
    <section class="dashboard-main">
      <section class="intro catalog-intro">
        <h1>Вступить в группу</h1>
        <p class="intro-copy">
          Введите специальный код приглашения, чтобы присоединиться к учебной группе или курсу.
        </p>
      </section>

      <section class="join-layout">
        <section class="join-panel">
          <div class="profile-panel-header">
            <h2>Код приглашения</h2>
          </div>

          <label class="join-field">
            <span>Введите код</span>
            <input
              v-model="inviteCode"
              type="text"
              maxlength="40"
              placeholder="Например: PY-2026-ALFA"
              @keydown.enter="submitJoinCode"
            />
          </label>

          <div class="join-actions">
            <button type="button" class="primary-btn" @click="submitJoinCode">Вступить</button>
          </div>

          <div v-if="joinState === 'success' && matchedGroup" class="join-message success">
            <strong>Вы успешно присоединились к группе «{{ joinedGroupTitle }}».</strong>
            <span>{{ matchedGroup.subtitle }}</span>
          </div>

          <div v-if="joinState === 'error'" class="join-message error">
            <strong>Код не найден.</strong>
            <span>Проверьте правильность ввода и попробуйте еще раз.</span>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
