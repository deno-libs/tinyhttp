// deno-lint-ignore-file
import { NextFunction, Router, Handler, Middleware, UseMethodParams } from 'https://esm.sh/@tinyhttp/router'
import { onErrorHandler, ErrorHandler } from './onError.ts'
import 'https://deno.land/std@0.87.0/node/global.ts'
import rg from 'https://esm.sh/regexparam'
import { Request } from './request.ts'
import { getURLParams } from 'https://cdn.esm.sh/v15/@tinyhttp/url@1.1.2/esnext/url.js'
import { extendMiddleware } from './extend.ts'
import { serve, Server } from 'https://deno.land/std@0.87.0/http/server.ts'
import { parse } from './parseUrl.ts'

const lead = (x: string) => (x.charCodeAt(0) === 47 ? x : '/' + x)

export const applyHandler = <Req>(h: Handler<Req>) => async (req: Req, next: NextFunction) => {
  try {
    if (h.constructor.name === 'AsyncFunction') {
      await h(req, next)
    } else h(req, next)
  } catch (e) {
    next(e)
  }
}

/**
 * tinyhttp App has a few settings for toggling features
 */
export type AppSettings = Partial<
  Record<'networkExtensions' | 'freshnessTesting' | 'bindAppToReqRes' | 'enableReqRoute', boolean> &
    Record<'subdomainOffset', number> &
    Record<'xPoweredBy', string | boolean>
>
/**
 * Function that processes the template
 */
export type TemplateFunc<O> = (
  path: string,
  locals: Record<string, any>,
  opts: TemplateEngineOptions<O>,
  cb: (err: Error, html: unknown) => void
) => void

export type TemplateEngineOptions<O = any> = Partial<{
  cache: boolean
  ext: string
  renderOptions: Partial<O>
  viewsFolder: string
  _locals: Record<string, any>
}>

export class App<RenderOptions = any, Req extends Request = Request> extends Router<App, Req> {
  middleware: Middleware<Req>[] = []
  locals: Record<string, string> = {}
  noMatchHandler: Handler
  onError: ErrorHandler
  settings: AppSettings
  engines: Record<string, TemplateFunc<RenderOptions>> = {}
  applyExtensions?: (req: Request, next: NextFunction) => void

  constructor(
    options: Partial<{
      noMatchHandler: Handler<Req>
      onError: ErrorHandler
      settings: AppSettings
      applyExtensions: (req: Request, next: NextFunction) => void
    }> = {}
  ) {
    super()
    this.onError = options?.onError || onErrorHandler
    this.noMatchHandler = options?.noMatchHandler || this.onError.bind(null, { code: 404 })
    this.settings = options.settings || { xPoweredBy: true }
    this.applyExtensions = options?.applyExtensions
  }

  route(path: string): App {
    const app = new App()

    this.use(path, app)

    return app
  }

  use(...args: UseMethodParams<Req, any, App>) {
    const base = args[0]

    const fns: any[] = args.slice(1)

    if (base === '/') {
      for (const fn of fns) {
        if (Array.isArray(fn)) {
          super.use(base, fn)
        } else {
          super.use(base, fns)
        }
      }
    } else if (typeof base === 'function' || base instanceof App) {
      super.use('/', [base, ...fns])
    } else if (fns.some((fn) => fn instanceof App) && typeof base === 'string') {
      super.use(
        base,
        fns.map((fn: App) => {
          if (fn instanceof App) {
            fn.mountpath = typeof base === 'string' ? base : '/'
            fn.parent = this as any
          }

          return fn as any
        })
      )
    } else super.use(...args)

    return this // chainable
  }
  find(url: string, method: string) {
    return this.middleware.filter((m) => {
      if (!m.path) m.path = '/'
      m.regex = m.type === 'mw' ? rg(m.path, true) : rg(m.path)

      return (m.method ? m.method === method : true) && m.regex.pattern.test(url)
    })
  }
  /**
   * Extends Req / Res objects, pushes 404 and 500 handlers, dispatches middleware
   * @param req Req object
   * @param res Res object
   */
  handler(req: Req, next?: NextFunction) {
    /* Set X-Powered-By header */
    const { xPoweredBy } = this.settings
    if (xPoweredBy) req.headers.set('X-Powered-By', typeof xPoweredBy === 'string' ? xPoweredBy : 'tinyhttp')

    const exts = this.applyExtensions || extendMiddleware<RenderOptions>(this as any)

    req.originalUrl = req.url || req.originalUrl

    const { pathname } = parse(req.originalUrl)

    const mw: Middleware[] = [
      {
        handler: exts,
        type: 'mw',
        path: '/'
      },
      ...this.find(pathname, req.method),
      {
        handler: this.noMatchHandler,
        type: 'mw',
        path: '/'
      }
    ]

    const handle = (mw: Middleware) => async (req: Req, next: NextFunction) => {
      const { path = '/', handler, type, regex = rg('/') } = mw

      req.url = lead(req.url.substring(path.length)) || '/'

      req.path = parse(req.url).pathname

      if (type === 'route') req.params = getURLParams(regex, pathname)

      await applyHandler<Req>((handler as unknown) as Handler<Req>)(req, next)
    }

    let idx = 0

    next = next || ((err) => (err ? this.onError(err, req) : loop()))

    const loop = () => idx < mw.length && handle(mw[idx++])(req, next as NextFunction)

    loop()
  }

  /**
   * Creates HTTP server and dispatches middleware
   * @param port server listening port
   * @param Server callback after server starts listening
   * @param host server listening host
   */
  async listen(port: number, cb?: () => void, hostname = '0.0.0.0'): Promise<Server> {
    const server = serve({ port, hostname })

    cb?.()

    for await (const req of server) {
      this.handler(req as any)
    }
    return server
  }
}
