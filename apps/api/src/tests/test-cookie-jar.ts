export type CookieJar = Map<string, string>

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[]
}

export function createCookieJar(): CookieJar {
  return new Map<string, string>()
}

export function applyCookieJar(headers: Headers, cookieJar?: CookieJar) {
  if (!cookieJar || cookieJar.size === 0) {
    return
  }

  headers.set(
    'cookie',
    [...cookieJar.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; '),
  )
}

export function storeResponseCookies(response: Response, cookieJar?: CookieJar) {
  if (!cookieJar) {
    return
  }

  for (const setCookie of getSetCookieHeaders(response)) {
    const [nameValue] = setCookie.split(';', 1)

    if (!nameValue) {
      continue
    }

    const separatorIndex = nameValue.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const name = nameValue.slice(0, separatorIndex)
    const value = nameValue.slice(separatorIndex + 1)

    if (value.length === 0) {
      cookieJar.delete(name)
      continue
    }

    cookieJar.set(name, value)
  }
}

export function cloneCookieJar(source: CookieJar) {
  return new Map(source)
}

export function getCookieValue(cookieJar: CookieJar, name: string) {
  return cookieJar.get(name)
}

function getSetCookieHeaders(response: Response) {
  const headers = response.headers as HeadersWithGetSetCookie

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const setCookie = response.headers.get('set-cookie')

  return setCookie ? [setCookie] : []
}
