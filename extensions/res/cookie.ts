import { Request as Req } from '../../request.ts'
import { Response as Res } from '../../response.ts'
import { append } from './append.ts'
import * as cookie from 'https://esm.sh/@tinyhttp/cookie'
import { sign } from '../../utils/cookieSignature.ts'

export const setCookie = <Request extends Req = Req, Response extends Res = Res>(
  req: Request & {
    secret?: string | string[]
  },
  res: Response
) => (
  name: string,
  value: string | Record<string, unknown>,
  options: cookie.SerializeOptions &
    Partial<{
      signed: boolean
    }> = {}
): Response => {
  const secret = req.secret as string

  const signed = options.signed || false

  if (signed && !secret) throw new Error('cookieParser("secret") required for signed cookies')

  let val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value)

  if (signed) val = 's:' + sign(val, secret)

  if (options.maxAge) {
    options.expires = new Date(Date.now() + options.maxAge)
    options.maxAge /= 1000
  }

  if (options.path == null) options.path = '/'

  append(res)('Set-Cookie', `${cookie.serialize(name, String(val), options)}`)

  return res
}

export const clearCookie = <Request extends Req = Req, Response extends Res = Res>(req: Request, res: Response) => (
  name: string,
  options?: cookie.SerializeOptions
): Response => {
  return setCookie<Request, Response>(req, res)(
    name,
    '',
    Object.assign({}, { expires: new Date(1), path: '/' }, options)
  )
}
