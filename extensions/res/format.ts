import { Handler, NextFunction } from '../../types.ts'
import { normalizeType, normalizeTypes } from './utils.ts'
import { setVaryHeader } from './headers.ts'
import { getAccepts } from '../req/mod.ts'
import { THResponse } from '../../response.ts'
import { THRequest } from '../../request.ts'

export type FormatProps = {
  default?: () => void
} & Record<string, Handler>

class NotAcceptableError extends Error {
  status = 406
  statusCode = 406
  types: string[]
  constructor(types: string[]) {
    super('Not Acceptable')
    this.types = types
  }
}

export const formatResponse = <
  Request extends THRequest = THRequest,
  Response extends THResponse = THResponse,
>(
  req: Request,
  res: Response,
  next: NextFunction,
) =>
(obj: FormatProps) => {
  const fn = obj.default

  if (fn) delete obj.default

  const keys = Object.keys(obj)

  const key = keys.length > 0 ? (getAccepts(req)(...keys) as string) : false

  setVaryHeader(res)('Accept')

  if (key) {
    res.headers?.set('Content-Type', normalizeType(key).value || '')

    obj[key](req, res, next)
  } else if (fn) {
    fn()
  } else {
    throw new NotAcceptableError(normalizeTypes(keys).map((o) => o.value!))
  }

  return res
}
