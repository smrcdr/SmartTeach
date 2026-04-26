import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('GroupAccessModeSelect', () => {
  it('keeps the selected access option styling stable on hover', () => {
    const source = readFileSync(`${process.cwd()}/src/features/groups/components/GroupAccessModeSelect.vue`, 'utf8')

    expect(source).toContain('.group-access-mode__option--active:hover')
    expect(source).toContain('background: var(--color-action-primary-bg);')
    expect(source).toContain('color: var(--color-action-primary-text);')
  })
})
