import { Handler, NextFunction } from '../../types.ts'
import { normalizeType, normalizeTypes } from './utils.ts'
import { setVaryHeader } from './headers.ts'
import { getAccepts } from '../req/mod.ts'
import { DummyResponse } from '../../response.ts'

export type FormatProps<Res extends DummyResponse = DummyResponse> = {
  default?: (req: Request, res: Res) => void
} & Record<string, Handler<Request, Res>>

export class NotAcceptableError extends Error {
  status = 406
  statusCode = 406
  types: string[]
  constructor(types: string[]) {
    super('Not Acceptable')
    this.types = types
  }
}

export const formatResponse = <
  Res extends DummyResponse = DummyResponse,
>(
  req: Request,
  res: Res,
  next: NextFunction,
) =>
(obj: FormatProps) => {
  const fn = obj.default

  if (fn) delete obj.default

  const keys = Object.keys(obj)

  const key = keys.length > 0 ? (getAccepts(req)(...keys) as string) : false
  setVaryHeader(res)('Accept')

  if (key) {
    res._init.headers?.set('Content-Type', normalizeType(key).value || '')

    obj[key](req, res, next)
  } else if (fn) {
    fn(req, res)
  } else {
    next(new NotAcceptableError(normalizeTypes(keys).map((o) => o.value!)))
  }

  return res
}
