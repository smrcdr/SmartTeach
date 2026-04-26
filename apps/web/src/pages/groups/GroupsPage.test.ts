import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('GroupsPage', () => {
  it('renders the join-by-code action as a visible CTA button with an icon', () => {
    const source = readFileSync(`${process.cwd()}/src/pages/groups/GroupsPage.vue`, 'utf8')

    expect(source).toContain("import { UserPlus } from 'lucide-vue-next'")
    expect(source).toContain('class="catalog-page__join-button"')
    expect(source).toContain('<UserPlus :size="18" />')
    expect(source).toContain('box-shadow: 0 16px 30px -18px rgb(21 25 108 / 60%);')
  })
})
