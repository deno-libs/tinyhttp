import { NextFunction, Handler as RHandler, Middleware, UseMethodParams, Method } from './deps.ts'
import type { Request, Response } from './mod.ts'

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

export type Handler<Req = Request> = RHandler<Req, Response>

export type {
  QueryParams,
  AcceptsReturns,
  Protocol,
  Range,
  Ranges,
  Method,
  NextFunction,
  RHandler,
  Middleware,
  UseMethodParams
}
