<script setup lang="ts">
import type { SubmissionGroup } from '../lib/assignments.ui'
import {
  formatAssignmentDateTime,
  formatSubmissionScore,
  getSubmissionSummary,
  normalizeOptionalText,
} from '../lib/assignments.ui'
import SubmissionStatusBadge from './SubmissionStatusBadge.vue'
import AppButton from '../../../shared/ui/AppButton.vue'

defineProps<{
  groupId: string
  assignmentId: string
  groups: SubmissionGroup[]
}>()
</script>

<template>
  <div class="submission-groups">
    <article v-for="group in groups" :key="group.author.id" class="submission-group">
      <header class="submission-group__header">
        <div>
          <h3 class="submission-group__title">{{ group.author.displayName }}</h3>
          <p class="muted">
            {{ normalizeOptionalText(group.author.bio) || 'Участник группы без дополнительного описания профиля.' }}
          </p>
        </div>

        <div class="pill-list">
          <span class="pill">Попыток: {{ group.attempts.length }}</span>
          <SubmissionStatusBadge :status="group.latestSubmission.status" />
        </div>
      </header>

      <div class="submission-group__latest">
        <div class="submission-group__latest-copy">
          <div class="submission-group__latest-meta">
            <strong>Последняя попытка #{{ group.latestSubmission.attemptNumber }}</strong>
            <span class="muted">Обновлено {{ formatAssignmentDateTime(group.latestSubmission.updatedAt) }}</span>
          </div>
          <p class="submission-group__latest-summary">
            {{ getSubmissionSummary(group.latestSubmission.text, 'У участника пока пустой текст попытки.') }}
          </p>
        </div>

        <div class="submission-group__latest-side">
          <span class="pill">
            {{ formatSubmissionScore(group.latestSubmission.score, null) }}
          </span>
          <AppButton
            size="sm"
            :to="{
              name: 'group-assignment-submission-details',
              params: {
                groupId,
                assignmentId,
                submissionId: group.latestSubmission.id,
              },
            }"
          >
            Открыть
          </AppButton>
        </div>
      </div>

      <ul v-if="group.attempts.length > 1" class="submission-group__attempts">
        <li
          v-for="attempt in group.attempts.slice(1)"
          :key="attempt.id"
          class="submission-group__attempt-item"
        >
          <div class="submission-group__attempt-copy">
            <strong>Попытка #{{ attempt.attemptNumber }}</strong>
            <span class="muted">{{ formatAssignmentDateTime(attempt.updatedAt) }}</span>
          </div>

          <div class="submission-group__attempt-actions">
            <SubmissionStatusBadge :status="attempt.status" />
            <AppButton
              variant="ghost"
              size="sm"
              :to="{
                name: 'group-assignment-submission-details',
                params: {
                  groupId,
                  assignmentId,
                  submissionId: attempt.id,
                },
              }"
            >
              Детали
            </AppButton>
          </div>
        </li>
      </ul>
    </article>
  </div>
</template>

<style scoped>
.submission-groups {
  display: grid;
  gap: 1rem;
}

.submission-group {
  display: grid;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
}

.submission-group__header,
.submission-group__latest,
.submission-group__attempt-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.submission-group__title {
  font-size: 1.02rem;
  letter-spacing: -0.02em;
}

.submission-group__latest {
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: var(--color-panel-muted);
}

.submission-group__latest-copy,
.submission-group__latest-side,
.submission-group__attempt-copy,
.submission-group__attempt-actions {
  display: grid;
  gap: 0.45rem;
}

.submission-group__latest-side,
.submission-group__attempt-actions {
  justify-items: end;
}

.submission-group__latest-meta {
  display: grid;
  gap: 0.25rem;
}

.submission-group__latest-summary {
  color: var(--color-text);
  line-height: 1.65;
  white-space: pre-wrap;
}

.submission-group__attempts {
  display: grid;
  gap: 0.75rem;
}

.submission-group__attempt-item {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 900px) {
  .submission-group__header,
  .submission-group__latest,
  .submission-group__attempt-item {
    flex-direction: column;
  }

  .submission-group__latest-side,
  .submission-group__attempt-actions {
    justify-items: start;
  }
}
</style>
