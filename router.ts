import type { THResponse } from './response.ts'
import { Handler, Middleware } from './types.ts'

export const METHODS = [
  'ACL',
  'BIND',
  'CHECKOUT',
  'CONNECT',
  'COPY',
  'DELETE',
  'GET',
  'HEAD',
  'LINK',
  'LOCK',
  'MERGE',
  'MKACTIVITY',
  'MKCALENDAR',
  'MKCOL',
  'MOVE',
  'NOTIFY',
  'OPTIONS',
  'PATCH',
  'POST',
  'PROPFIND',
  'PROPPATCH',
  'PURGE',
  'PUT',
  'REBIND',
  'REPORT',
  'SEARCH',
  'SOURCE',
  'SUBSCRIBE',
  'TRACE',
  'UNBIND',
  'UNLINK',
  'UNLOCK',
  'UNSUBSCRIBE',
] as const

type RouterArgs<Req extends Request = Request> = [
  pathname: string,
  handler: Handler<Req>,
  ...handlers: Handler<Req>[],
]

type RM<R> = (...args: RouterArgs) => R

type Method = typeof METHODS[number]

type LowerCaseMethod = Lowercase<Method>

export class Router<
  Req extends Request = Request,
  Res extends THResponse = THResponse,
> {
  middleware: Middleware<Req, Res>[] = []
  routes: Record<string, Middleware<Req, Res>[]> = {}

  acl!: RM<this>
  bind!: RM<this>
  checkout!: RM<this>
  connect!: RM<this>
  copy!: RM<this>
  delete!: RM<this>
  get!: RM<this>
  head!: RM<this>
  link!: RM<this>
  lock!: RM<this>
  merge!: RM<this>
  mkactivity!: RM<this>
  mkcalendar!: RM<this>
  mkcol!: RM<this>
  move!: RM<this>
  notify!: RM<this>
  options!: RM<this>
  patch!: RM<this>
  post!: RM<this>
  pri!: RM<this>
  propfind!: RM<this>
  proppatch!: RM<this>
  purge!: RM<this>
  put!: RM<this>
  rebind!: RM<this>
  report!: RM<this>
  search!: RM<this>
  source!: RM<this>
  subscribe!: RM<this>
  trace!: RM<this>
  unbind!: RM<this>
  unlink!: RM<this>
  unlock!: RM<this>
  unsubscribe!: RM<this>

  constructor() {
    for (const m of METHODS) {
      this.routes[m] = []
      this[m.toLowerCase() as LowerCaseMethod] = (...params: RouterArgs) =>
        this.#add(m as Method, ...params)
    }
  }

  #add(method: Method, ...params: RouterArgs) {
    const pathname = params[0]
    const handler = params[1]
    const handlers = params.slice(2) as Handler[]
    const pattern = new URLPattern({ pathname })

    this.routes[method].push({
      pattern,
      handler,
      type: 'route',
      path: pathname,
    })

    if (handlers) {
      handlers.forEach((h) =>
        this.middleware.push({
          pattern,
          handler: h,
          type: 'route',
          path: pathname,
        })
      )
    }
    return this
  }

  /**
   * Push middleware to the stack
   */
  use(_pathname: string | Handler<Req, Res>, ...handlers: Handler<Req, Res>[]) {
    let pathname: string

    if (typeof _pathname === 'string') {
      pathname = _pathname
    } else {
      pathname = '/'
    }

    // loose matching
    const pattern = new URLPattern({ pathname: `${pathname}*?` })

    if (typeof _pathname === 'function') {
      this.middleware.push({
        pattern,
        handler: _pathname,
        type: 'mw',
        path: pathname,
      })
    }

    if (handlers) {
      handlers.forEach((h) =>
        this.middleware.push({
          pattern,
          handler: h,
          type: 'mw',
          path: pathname,
        })
      )
    }
    return this
  }
}
