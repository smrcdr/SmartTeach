function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeHref(value: string) {
  const trimmed = value.trim()

  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return escapeHtml(trimmed)
  }

  return '#'
}

function renderInline(value: string) {
  const links: string[] = []
  const source = value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
    const index = links.length
    links.push(`<a href="${sanitizeHref(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)

    return `@@SMARTEACH_LINK_${index}@@`
  })
  let html = escapeHtml(source)

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/@@SMARTEACH_LINK_(\d+)@@/g, (_match, index: string) => links[Number(index)] ?? '')

  return html
}

function flushParagraph(paragraph: string[], output: string[]) {
  if (paragraph.length === 0) {
    return
  }

  output.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
  paragraph.length = 0
}

function flushList(list: string[], output: string[], isOrdered: boolean) {
  if (list.length === 0) {
    return
  }

  const tag = isOrdered ? 'ol' : 'ul'
  output.push(`<${tag}>${list.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${tag}>`)
  list.length = 0
}

export function renderMarkdown(value: string | null | undefined) {
  const source = (value ?? '').replace(/\r\n/g, '\n').trim()

  if (!source) {
    return ''
  }

  const output: string[] = []
  const paragraph: string[] = []
  const list: string[] = []
  let isOrderedList = false
  let isCodeBlock = false
  let codeBlock: string[] = []

  source.split('\n').forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph(paragraph, output)
      flushList(list, output, isOrderedList)

      if (isCodeBlock) {
        output.push(`<pre><code>${escapeHtml(codeBlock.join('\n'))}</code></pre>`)
        codeBlock = []
      }

      isCodeBlock = !isCodeBlock
      return
    }

    if (isCodeBlock) {
      codeBlock.push(line)
      return
    }

    if (!trimmed) {
      flushParagraph(paragraph, output)
      flushList(list, output, isOrderedList)
      return
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph(paragraph, output)
      flushList(list, output, isOrderedList)
      const level = heading[1].length + 1
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      return
    }

    const unorderedItem = /^[-*]\s+(.+)$/.exec(trimmed)
    const orderedItem = /^\d+\.\s+(.+)$/.exec(trimmed)
    if (unorderedItem || orderedItem) {
      flushParagraph(paragraph, output)
      const nextIsOrdered = Boolean(orderedItem)

      if (list.length > 0 && isOrderedList !== nextIsOrdered) {
        flushList(list, output, isOrderedList)
      }

      isOrderedList = nextIsOrdered
      list.push((unorderedItem ?? orderedItem)?.[1] ?? '')
      return
    }

    if (trimmed.startsWith('>')) {
      flushParagraph(paragraph, output)
      flushList(list, output, isOrderedList)
      output.push(`<blockquote>${renderInline(trimmed.replace(/^>\s?/, ''))}</blockquote>`)
      return
    }

    flushList(list, output, isOrderedList)
    paragraph.push(trimmed)
  })

  if (isCodeBlock) {
    output.push(`<pre><code>${escapeHtml(codeBlock.join('\n'))}</code></pre>`)
  }

  flushParagraph(paragraph, output)
  flushList(list, output, isOrderedList)

  return output.join('')
}
