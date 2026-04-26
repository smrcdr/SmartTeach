import { describe, expect, it } from 'vitest'
import { getDemoGroup, recommendedGroups } from './demo-data'

describe('demo data', () => {
  it('keeps recommended groups visually complete for the Stitch catalog cards', () => {
    expect(recommendedGroups.length).toBeGreaterThanOrEqual(5)

    for (const group of recommendedGroups) {
      expect(group.title).toBeTruthy()
      expect(group.code).toMatch(/^[A-Z]{2,3}-\d{4}$/)
      expect(group.coverImage).toMatch(/^https:\/\//)
      expect(group.modules.length).toBeGreaterThan(0)
    }
  })

  it('provides a full workspace snapshot for missing group pages', () => {
    const group = getDemoGroup('full-stack')

    expect(group?.lessons.length).toBeGreaterThan(0)
    expect(group?.assignments.length).toBeGreaterThan(0)
    expect(group?.schedule.length).toBeGreaterThan(0)
    expect(group?.members.length).toBeGreaterThan(0)
    expect(group?.chats.length).toBeGreaterThan(0)
  })
})
