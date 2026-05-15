import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('theme styles', () => {
  it('defines dark theme tokens for surfaces, text, borders and shadows', () => {
    const source = readFileSync(`${process.cwd()}/src/shared/styles/tokens.css`, 'utf8')

    expect(source).toContain(":root[data-theme='dark']")
    expect(source).toContain('--color-surface: #0b1020;')
    expect(source).toContain('--color-surface-lowest: #11172a;')
    expect(source).toContain('--color-primary: #8fa4ff;')
    expect(source).toContain('--color-action-primary-bg: #3457b1;')
    expect(source).toContain('--color-text: #f4f6ff;')
    expect(source).toContain('--color-menu-surface: rgb(17 23 42 / 96%);')
    expect(source).toContain('--color-menu-border: rgb(92 112 166 / 42%);')
  })

  it('uses theme tokens for the page background instead of fixed light colors', () => {
    const source = readFileSync(`${process.cwd()}/src/shared/styles/base.css`, 'utf8')

    expect(source).toContain('background: var(--color-body-gradient), var(--color-surface);')
    expect(source).toContain('border: 1px solid var(--color-panel-border);')
  })
})
