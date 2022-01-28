import type { App } from './app.ts'
import type { Middleware, ConnInfo } from './deps.ts'
import type { AcceptsReturns, Protocol, Ranges } from './types.ts'
import type { ParsedUrlQuery } from './utils/parseUrl.ts'

export interface THRequest extends Request {
  _url: string
  conn: ConnInfo
  path: string
  originalUrl: string
  query: ParsedUrlQuery

  app: App
  params: Record<string, any>
  get: (header: string) => string | string[] | null
  xhr: boolean
  fresh?: boolean
  stale?: boolean
  accepts: (...types: string[]) => AcceptsReturns
  acceptsEncodings: (...encodings: string[]) => AcceptsReturns
  acceptsCharsets: (...charsets: string[]) => AcceptsReturns
  acceptsLanguages: (...languages: string[]) => AcceptsReturns
  range: (size: number, options?: any) => -1 | -2 | Ranges | undefined
  route?: Middleware | undefined
  is: (...types: string[]) => string | boolean

  hostname: string | undefined
  ip?: string
  ips?: string[]
  protocol?: Protocol
  subdomains?: string[]
  secure?: boolean

  cookies?: any
  signedCookies?: any

  connection: { remoteAddress: string }

  parsedBody?: any
}
