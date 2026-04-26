import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('GroupModuleSwitch', () => {
  it('uses a dedicated grey off-state track so the thumb stays visible', () => {
    const switchSource = readFileSync(`${process.cwd()}/src/features/groups/components/GroupModuleSwitch.vue`, 'utf8')
    const tokensSource = readFileSync(`${process.cwd()}/src/shared/styles/tokens.css`, 'utf8')

    expect(switchSource).toContain('background: var(--color-switch-off-bg);')
    expect(switchSource).toContain('border: 1px solid var(--color-switch-off-border);')
    expect(tokensSource).toContain('--color-switch-off-bg: #5e6676;')
    expect(tokensSource).toContain('--color-switch-off-border: #767f91;')
  })
})
