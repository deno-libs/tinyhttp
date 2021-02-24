import * as mime from 'https://esm.sh/es-mime-types'
import { encodeUrl } from 'https://esm.sh/@tinyhttp/encode-url'
import { Response as Res } from '../../response.ts'
import { Request as Req } from '../../request.ts'
import { getRequestHeader } from '../req/headers.ts'

const charsetRegExp = /;\s*charset\s*=/

export const setHeader = <Response extends Res = Res>(res: Response) => (
  field: string | Record<string, string | number | string[]>,
  val?: string | number | readonly string[]
): Response => {
  if (typeof field === 'string') {
    let value = Array.isArray(val) ? val.map(String) : String(val)

    // add charset to content-type
    if (field.toLowerCase() === 'content-type') {
      if (Array.isArray(value)) {
        throw new TypeError('Content-Type cannot be set to an Array')
      }

      if (!charsetRegExp.test(value)) {
        const charset = mime.charset(value.split(';')[0])

        if (typeof charset === 'string') value += '; charset=' + charset.toLowerCase()
      }
    }

    res.headers.set(field, value as string)
  } else {
    for (const key in field) {
      setHeader(res)(key, field[key] as string)
    }
  }
  return res
}

export const setLocationHeader = <Request extends Req = Req, Response extends Res = Res>(
  req: Request,
  res: Response
) => (url: string): Response => {
  let loc = url

  // "back" is an alias for the referrer
  if (url === 'back') loc = (getRequestHeader(req)('Referrer') as string) || '/'

  // set location
  res.headers.set('Location', encodeUrl(loc))
  return res
}
