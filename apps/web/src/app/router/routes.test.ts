import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { groupWorkspaceNav, routes } from './routes'

function collectRouteNames(routeList: RouteRecordRaw[]): Array<NonNullable<RouteRecordRaw['name']>> {
  return routeList.flatMap((route) => [
    ...(route.name ? [route.name] : []),
    ...(route.children ? collectRouteNames(route.children) : [])
  ])
}

describe('routes', () => {
  it('covers the Stitch source screens and the missing product pages', () => {
    const routeNames = collectRouteNames(routes)

    expect(routeNames).toEqual(expect.arrayContaining([
      'home',
      'guide',
      'catalog',
      'my-groups',
      'group-preview',
      'group-workspace',
      'chats',
      'login',
      'register',
      'profile',
      'profile-edit'
    ]))
  })

  it('keeps group workspace modules aligned with the backend domains', () => {
    expect(groupWorkspaceNav.map((item) => item.key)).toEqual([
      'overview',
      'lessons',
      'assignments',
      'members',
      'schedule',
      'chats',
      'requests',
      'settings'
    ])

    expect(groupWorkspaceNav.flatMap((item) => 'settingKey' in item ? [`${item.key}:${item.settingKey}`] : [])).toEqual([
      'lessons:lessonsEnabled',
      'assignments:assignmentsEnabled',
      'schedule:scheduleEnabled',
      'chats:chatEnabled'
    ])
  })
})
