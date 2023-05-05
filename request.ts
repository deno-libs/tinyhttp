import type { App } from './app.ts'
import type { CookieMap, RangesSpecifier } from './deps.ts'
import type { ConnInfo, Middleware, Protocol } from './types.ts'

export interface ReqWithUrlAndConn extends Request {
  conn: ConnInfo; _urlObject: URL
}

export interface THRequest extends ReqWithUrlAndConn {
  path: string
  range: () => -1 | -2 | RangesSpecifier | undefined
  query: URLSearchParams
  params: Record<string, string>
  protocol: Protocol
  xhr: boolean
  hostname?: string
  ip?: string
  ips?: string[]
  subdomains?: string[]
  accepts: (...types: string[]) => string | string[] | undefined
  acceptsEncodings: (...encodings: string[]) => string | string[] | undefined
  // acceptsCharsets: (...charsets: string[]) => string | undefined
  acceptsLanguages: (...languages: string[]) => string | string[] | undefined
  is: (...types: string[]) => string | boolean
  get: (header: string) => string | string[] | undefined
  cookies: CookieMap
  secret?: string | string[]
  fresh?: boolean
  stale?: boolean
  secure: boolean
  route?: Middleware
  app?: App
}
