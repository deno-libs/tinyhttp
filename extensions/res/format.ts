import { Handler } from 'https://esm.sh/@tinyhttp/router'
import { normalizeType, normalizeTypes } from './utils.ts'
import { setVaryHeader } from './headers.ts'
import { getAccepts } from '../req/mod.ts'
import { Request as Req } from '../../request.ts'
import { Response as Res } from '../../response.ts'

export type FormatProps = {
  default?: () => void
} & Record<string, Handler>

export type FormatError = Error & {
  status: number
  statusCode: number
  types: ReturnType<typeof normalizeTypes>[]
}

type next = (err?: FormatError) => void

export const formatResponse = <Request extends Req = Req, Response extends Res = Res, Next extends next = next>(
  req: Request,
  res: Response,
  next: Next
) => (obj: FormatProps) => {
  const fn = obj.default

  if (fn) delete obj.default

  const keys = Object.keys(obj)

  const key = keys.length > 0 ? (getAccepts(req)(...keys) as string) : false

  setVaryHeader(res)('Accept')

  if (key) {
    res.setHeader('Content-Type', normalizeType(key).value)
    obj[key](req, res, next)
  } else if (fn) {
    fn()
  } else {
    const err = new Error('Not Acceptable') as FormatError
    err.status = err.statusCode = 406
    err.types = normalizeTypes(keys).map((o) => o.value)

    next(err)
  }

  return res
}
