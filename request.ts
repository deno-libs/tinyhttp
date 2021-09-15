import { ConnInfo } from 'https://deno.land/std@0.107.0/http/server.ts'

type URLParams = Record<string, string | string[] | undefined>

export interface THRequest extends Request {
  _url: string
  originalUrl: string
  params: URLParams
  path: string
  query: URLParams
  conn: ConnInfo
}
