import { NextFunction, Handler, Middleware, UseMethodParams } from 'https://esm.sh/@tinyhttp/router'

type QueryParams = {
  [key: string]: string | string[]
}

type AcceptsReturns = string | false | string[]

type Protocol = 'http' | 'https'

interface Ranges extends Array<Range> {
  type: string
}
interface Range {
  start: number
  end: number
}

export type { NextFunction, Handler, Middleware, UseMethodParams }

export type { QueryParams, AcceptsReturns, Protocol, Range, Ranges }
