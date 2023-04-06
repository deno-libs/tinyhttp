import { METHODS } from './constants.ts'
import { THRequest } from './request.ts'
import type { THResponse } from './response.ts'
import type { Handler, Method, Middleware } from './types.ts'

type LowerCaseMethod = Lowercase<Method>

export type RouterMethod<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> = (
  path: string | Handler<Req, Res>,
  handler?: RouterHandler<Req, Res>,
  ...handlers: RouterHandler<Req, Res>[]
) => any

type RouterMethodParams<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> = Parameters<RouterMethod<Req, Res>>

type RIM<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
  App extends any = any,
> = (...args: RouterMethodParams<Req, Res>) => App

export type MethodHandler<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> = {
  path?: string | Handler<Req, Res>
  handler?: Handler<Req, Res>
  type: 'mw' | 'route'
  fullPath?: string
  pattern?: URLPattern
}

export type RouterHandler<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> = Handler<Req, Res> | Handler<Req, Res>[]

export type RouterPathOrHandler<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> = string | RouterHandler<Req, Res>

export type UseMethod<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
  App extends Router = Router,
> = (
  path: RouterPathOrHandler<Req, Res> | App,
  handler?: RouterHandler<Req, Res> | App,
  ...handlers: RouterHandler<Req, Res>[]
) => any

export type UseMethodParams<
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
  App extends Router = Router,
> = Parameters<UseMethod<Req, Res, App>>

const createMiddlewareFromRoute = <
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
>({
  path,
  handler,
  fullPath,
  method,
}: MethodHandler<Req, Res> & {
  method?: Method
}) => {
  return ({
    method,
    handler: handler || (path as Handler),
    path: typeof path === 'string' ? path : '/',
    fullPath: typeof path === 'string' ? fullPath : path,
  })
}

/**
 * Push wares to a middleware array
 * @param mw Middleware arrays
 */
export const pushMiddleware =
  <Req extends THRequest = THRequest, Res extends THResponse = THResponse>(
    mw: Middleware<Req, Res>[],
  ) =>
  ({
    path,
    handler,
    method,
    handlers,
    type,
    fullPaths,
    pattern,
  }: MethodHandler<Req, Res> & {
    method?: Method
    handlers?: RouterHandler<Req, Res>[]
    fullPaths?: string[]
  }): void => {
    const m = createMiddlewareFromRoute<Req, Res>({
      path,
      handler,
      method,
      type,
      fullPath: fullPaths?.[0],
      pattern,
    })

    let waresFromHandlers: { handler: Handler<Req, Res> }[] = []
    let idx = 1

    if (handlers) {
      waresFromHandlers = handlers.flat().map((handler) =>
        createMiddlewareFromRoute<Req, Res>({
          path,
          handler,
          method,
          type,
          fullPath: fullPaths == null ? undefined : fullPaths[idx++],
          pattern,
        })
      )
    }

    for (const mdw of [m, ...waresFromHandlers]) {
      mw.push({ ...mdw, type, pattern })
    }
  }

export class Router<
  App extends Router = any,
  Req extends THRequest = THRequest,
  Res extends THResponse = THResponse,
> {
  middleware: Middleware<Req, Res>[] = []

  apps: Record<string, App> = {}
  mountpath = '/'
  parent?: App

  acl!: RIM<Req, Res, this>
  bind!: RIM<Req, Res, this>
  checkout!: RIM<Req, Res, this>
  connect!: RIM<Req, Res, this>
  copy!: RIM<Req, Res, this>
  delete!: RIM<Req, Res, this>
  get!: RIM<Req, Res, this>
  head!: RIM<Req, Res, this>
  link!: RIM<Req, Res, this>
  lock!: RIM<Req, Res, this>
  merge!: RIM<Req, Res, this>
  mkactivity!: RIM<Req, Res, this>
  mkcalendar!: RIM<Req, Res, this>
  mkcol!: RIM<Req, Res, this>
  move!: RIM<Req, Res, this>
  notify!: RIM<Req, Res, this>
  options!: RIM<Req, Res, this>
  patch!: RIM<Req, Res, this>
  post!: RIM<Req, Res, this>
  pri!: RIM<Req, Res, this>
  propfind!: RIM<Req, Res, this>
  proppatch!: RIM<Req, Res, this>
  purge!: RIM<Req, Res, this>
  put!: RIM<Req, Res, this>
  rebind!: RIM<Req, Res, this>
  report!: RIM<Req, Res, this>
  search!: RIM<Req, Res, this>
  source!: RIM<Req, Res, this>
  subscribe!: RIM<Req, Res, this>
  trace!: RIM<Req, Res, this>
  unbind!: RIM<Req, Res, this>
  unlink!: RIM<Req, Res, this>
  unlock!: RIM<Req, Res, this>
  unsubscribe!: RIM<Req, Res, this>
  'm-search'!: RIM<Req, Res, this>

  constructor() {
    for (const m of METHODS) {
      this[m.toLowerCase() as LowerCaseMethod] = (
        ...params: RouterMethodParams<Req, Res>
      ) => this.#add(m as Method, ...params)
    }
  }

  #add(method: Method, ...args: RouterMethodParams<Req, Res>) {
    const handlers = args.slice(1).flat() as Handler<Req, Res>[]
    pushMiddleware<Req, Res>(this.middleware)({
      path: args[0],
      handler: handlers[0],
      handlers: handlers.slice(1),
      method,
      type: 'route',
    })

    return this
  }

  /**
   * Push middleware to the stack
   */
  use(...args: UseMethodParams<Req, Res, App>): this {
    const base = args[0]

    const handlers = args.slice(1).flat()

    if (typeof base === 'string') {
      pushMiddleware(this.middleware)({
        path: base,
        handler: handlers[0] as Handler,
        handlers: handlers.slice(1) as Handler[],
        type: 'mw',
      })
    } else {
      pushMiddleware(this.middleware)({
        path: '/',
        handler: Array.isArray(base) ? base[0] : (base as Handler),
        handlers: Array.isArray(base)
          ? [...(base.slice(1) as Handler[]), ...(handlers as Handler[])]
          : (handlers as Handler[]),
        type: 'mw',
      })
    }

    return this
  }
  /**
   * Return the app's absolute pathname
   * based on the parent(s) that have
   * mounted it.
   *
   * For example if the application was
   * mounted as `"/admin"`, which itself
   * was mounted as `"/blog"` then the
   * return value would be `"/blog/admin"`.
   */
  path(): string {
    return this.parent ? this.parent.path() + this.mountpath : ''
  }
}
