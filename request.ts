// deno-lint-ignore-file
import { ServerRequest } from 'https://deno.land/std@0.87.0/http/server.ts'
import { Ranges } from 'https://esm.sh/range-parser'
import { App } from './app.ts'

type AcceptsReturns = string | false | string[]
export interface Request extends ServerRequest {
  path: string
  originalUrl: string
  app: App
  params: Record<string, any>
  get: (header: string) => string | string[] | null
  fresh?: boolean
  stale?: boolean
  accepts: (...types: string[]) => AcceptsReturns
  acceptsEncodings: (...encodings: string[]) => AcceptsReturns
  acceptsCharsets: (...charsets: string[]) => AcceptsReturns
  acceptsLanguages: (...languages: string[]) => AcceptsReturns
  range: (size: number, options?: any) => -1 | -2 | Ranges | undefined
}
