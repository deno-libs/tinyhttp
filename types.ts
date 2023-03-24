import type { ServeInit } from './deps.ts'
import { THResponse } from './response.ts'

type AcceptsReturns = string | false | string[]

interface Ranges extends Array<Range> {
  type: string
}
interface Range {
  start: number
  end: number
}

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
  pattern: URLPattern
  type: 'mw' | 'route'
  path: string
}

export type {
  AcceptsReturns,
  AppConstructor,
  AppSettings,
  Handler,
  Middleware,
  NextFunction,
  Protocol,
  Range,
  Ranges,
}
