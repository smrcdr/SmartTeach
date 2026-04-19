<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../../auth/composables/useAuth'
import { getChatsErrorMessage } from '../api/chats.api'
import { useCreateOrGetDirectChatMutation } from '../composables/useChats'
import AppButton from '../../../shared/ui/AppButton.vue'

const props = withDefaults(
  defineProps<{
    userId: string
    label?: string
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'md' | 'sm'
    block?: boolean
    disabled?: boolean
  }>(),
  {
    label: 'Написать',
    variant: 'secondary',
    size: 'sm',
    block: false,
    disabled: false,
  },
)

const router = useRouter()
const { currentUser } = useAuth()
const createDirectChatMutation = useCreateOrGetDirectChatMutation()
const errorMessage = ref('')

const isSelf = computed(() => props.userId === currentUser.value?.id)
const isBusy = computed(() => createDirectChatMutation.isPending.value)

async function handleClick() {
  if (isSelf.value || props.disabled || isBusy.value) {
    return
  }

  errorMessage.value = ''

  try {
    const chat = await createDirectChatMutation.mutateAsync({
      userId: props.userId,
    })

    await router.push({
      name: 'chat-details',
      params: {
        chatId: chat.id,
      },
    })
  } catch (error) {
    errorMessage.value = getChatsErrorMessage(error, 'Не удалось открыть личный чат')
  }
}
</script>

<template>
  <div v-if="!isSelf" class="user-direct-chat-button">
    <AppButton
      :variant="variant"
      :size="size"
      :block="block"
      :disabled="disabled || isBusy"
      @click="handleClick"
    >
      {{ isBusy ? 'Открываем...' : label }}
    </AppButton>
    <p v-if="errorMessage" class="user-direct-chat-button__error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.user-direct-chat-button {
  display: grid;
  gap: 0.4rem;
}

.user-direct-chat-button__error {
  font-size: 0.84rem;
  color: var(--color-danger);
}
</style>
