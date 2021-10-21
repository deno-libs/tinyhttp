import { Handler, NextFunction } from './deps.ts'
import { ErrorHandler } from './onError.ts'

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
  Record<'networkExtensions' | 'bindAppToReqRes' | 'enableReqRoute', boolean> &
    Record<'subdomainOffset', number> &
    Record<'xPoweredBy', string | boolean>
>

type AppConstructor<Req, Res> = Partial<{
  noMatchHandler: Handler<Req, Res>
  onError: ErrorHandler
  applyExtensions: (req: Req, res: Res, next: NextFunction) => void
  settings: AppSettings
}>

export type { AcceptsReturns, Range, Ranges, Protocol, AppConstructor, AppSettings }
