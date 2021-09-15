import { Router, Server, rg, NextFunction, setImmediate, pushMiddleware, UseMethodParams } from './deps.ts'
import type { Middleware, Handler } from './deps.ts'
import { getPathname, getURLParams } from './utils/parseUrl.ts'
import { ErrorHandler, onErrorHandler } from './onError.ts'
import type { THRequest } from './request.ts'
import type { ResponseState } from './response.ts'
import { extend } from './extend.ts'

declare global {
  namespace tinyhttp {
    // These open interfaces may be extended in an application-specific manner via declaration merging.
    interface Request {}
    interface Response {}
    interface Application {}
  }
}

export type AppConstructor<Req, Res> = Partial<{
  noMatchHandler: Handler<Req>
  onError: ErrorHandler
  applyExtensions: (req: Req, res: Res, next: NextFunction) => void
}>

const mount = (fn: any) => (fn instanceof App ? fn.attach : fn)

/**
 * Execute handler with passed `req` and `res`. Catches errors and resolves async handlers.
 * @param h
 */
export const applyHandler =
  <Req, Res>(h: Handler<Req, Res>) =>
  async (req: Req, res: Res, next: NextFunction) => {
    try {
      if (h.constructor.name === 'AsyncFunction') {
        await h(req, res, next)
      } else h(req, res, next)
    } catch (e) {
      next(e)
    }
  }

export class App<Req extends THRequest = THRequest, Res extends ResponseState = ResponseState> extends Router<
  App,
  Req,
  Res
> {
  middleware: Middleware<Req>[] = []
  locals: Record<string, string> = {}
  noMatchHandler: Handler
  onError: ErrorHandler
  attach: (req: Req) => void

  mountpath = '/'

  constructor(options: AppConstructor<Req, Res> = {}) {
    super()
    this.onError = options?.onError || onErrorHandler
    this.noMatchHandler = options?.noMatchHandler || this.onError.bind(null, { code: 404 })

    this.attach = (req) => setImmediate(this.handler.bind(this, req, undefined), req)
  }

  route(path: string): App {
    const app = new App()

    this.use(path, app)

    return app
  }

  use(...args: UseMethodParams<Req, Res, App>) {
    const base = args[0]

    const fns = args.slice(1).flat()

    if (base instanceof App) {
      // Set App parent to current App
      // @ts-ignore
      base.parent = this

      // Mount on root
      base.mountpath = '/'

      this.apps['/'] = base
    }

    const path = typeof base === 'string' ? base : '/'

    let regex: any

    for (const fn of fns) {
      if (fn instanceof App) {
        regex = rg(path, true)

        fn.mountpath = path

        this.apps[path] = fn

        // @ts-ignore
        fn.parent = this
      }
    }

    if (base === '/') {
      for (const fn of fns) super.use(base, mount(fn as Handler))
    } else if (typeof base === 'function' || base instanceof App) {
      super.use('/', [base, ...fns].map(mount))
    } else if (Array.isArray(base)) {
      super.use('/', [...base, ...fns].map(mount))
    } else {
      const handlerPaths = []
      const handlerFunctions = []
      for (const fn of fns) {
        if (fn instanceof App && fn.middleware?.length) {
          for (const mw of fn.middleware) {
            handlerPaths.push((base as string) + mw.path!)
            handlerFunctions.push(fn)
          }
        } else {
          handlerPaths.push('')
          handlerFunctions.push(fn)
        }
      }
      pushMiddleware(this.middleware)({
        path: base as string,
        regex,
        type: 'mw',
        handler: mount(handlerFunctions[0] as Handler),
        handlers: handlerFunctions.slice(1).map(mount),
        fullPaths: handlerPaths
      })
    }

    return this // chainable
  }

  find(url: string): Middleware<Req, any>[] {
    return this.middleware.filter((m) => {
      m.regex = m.regex || (rg(m.path, m.type === 'mw') as { keys: string[]; pattern: RegExp })

      let fullPathRegex: { keys: string[] | boolean; pattern: RegExp } | null

      m.fullPath && typeof m.fullPath === 'string'
        ? (fullPathRegex = rg(m.fullPath, m.type === 'mw'))
        : (fullPathRegex = null)

      return (
        m.regex.pattern.test(url) && (m.type === 'mw' && fullPathRegex?.keys ? fullPathRegex.pattern.test(url) : true)
      )
    })
  }
  handler(req: Req, next?: NextFunction): ResponseState {
    const res = { body: '', headers: new Headers({}), status: 200 } as ResponseState

    req._url = req.url
    req.originalUrl = req._url || req.originalUrl
    const pathname = getPathname(req.originalUrl)

    const matched = this.find(pathname)

    const exts = extend(this as any)

    const mw: Middleware<Req, Res>[] = [
      {
        handler: exts,
        type: 'mw',
        path: '/'
      },
      ...matched.filter((x) => req.method === 'HEAD' || (x.method ? x.method === req.method : true))
    ]

    if (matched[0] != null) {
      mw.push({
        type: 'mw',
        handler: (req, res, next) => {
          if (req.method === 'HEAD') {
            res.status = 204
            return res.end('')
          }
          next()
        },
        path: '/'
      })
    }

    mw.push({
      handler: this.noMatchHandler,
      type: 'mw',
      path: '/'
    })

    let idx = 0

    next = next || ((err: any) => (err ? this.onError(err, req) : loop()))

    const handle = (mw: Middleware<Req, Res>) => async (req: Req, res: Res, next: NextFunction) => {
      const { path = '/', handler, type, regex } = mw

      const params = regex ? getURLParams(regex, pathname) : {}

      if (type === 'route') req.params = params

      if (path.includes(':')) {
        const first = Object.values(params)[0]
        const url = req._url.slice(req._url.indexOf(first) + first?.length)
        req._url = url
      } else {
        req._url = req._url.substring(path.length)
      }

      if (!req.path) req.path = getPathname(req._url)

      // if (this.settings?.enableReqRoute) req.route = getRouteFromApp(this as any, handler)

      if (type === 'route') req.params = getURLParams(regex!, pathname)
      await applyHandler<Req, Res>(handler as unknown as Handler<Req, Res>)(req, res, next)
    }

    const loop = () => idx < mw.length && handle(mw[idx++])(req, res as unknown as Res, next as NextFunction)

    loop()

    return res
  }
  async listen(port: number = 3000, hostnameOrCb?: string | (() => void), cb?: () => void) {
    const hostname = typeof hostnameOrCb === 'string' ? hostnameOrCb : '0.0.0.0'
    const callback = typeof hostnameOrCb === 'function' ? hostnameOrCb : cb

    const server = new Server({
      handler: async (req, conn) => {
        const { body, ...init } = this.handler(req as any)

        return new Response(body, init)
      },
      addr: `${hostname}:${port}`
    })
    callback?.()
    await server.listenAndServe()
  }
}
