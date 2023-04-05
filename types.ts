import { DummyResponse, THResponse } from './response.ts'

import { METHODS } from './constants.ts'
import { THRequest } from './request.ts'

type Method = typeof METHODS[number]

type Protocol = 'http' | 'https'

/**
 * tinyhttp App has a few settings for toggling features
 */
type AppSettings = Partial<
  & Record<'bindAppToReqRes' | 'enableReqRoute', boolean>
  & Record<'subdomainOffset', number>
  & Record<'xPoweredBy', string | boolean>
>

type AppConstructor<Req, Res> = Partial<{
  noMatchHandler: Handler
  onError: (err: unknown, req: Request) => Response | Promise<Response>
  applyExtensions: (req: Req, res: Res, next: NextFunction) => void
  settings: AppSettings
}>

type NextFunction = (e?: unknown) => void | Promise<void>

type Handler<
  Req extends Request = THRequest,
  Res extends DummyResponse = THResponse,
> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => void | Promise<void>

type Middleware<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> = {
  handler: Handler<Req, Res>
  type: 'mw' | 'route'
  path?: string
  method?: Method
  fullPath?: string
  pattern?: URLPattern
}

type TemplateEngineOptions<O = any> = Partial<{
  cache: boolean
  ext: string
  renderOptions: Partial<O>
  viewsFolder: string
  _locals: Record<string, unknown>
}>

/**
 * Function that processes the template
 */
type TemplateFunc<O> = (
  path: string,
  locals: Record<string, unknown>,
  opts: TemplateEngineOptions<O>,
  cb: (err: Error | null, html: unknown) => void,
) => void

export interface ConnInfo {
  /** The local address of the connection. */
  readonly localAddr: Deno.Addr
  /** The remote address of the connection. */
  readonly remoteAddr: Deno.Addr
}

export type {
  AppConstructor,
  AppSettings,
  Handler,
  Method,
  Middleware,
  NextFunction,
  Protocol,
  TemplateEngineOptions,
  TemplateFunc,
}
