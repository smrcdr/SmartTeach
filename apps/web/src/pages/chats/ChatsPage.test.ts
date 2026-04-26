import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChatsPage from './ChatsPage.vue'

describe('ChatsPage', () => {
  it('renders the full Stitch chat workspace structure', () => {
    const wrapper = mount(ChatsPage)

    expect(wrapper.find('.chats-shell').exists()).toBe(true)
    expect(wrapper.findAll('.chat-filter').map((button) => button.text())).toEqual(['Все', 'Группы', 'Личные'])
    expect(wrapper.findAll('.chat-list__item')).toHaveLength(4)
    expect(wrapper.text()).toContain('Дизайн-системы 2024')
    expect(wrapper.text()).toContain('12 участников онлайн')
    expect(wrapper.text()).toContain('Марина Ковалева')
    expect(wrapper.text()).toContain('design_tokens_v2.pdf')
    expect(wrapper.find('.chat-composer input').attributes('placeholder')).toBe('Написать сообщение...')
  })
})
