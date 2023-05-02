import { parseRange } from '../../deps.ts'
import { is } from '../../utils/type_is.ts'
import { THRequest } from '../../request.ts'
import type { DummyResponse } from '../../response.ts'
import { fresh } from '../../utils/fresh.ts'

export const getRequestHeader = (req: Request) => (header: string) => {
  const lc = header.toLowerCase()

  switch (lc) {
    case 'referer':
    case 'referrer':
      return (req.headers.get('referrer') as string) ||
        (req.headers.get('referer') as string)
    default:
      return req.headers.get(lc) as string
  }
}
export const getRangeFromHeader = (req: Request) => () => {
  const range = getRequestHeader(req)('Range')

  if (!range) return

  return parseRange(range)
}

export const getFreshOrStale = <
  Response extends DummyResponse = DummyResponse,
>(
  req: Request,
  res: Response,
) => {
  const method = req.method
  const status = res._init?.status || 200

  // GET or HEAD for weak freshness validation only
  if (method !== 'GET' && method !== 'HEAD') return false

  // 2xx or 304 as per rfc2616 14.26
  if ((status >= 200 && status < 300) || 304 === status) {
    return fresh(
      req.headers,
      new Headers({
        etag: res._init.headers.get('ETag')!,
        'last-modified': res._init.headers.get('Last-Modified')!,
      }),
    )
  }

  return false
}

export const checkIfXMLHttpRequest = (
  req: Request,
) => req.headers?.get('X-Requested-With') === 'XMLHttpRequest'

export const reqIs = (req: Request) => (...types: string[]) =>
  is(req.headers?.get('content-type') as string, types)
