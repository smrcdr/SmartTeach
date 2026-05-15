import { describe, expect, it } from 'vitest'
import { renderLessonContent, renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders basic markdown blocks and inline formatting', () => {
    expect(renderMarkdown('## Заголовок\n\n**Жирный** и [ссылка](https://example.com)\n\n- пункт')).toContain('<h3>Заголовок</h3>')
    expect(renderMarkdown('**Жирный**')).toContain('<strong>Жирный</strong>')
    expect(renderMarkdown('[ссылка](https://example.com)')).toContain('href="https://example.com"')
    expect(renderMarkdown('- пункт')).toContain('<ul><li>пункт</li></ul>')
  })

  it('escapes html and blocks unsafe links', () => {
    const html = renderMarkdown('<script>alert(1)</script> [bad](javascript:alert(1))')

    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('href="#"')
  })

  it('sanitizes rich lesson content and keeps internal lesson links', () => {
    const html = renderLessonContent(
      '<h2>Тема</h2><script>alert(1)</script><a href="/groups/group-id/workspace/lessons/lesson-id" data-lesson-id="lesson-id">Урок</a>'
    )

    expect(html).toContain('<h2>Тема</h2>')
    expect(html).toContain('data-lesson-id="lesson-id"')
    expect(html).not.toContain('<script>')
  })
})
