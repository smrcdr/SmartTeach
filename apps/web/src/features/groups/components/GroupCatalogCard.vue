<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import type { Group } from '../api/groups.api'
import {
  getEnabledGroupModules,
  getGroupCoverBackground,
  groupAccessModeLabels,
  groupStatusLabels,
} from '../lib/groups.ui'

const props = defineProps<{
  group: Group
  isJoined: boolean
}>()

const router = useRouter()
const moduleLabels = computed(() => getEnabledGroupModules(props.group.settings))
const accessLabel = computed(() => groupAccessModeLabels[props.group.accessMode])
const statusLabel = computed(() => groupStatusLabels[props.group.status])
const actionLabel = computed(() => (props.isJoined ? 'Открыть группу' : 'Открыть карточку'))
const coverStyle = computed(() => ({
  background: getGroupCoverBackground(`${props.group.code}:${props.group.name}`),
}))

function navigateToTarget() {
  void router.push(props.isJoined ? `/groups/${props.group.id}/overview` : `/groups/${props.group.id}`)
}

function handleCardKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  navigateToTarget()
}
</script>

<template>
  <article
    class="course-card"
    role="link"
    tabindex="0"
    :aria-label="`${actionLabel}: ${group.name}`"
    @click="navigateToTarget"
    @keydown="handleCardKeydown"
  >
    <div class="course-cover" :style="coverStyle" />

    <div class="course-body">
      <h2>{{ group.name }}</h2>

      <div class="author-row">
        <span class="author-avatar" />
        <span>{{ group.owner.displayName }}</span>
      </div>

      <div class="tag-row">
        <span class="tag-pill">{{ accessLabel }}</span>
        <span class="tag-pill">{{ statusLabel }}</span>
        <span v-for="moduleName in moduleLabels.slice(0, 2)" :key="moduleName" class="tag-pill">
          {{ moduleName }}
        </span>
      </div>

      <p class="course-description">
        {{ group.description ?? 'Группа доступна в каталоге и может быть открыта для просмотра или вступления.' }}
      </p>

      <div class="course-footer">
        <div class="course-stats">
          <span class="course-stats__members">
            <span class="material-symbols-outlined">person</span>
            <span>{{ group.membersCount }}</span>
          </span>
          <span>{{ group.code }}</span>
        </div>

      </div>
    </div>
  </article>
</template>

<style scoped>
.course-stats__members {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.course-stats__members .material-symbols-outlined {
  font-size: 16px;
}
</style>
