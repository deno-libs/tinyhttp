import * as cookie from 'https://deno.land/std@0.181.0/http/cookie.ts'
import { THResponse } from '../../response.ts'

export const setCookie =
  <Response extends THResponse = THResponse>(res: Response) =>
  (
    name: string,
    value: string,
    options?: Omit<cookie.Cookie, 'value' | 'name'>,
  ): Response => {
    cookie.setCookie(res._init.headers, {
      value,
      name,
      ...options,
    })

    return res
  }

export const clearCookie =
  <Response extends THResponse = THResponse>(res: Response) =>
  (name: string): Response => {
    cookie.deleteCookie(res._init.headers, name, {
      path: cookie.getCookies(res._init.headers)['Path'] || '/',
    })

    return res
  }
