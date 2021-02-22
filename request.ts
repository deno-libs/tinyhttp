// deno-lint-ignore-file
import { ServerRequest } from 'https://deno.land/std@0.87.0/http/server.ts'
import { App } from './app.ts'

export interface Request extends ServerRequest {
  path: string
  originalUrl: string
  app: App
  params: Record<string, any>
  get: (header: string) => string | string[] | null
  fresh?: boolean
  stale?: boolean
}
