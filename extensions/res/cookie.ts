import { Cookie, setCookie } from '../../deps.ts'
import type { DummyResponse } from '../../response.ts'

export type SetCookieOptions = Omit<Cookie, 'name' | 'value'>

export const cookie = <Res extends DummyResponse = DummyResponse>(res: Res) =>
(
  name: string,
  value: string,
  options: SetCookieOptions = {},
): Res => {
  if (options.path == null) {
    options.path = '/'
  }
  setCookie(res._init.headers, { name, value, ...options })
  return res
}

export const clearCookie =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (name: string): Res => {
    setCookie(
      res._init.headers,
      {
        path: '/',
        name,
        value: '',
        expires: new Date(0),
      },
    )

    return res
  }
