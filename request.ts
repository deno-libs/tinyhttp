import type { RangesSpecifier } from './deps.ts'
import type { AcceptsReturns, ConnInfo, Middleware, Protocol } from './types.ts'

export interface THRequest extends Request {
  _urlObject: URL
  path: string
  conn: ConnInfo
  range: () => -1 | -2 | RangesSpecifier | undefined
  query: URLSearchParams
  params: Record<string, string>
  protocol: Protocol
  xhr: boolean
  hostname?: string
  ip?: string
  ips?: string[]
  subdomains?: string[]
  accepts: (...types: string[]) => AcceptsReturns
  acceptsEncodings: (...encodings: string[]) => AcceptsReturns
  acceptsCharsets: (...charsets: string[]) => AcceptsReturns
  acceptsLanguages: (...languages: string[]) => AcceptsReturns
  is: (...types: string[]) => string | boolean
  get: (header: string) => string | string[] | undefined
  cookies?: any
  signedCookies?: any
  secret?: string | string[]
  fresh?: boolean
  stale?: boolean
  secure: boolean
  route?: Middleware
}
