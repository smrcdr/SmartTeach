import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppButton from './AppButton.vue'

describe('AppButton', () => {
  it('renders gradient primary actions from the Stitch design system', () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'primary' },
      slots: { default: 'Открыть группу' }
    })

    expect(wrapper.classes()).toContain('app-button--primary')
    expect(wrapper.text()).toBe('Открыть группу')
  })

  it('supports icon-only controls with an accessible label', () => {
    const wrapper = mount(AppButton, {
      props: { iconOnly: true, ariaLabel: 'Открыть меню' },
      slots: { default: '<span data-test="icon"></span>' }
    })

    expect(wrapper.attributes('aria-label')).toBe('Открыть меню')
    expect(wrapper.classes()).toContain('app-button--icon-only')
  })
})
