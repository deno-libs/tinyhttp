import { Request as Req } from '../../request.ts'
import { Response as Res } from '../../response.ts'
import * as cookie from 'https://deno.land/std@0.88.0/http/cookie.ts'

export const setCookie = <Request extends Req = Req, Response extends Res = Res>(req: Request, res: Response) => (
  name: string,
  value: string,
  options?: Omit<cookie.Cookie, 'value' | 'name'>
): Response => {
  cookie.setCookie(req, {
    value,
    name,
    ...options
  })

  return res
}

export const clearCookie = <Response extends Res = Res>(res: Response) => (name: string): Response => {
  cookie.deleteCookie(res, name)

  return res
}
