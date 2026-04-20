<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import type { Group } from '../api/groups.api'
import {
  getEnabledGroupModules,
  getGroupCoverBackground,
  getMyGroupRoleLabel,
  groupStatusLabels,
} from '../lib/groups.ui'

const props = defineProps<{
  group: Group
  currentUserId?: string | null
}>()

const router = useRouter()
const moduleLabels = computed(() => getEnabledGroupModules(props.group.settings))
const membershipLabel = computed(() => getMyGroupRoleLabel(props.group, props.currentUserId))
const statusLabel = computed(() => groupStatusLabels[props.group.status])
const coverStyle = computed(() => ({
  background: getGroupCoverBackground(`${props.group.id}:${props.group.name}`),
}))

function navigateToGroup() {
  void router.push(`/groups/${props.group.id}/overview`)
}

function handleCardKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  navigateToGroup()
}
</script>

<template>
  <article
    class="course-card"
    role="link"
    tabindex="0"
    :aria-label="`Открыть группу: ${group.name}`"
    @click="navigateToGroup"
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
        <span class="tag-pill">{{ membershipLabel }}</span>
        <span class="tag-pill">{{ statusLabel }}</span>
        <span v-for="moduleName in moduleLabels.slice(0, 2)" :key="moduleName" class="tag-pill">
          {{ moduleName }}
        </span>
      </div>

      <p class="course-description">
        {{ group.description ?? 'Группа уже доступна в вашем рабочем списке и готова к дальнейшей работе.' }}
      </p>

      <div class="course-footer">
        <div class="course-stats">
          <span class="course-stats__members">
            <span class="material-symbols-outlined">person</span>
            <span>{{ group.membersCount }}</span>
          </span>
          <span>{{ group.code }}</span>
        </div>

        <button type="button" class="primary-btn" @click.stop="navigateToGroup">Открыть группу</button>
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
