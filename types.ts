import type { ServeInit } from './deps.ts'
import { THResponse } from './response.ts'

import { METHODS } from './constants.ts'
import { THRequest } from './request.ts'

type Method = typeof METHODS[number]

type AcceptsReturns = string | false | string[]

type Protocol = 'http' | 'https'

/**
 * tinyhttp App has a few settings for toggling features
 */
type AppSettings = Partial<
  & Record<'networkExtensions' | 'bindAppToReqRes' | 'enableReqRoute', boolean>
  & Record<'subdomainOffset', number>
  & Record<'xPoweredBy', string | boolean>
>

type AppConstructor<Req, Res> = Partial<{
  noMatchHandler: Handler
  onError: ServeInit['onError']
  applyExtensions: (req: Req, res: Res, next: NextFunction) => void
  settings: AppSettings
}>

type NextFunction = (e?: unknown) => void

type Handler<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
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
  path: string
  method?: Method
}

type TemplateEngineOptions<O = any> = Partial<{
  cache: boolean
  ext: string
  renderOptions: Partial<O>
  viewsFolder: string
  _locals: Record<string, any>
}>

/**
 * Function that processes the template
 */
type TemplateFunc<O> = (
  path: string,
  locals: Record<string, any>,
  opts: TemplateEngineOptions<O>,
  cb: (err: Error | null, html: unknown) => void,
) => void

export type {
  AcceptsReturns,
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
