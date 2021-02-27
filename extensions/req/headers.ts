import { Request } from '../../request.ts'
import { Response } from '../../response.ts'
import parseRange, { Options } from 'https://esm.sh/range-parser'
import fresh from 'https://deno.land/x/fresh/mod.ts'

export const getRequestHeader = (req: Request) => (header: string): string | string[] | null => {
  const lc = header.toLowerCase()

  switch (lc) {
    case 'referer':
    case 'referrer':
      return req.headers.get('referrer') || req.headers.get('referer')
    default:
      return req.headers.get(lc)
  }
}
export const getRangeFromHeader = (req: Request) => (size: number, options?: Options) => {
  const range = getRequestHeader(req)('Range') as string

  if (!range) return

  return parseRange(size, range, options)
}

export const getFreshOrStale = (req: Request, res: Response) => {
  const method = req.method
  const status = res.status || 200

  // GET or HEAD for weak freshness validation only
  if (method !== 'GET' && method !== 'HEAD') return false

  // 2xx or 304 as per rfc2616 14.26
  if ((status >= 200 && status < 300) || status === 304) {
    return fresh(
      req.headers,
      new Headers({
        etag: getRequestHeader(req)('ETag') as string,
        'last-modified': res.headers?.get('Last-Modified') as string
      })
    )
  }

  return false
}
