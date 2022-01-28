import { Router, Server, rg, setImmediate, pushMiddleware, path, ConnInfo } from './deps.ts'
import type { Middleware, Handler, UseMethodParams, NextFunction } from './deps.ts'
import { getPathname, getURLParams } from './utils/parseUrl.ts'
import { ErrorHandler, onErrorHandler } from './onError.ts'
import type { THRequest } from './request.ts'
import type { THResponse } from './response.ts'
import { extendMiddleware } from './extend.ts'
import { TemplateEngineOptions, TemplateFunc } from './utils/template.ts'
import { AppSettings, AppConstructor } from './types.ts'
import { getRouteFromApp } from './extensions/req/route.ts'

const mount = (fn: any) => (fn instanceof App ? fn.attach : fn)

/**
 * Add leading slash if not present (e.g. path -> /path, /path -> /path)
 * @param x
 */
const lead = (x: string) => (x.charCodeAt(0) === 47 ? x : '/' + x)

declare global {
  namespace tinyhttp {
    // These open interfaces may be extended in an application-specific manner via declaration merging.
    interface Request {}
    interface Response {}
    interface Application {}
  }
}

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

export class App<
  RenderOptions = any,
  Req extends THRequest = THRequest,
  Res extends THResponse<RenderOptions> = THResponse<RenderOptions>
> extends Router<App, Req, Res> {
  middleware: Middleware<Req>[] = []
  locals: Record<string, string> = {}
  noMatchHandler: Handler
  onError: ErrorHandler
  settings: AppSettings & Record<string, any> = {}
  engines: Record<string, TemplateFunc<RenderOptions>> = {}
  applyExtensions?: (req: Req, res: Res, next: NextFunction) => void
  attach: (req: Req) => void

  mountpath = '/'

  apps: Record<string, App> = {}
  _server?: Server
  _serverHandler: (req: Request, conn?: ConnInfo) => Promise<Response>

  constructor(options: AppConstructor<Req, Res> = {}) {
    super()
    this.onError = options?.onError || onErrorHandler
    this.noMatchHandler = options?.noMatchHandler || this.onError.bind(null, { code: 404 })
    this.settings = options.settings || { xPoweredBy: true }
    this.applyExtensions = options?.applyExtensions
    this.attach = (req) => setImmediate(this.handler.bind(this, req, undefined), req)

    this._serverHandler = async (req: any, conn) => {
      req.conn = conn
      const { body, ...init } = this.handler(req)

      return new Response(body, init)
    }
  }

  set(setting: string, value: any) {
    this.settings[setting] = value
    return this
  }

  enable(setting: string) {
    this.settings[setting] = true
    return this
  }

  disable(setting: string) {
    this.settings[setting] = false
    return this
  }

  /**
   * Register a template engine with extension
   */
  engine(ext: string, fn: TemplateFunc<RenderOptions>) {
    this.engines[ext] = fn

    return this
  }

  /**
   * Render a template
   * @param file What to render
   * @param data data that is passed to a template
   * @param options Template engine options
   * @param cb Callback that consumes error and html
   */
  render(
    file: string,
    data: Record<string, any> = {},
    cb: (err: unknown, html: unknown) => void,
    options: TemplateEngineOptions<RenderOptions> = {}
  ) {
    options.viewsFolder = options.viewsFolder || `${Deno.cwd()}/views`
    options.ext = options.ext || file.slice(file.lastIndexOf('.') + 1) || 'ejs'

    options._locals = options._locals || {}

    let locals = { ...data, ...this.locals }

    if (options._locals) locals = { ...locals, ...options._locals }

    if (!file.endsWith(`.${options.ext}`)) file = `${file}.${options.ext}`

    const dest = options.viewsFolder ? path.join(options.viewsFolder, file) : file

    this.engines[options.ext](dest, locals, options.renderOptions || {}, cb)

    return this
  }

  route(path: string): App {
    const app = new App()

    this.use(path, app)

    return app
  }

  use(...args: UseMethodParams<Req, Res, App>): this {
    const base = args[0]

    const fns = args.slice(1).flat()

    if (typeof base === 'function' || base instanceof App) {
      fns.unshift(base)
    } else if (Array.isArray(base)) {
      fns.unshift(...base)
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

    const handlerPaths = []
    const handlerFunctions = []
    const handlerPathBase = path === '/' ? '' : lead(path)
    for (const fn of fns) {
      if (fn instanceof App && fn.middleware?.length) {
        for (const mw of fn.middleware) {
          handlerPaths.push(handlerPathBase + lead(mw.path!))
          handlerFunctions.push(fn)
        }
      } else {
        handlerPaths.push('')
        handlerFunctions.push(fn)
      }
    }

    pushMiddleware(this.middleware)({
      path,
      regex,
      type: 'mw',
      handler: mount(handlerFunctions[0] as Handler),
      handlers: handlerFunctions.slice(1).map(mount),
      fullPaths: handlerPaths
    })

    return this
  }

  find(url: string): Middleware<Req, Res>[] {
    return this.middleware.filter((m) => {
      // @ts-ignore
      m.regex = m.regex || rg(m.path, m.type === 'mw')

      let fullPathRegex: any

      m.fullPath && typeof m.fullPath === 'string'
        ? (fullPathRegex = rg(m.fullPath, m.type === 'mw'))
        : (fullPathRegex = null)

      return m.regex!.pattern.test(url) && (m.type === 'mw' && fullPathRegex ? fullPathRegex.pattern.test(url) : true)
    })
  }

  handler(req: Req, next?: NextFunction): THResponse {
    const res = { body: '', headers: new Headers({}), status: 200 } as THResponse

    /* Set X-Powered-By header */
    const { xPoweredBy } = this.settings
    if (xPoweredBy) res.headers.set('X-Powered-By', typeof xPoweredBy === 'string' ? xPoweredBy : 'tinyhttp')

    req._url = req.url
    req.originalUrl = req._url || req.originalUrl
    const pathname = getPathname(req.originalUrl)

    const matched = this.find(pathname)

    const exts = extendMiddleware(this as any)

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

    next = next || ((err: any) => (err ? this.onError(err, req, res) : loop()))

    const handle = (mw: Middleware) => async (req: Req, res: Res, next: NextFunction) => {
      const { path, handler, regex } = mw

      const params = regex ? getURLParams(regex, pathname) : {}

      req.params = { ...req.params, ...params }

      if (path!.includes(':')) {
        const first = Object.values(params)[0]
        const url = req.url.slice(req._url.indexOf(first) + first?.length)
        req._url = lead(url)
      } else {
        req._url = lead(req.url.substring(path!.length))
      }

      if (!req.path) req.path = getPathname(req.url)

      if (this.settings?.enableReqRoute) req.route = getRouteFromApp(this as any, handler)

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
      handler: this._serverHandler,
      hostname,
      port
    })
    this._server = server
    callback?.()
    await server.listenAndServe()
    return server
  }
}
