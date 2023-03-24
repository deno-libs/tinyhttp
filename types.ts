import type { ServeInit } from './deps.ts'
import { THResponse } from './response.ts'

import { HTTP_METHODS } from './deps.ts'



type Method = typeof HTTP_METHODS[number]



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

type NextFunction = () => void

type Handler<
  Req extends Request = Request,
  Res extends THResponse = THResponse,
> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => void | Promise<void>

type Middleware<
  Req extends Request = Request,
  Res extends THResponse = THResponse,
> = {
  handler: Handler<Req, Res>
  type: 'mw' | 'route'
  path: string
  method?: Method
}

export type {
  AcceptsReturns,
  AppConstructor,
  AppSettings,
  Handler,
  Middleware,
  NextFunction,
  Protocol,
  Method
}
