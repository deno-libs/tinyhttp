import { NextFunction, Handler as RHandler, Middleware, UseMethodParams } from 'https://esm.sh/@tinyhttp/router'
import { Request, Response } from './mod.ts'

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

export type Handler = RHandler<Request, Response>

export type { NextFunction, RHandler, Middleware, UseMethodParams }

export type { QueryParams, AcceptsReturns, Protocol, Range, Ranges }
