import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('theme styles', () => {
  it('defines dark theme tokens for surfaces, text, borders and shadows', () => {
    const source = readFileSync(`${process.cwd()}/src/shared/styles/tokens.css`, 'utf8')

    expect(source).toContain(":root[data-theme='dark']")
    expect(source).toContain('--color-surface: #0f111a;')
    expect(source).toContain('--color-surface-lowest: #151720;')
    expect(source).toContain('--color-primary: #aeb6d1;')
    expect(source).toContain('--color-action-primary-bg: #4b5670;')
    expect(source).toContain('--color-text: #f4f2ff;')
    expect(source).toContain('--color-menu-surface: rgb(21 23 32 / 96%);')
    expect(source).toContain('--color-menu-border: rgb(137 141 176 / 38%);')
  })

  it('uses theme tokens for the page background instead of fixed light colors', () => {
    const source = readFileSync(`${process.cwd()}/src/shared/styles/base.css`, 'utf8')

    expect(source).toContain('background: var(--color-body-gradient), var(--color-surface);')
    expect(source).toContain('border: 1px solid var(--color-panel-border);')
  })
})
