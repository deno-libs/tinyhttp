import type { App } from './app.ts'
import type { RangesSpecifier } from './deps.ts'
import type { ConnInfo, Middleware, Protocol } from './types.ts'

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
  accepts: (...types: string[]) => string | string[] | undefined
  acceptsEncodings: (...encodings: string[]) => string | undefined
  acceptsCharsets: (...charsets: string[]) => string | undefined
  acceptsLanguages: (...languages: string[]) =>  string | string[] | undefined
  is: (...types: string[]) => string | boolean
  get: (header: string) => string | string[] | undefined
  cookies?: any
  signedCookies?: any
  secret?: string | string[]
  fresh?: boolean
  stale?: boolean
  secure: boolean
  route?: Middleware
  app?: App
}
