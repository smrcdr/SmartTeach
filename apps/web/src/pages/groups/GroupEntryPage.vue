<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getGroupsErrorMessage } from '../../features/groups/api/groups.api'
import { useGroupsList } from '../../features/groups/composables/useGroups'
import AppButton from '../../shared/ui/AppButton.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const joinedGroupsQuery = useGroupsList('joined')

const joinedGroupIds = computed(() => new Set((joinedGroupsQuery.data.value ?? []).map((group) => group.id)))
const entryTarget = computed(() => {
  if (!groupId.value || joinedGroupsQuery.data.value === undefined) {
    return null
  }

  if (joinedGroupIds.value.has(groupId.value)) {
    return {
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    } as const
  }

  return {
    name: 'group-preview',
    params: {
      groupId: groupId.value,
    },
  } as const
})
const errorMessage = computed(() => {
  const error = joinedGroupsQuery.error.value

  return error ? getGroupsErrorMessage(error, 'Не удалось определить ваш доступ к группе') : ''
})

watch(
  entryTarget,
  async (target) => {
    if (!target) {
      return
    }

    await router.replace(target)
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Groups / Entry</span>
      <h1 class="page-title">Проверяем, должны ли вы увидеть preview или сразу войти в workspace.</h1>
      <p class="page-lead">
        Этот маршрут больше не показывает универсальный экран. Он только определяет ваш контекст по membership и
        переводит дальше.
      </p>
    </header>

    <AppLoader
      v-if="joinedGroupsQuery.isPending.value"
      label="Определяем ваш контекст в группе"
    />

    <AppErrorState
      v-else-if="errorMessage"
      title="Не удалось определить маршрут группы"
      :description="errorMessage"
    >
      <template #actions>
        <AppButton to="/groups" variant="secondary">К группам</AppButton>
      </template>
    </AppErrorState>
  </div>
</template>
