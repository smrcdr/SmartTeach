<script setup lang="ts">
import { ArrowRight, BookOpen, LockKeyhole, UserPlus, Users } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'
import type { Group } from '../api/groups.api'
import { isGroupMember } from '../lib/group-permissions'
import AppButton from '@/shared/ui/AppButton.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import ModuleBadges from './ModuleBadges.vue'

const props = withDefaults(defineProps<{
  group: Group
  isJoining?: boolean
}>(), {
  isJoining: false
})

const emit = defineEmits<{
  join: []
}>()
const isCodeCopied = ref(false)
let copiedStateTimer: ReturnType<typeof setTimeout> | null = null

const initials = computed(() => props.group.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase())

const enabledModuleCount = computed(() => {
  return [
    props.group.settings.lessonsEnabled,
    props.group.settings.assignmentsEnabled,
    props.group.settings.scheduleEnabled,
    props.group.settings.chatEnabled
  ].filter(Boolean).length + 1
})

const accessLabel = computed(() => {
  if (props.group.accessMode === 'OPEN') {
    return 'Открытая'
  }

  if (props.group.accessMode === 'BY_REQUEST') {
    return 'По заявке'
  }

  return 'Закрытая'
})

const joinAction = computed(() => {
  if (isGroupMember(props.group)) {
    return null
  }

  if (props.group.viewerJoinRequestStatus === 'PENDING') {
    return {
      label: 'Заявка отправлена',
      disabled: true
    }
  }

  if (props.group.accessMode === 'OPEN') {
    return {
      label: props.isJoining ? 'Вступаем...' : 'Вступить',
      disabled: props.isJoining
    }
  }

  if (props.group.accessMode === 'BY_REQUEST') {
    return {
      label: props.isJoining ? 'Отправляем...' : 'Подать заявку',
      disabled: props.isJoining
    }
  }

  return {
    label: 'Доступ закрыт',
    disabled: true
  }
})

function submitJoinAction() {
  if (!joinAction.value || joinAction.value.disabled) {
    return
  }

  emit('join')
}

async function copyGroupCode() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.group.code)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = props.group.code
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    isCodeCopied.value = true

    if (copiedStateTimer) {
      clearTimeout(copiedStateTimer)
    }

    copiedStateTimer = setTimeout(() => {
      isCodeCopied.value = false
      copiedStateTimer = null
    }, 1400)
  } catch {
    isCodeCopied.value = false
  }
}

onBeforeUnmount(() => {
  if (copiedStateTimer) {
    clearTimeout(copiedStateTimer)
  }
})
</script>

<template>
  <section class="group-hero">
    <div class="group-hero__copy">
      <span class="eyebrow">Учебная группа</span>
      <h1 class="page-title">{{ group.name }}</h1>
      <p class="lead">{{ group.description }}</p>
      <ModuleBadges :settings="group.settings" />
      <div class="group-hero__actions">
        <RouterLink v-if="group.viewerMembershipRole" :to="{ name: 'group-workspace', params: { groupId: group.id } }">
          <AppButton size="lg">Открыть группу <ArrowRight :size="18" /></AppButton>
        </RouterLink>
        <AppButton
          v-else-if="joinAction"
          data-testid="group-access-action"
          size="lg"
          :disabled="joinAction.disabled"
          @click="submitJoinAction"
        >
          <UserPlus :size="18" /> {{ joinAction.label }}
        </AppButton>
        <AppButton
          variant="secondary"
          size="lg"
          type="button"
          class="group-hero__code-button"
          :class="{ 'group-hero__code-button--copied': isCodeCopied }"
          data-testid="group-code-button"
          aria-live="polite"
          @click="copyGroupCode"
        >
          <span class="group-hero__code-text">Код {{ group.code }}</span>
          <span class="group-hero__code-toast" :class="{ 'group-hero__code-toast--visible': isCodeCopied }">
            Скопировано
          </span>
        </AppButton>
      </div>
    </div>

    <div class="group-hero__visual">
      <img v-if="group.avatarUrl" :src="group.avatarUrl" :alt="group.name">
      <span v-else>{{ initials }}</span>
    </div>
  </section>

  <section class="group-hero__metrics">
    <MetricTile label="Участников" :value="group.membersCount.toLocaleString('ru-RU')" detail="Активная учебная аудитория" :icon="Users" />
    <MetricTile label="Модулей" :value="enabledModuleCount" detail="Включенные разделы группы" :icon="BookOpen" />
    <MetricTile label="Доступ" :value="accessLabel" detail="Правило вступления" :icon="LockKeyhole" />
  </section>
</template>

<style scoped>
.group-hero {
  align-items: stretch;
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 520px);
  margin-bottom: 32px;
}

.group-hero__copy {
  align-content: center;
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  display: grid;
  gap: 24px;
  padding: clamp(32px, 5vw, 58px);
}

.group-hero__visual {
  align-items: center;
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  color: #fff;
  display: grid;
  font-size: clamp(4rem, 10vw, 7rem);
  font-weight: 900;
  justify-items: center;
  letter-spacing: 0;
  min-height: 420px;
  overflow: hidden;
}

.group-hero__visual img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.group-hero__actions,
.group-hero__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.group-hero__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.group-hero__code-button {
  overflow: hidden;
  position: relative;
}

.group-hero__code-button--copied {
  background: color-mix(in srgb, var(--color-primary-container) 18%, var(--color-surface-high));
  color: color-mix(in srgb, var(--color-primary) 72%, var(--color-text));
}

.group-hero__code-text {
  transition: transform 180ms ease, opacity 180ms ease;
}

.group-hero__code-toast {
  color: color-mix(in srgb, var(--color-primary) 72%, var(--color-text));
  font-size: 0.76rem;
  font-weight: 800;
  left: 50%;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, calc(-50% + 8px));
  transition: opacity 180ms ease, transform 180ms ease;
  white-space: nowrap;
}

.group-hero__code-button--copied .group-hero__code-text {
  opacity: 0;
  transform: translateY(-8px);
}

.group-hero__code-toast--visible {
  opacity: 1;
  transform: translate(-50%, -50%);
}

@media (max-width: 980px) {
  .group-hero {
    grid-template-columns: 1fr;
  }

  .group-hero__visual {
    min-height: 300px;
  }

  .group-hero__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
