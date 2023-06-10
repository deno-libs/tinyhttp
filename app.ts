import { path } from './deps.ts'
import { extendMiddleware } from './extend.ts'
import { getRouteFromApp } from './extensions/req/route.ts'
import { onErrorHandler } from './onError.ts'
import { THRequest } from './request.ts'
import { DummyResponse, THResponse } from './response.ts'
import { pushMiddleware, Router, UseMethodParams } from './router.ts'
import type {
  AppConstructor,
  AppSettings,
  ConnInfo,
  Handler,
  Middleware,
  NextFunction,
  TemplateEngineOptions,
  TemplateFunc,
} from './types.ts'

/**
 * Add leading slash if not present (e.g. path -> /path, /path -> /path)
 * @param x
 */
const lead = (x: string) => (x.charCodeAt(0) === 47 ? x : '/' + x)

const applyHandler =
  <Req extends THRequest = THRequest, Res extends THResponse = THResponse>(
    h: Handler<Req, Res>,
  ) =>
  async (req: Req, res: Res, next: NextFunction) => {
    try {
      await h(req, res, next!)
    } catch (e) {
      await next(e)
    }
  }

async function notFound(req: Request, res: THResponse) {
  res.status(404)
  await res.send(
    `Cannot ${req.method} ${new URL(req.url).pathname}`,
  )
}

const mount = (fn: App | Handler) => (fn instanceof App ? fn.attach : fn)

export class App<
  RenderOptions = any,
  Req extends THRequest = THRequest,
  Res extends THResponse<RenderOptions> = THResponse<RenderOptions>,
> extends Router<App, Req, Res> {
  middleware: Middleware<Req, Res>[]
  settings: AppSettings & Record<string, unknown>
  locals: Record<string, string> = {}
  engines: Record<string, TemplateFunc<RenderOptions>> = {}
  onError: (err: unknown, req?: Request) => Response | Promise<Response>
  notFound: Handler<Req, Res>
  attach: (req: Req, res: Res, next: NextFunction) => void

  constructor(options: AppConstructor<Req, Res> = {}) {
    super()
    this.settings = options.settings || { xPoweredBy: true }
    this.middleware = []
    this.onError = options?.onError || onErrorHandler
    this.notFound = options?.noMatchHandler || notFound
    this.attach = (req, res) => this.#prepare.bind(this, req, res)()
  }
  /**
   * Set app setting
   * @param setting setting name
   * @param value setting value
   */
  set<T = unknown>(setting: string, value: T): this {
    this.settings[setting] = value

    return this
  }

  /**
   * Enable app setting
   * @param setting Setting name
   */
  enable(setting: string): this {
    this.settings[setting] = true

    return this
  }

  /**
   * Disable app setting
   * @param setting
   */
  disable(setting: string): this {
    this.settings[setting] = false

    return this
  }
  /**
   * Render a template
   * @param file What to render
   * @param data data that is passed to a template
   * @param options Template engine options
   */
  async render(
    file: string,
    data: Record<string, unknown> = {},
    options: TemplateEngineOptions<RenderOptions> = {},
  ) {
    options.viewsFolder = options.viewsFolder ||
      (this.settings.views as string) || `${Deno.cwd()}/views`
    options.ext = options.ext || file.slice(file.lastIndexOf('.') + 1) || 'ejs'

    options._locals = options._locals || {}

    let locals = { ...data, ...this.locals }

    if (options._locals) locals = { ...locals, ...options._locals }

    if (!file.endsWith(`.${options.ext}`)) file = `${file}.${options.ext}`

    const dest = options.viewsFolder
      ? path.join(options.viewsFolder, file)
      : file

    return await this.engines[options.ext](
      dest,
      locals,
      options.renderOptions || {},
    )
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
    for (const fn of fns) {
      if (fn instanceof App) {
        fn.mountpath = path
        this.apps[path] = fn

        fn.parent = this as any
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
          mw.fullPath = handlerPathBase + (mw.path!) // hotfix
        }
      } else {
        handlerPaths.push('')
        handlerFunctions.push(fn)
      }
    }
    pushMiddleware(this.middleware)({
      path,
      type: 'mw',
      handler: mount(handlerFunctions[0] as Handler),
      // @ts-ignore type conflict
      handlers: handlerFunctions.slice(1).map(mount),
      fullPaths: handlerPaths,
    })

    return this
  }
  /**
   * Register a template engine with extension
   */
  engine(ext: string, fn: TemplateFunc<RenderOptions>): this {
    this.engines[ext] = fn

    return this
  }
  route(path: string): App {
    const app = new App()

    this.use(path, app)

    return app
  }
  #find(url: URL) {
    const result = this.middleware.map((m) => {
      const path = m.fullPath! || m.path!
      return {
        ...m,
        pattern: new URLPattern({
          pathname: m.type === 'mw'
            ? m.path === '/'
              ? 
              `${path.endsWith('/') ? path.slice(0, path.length - 1) : path }/([^\/]*)?` 
              : '*'
            : path,
        }),
      }
    }).filter((m) => {
      const res = m.pattern.test(url)
      return res
    })
    return result
  }
  /**
   * Extends Req / Res objects, pushes 404 and 500 handlers, dispatches middleware
   * @param req Request object
   */
  async #prepare(
    req: Req,
    res: { _init?: ResponseInit; _body?: BodyInit },
  ) {
    req._urlObject = new URL(req.url)
    const exts = extendMiddleware<RenderOptions>(this as unknown as App)
    const matched = this.#find(req._urlObject).filter((x) =>
      req.method === 'HEAD' || (x.method ? x.method === req.method : true)
    )
    const mw: Middleware<Req, Res>[] = 'fresh' in req ? matched : [
      {
        handler: exts,
        type: 'mw',
        path: '/',
      },
      ...matched,
    ]

    if (matched[0] != null) {
      mw.push({
        type: 'mw',
        handler: async (req, res, next) => {
          if (req.method === 'HEAD') {
            res.status(204).end('')
          } else await next()
        },
        path: '/',
      })
    }
    mw.push({ type: 'mw', handler: this.notFound, path: '/' })

    const handle =
      (mw: Middleware<Req, Res>) =>
      async (req: Req, res: Res, next: NextFunction) => {
        const { handler, type, pattern } = mw

        const params =
          type === 'route' && pattern?.exec(req.url)?.pathname.groups || {}

        req.params = params as Record<string, string>

        if (this.settings?.enableReqRoute) {
          req.route = getRouteFromApp(this.middleware as any, handler as any)
        }
        await applyHandler<Req, Res>(handler)(req, res, next)
      }

    let idx = 0, err: unknown | undefined
    const next: NextFunction = async (error) => {
      if (error) err = error
      return await loop()
    }
    const loop = async () =>
      idx < mw.length
        ? await handle(mw[idx++])(
          req,
          res as Res,
          next,
        )
        : undefined

    await loop()

    if (err) throw err
  }
  handler = async (_req: Request, connInfo?: ConnInfo) => {
    const req = _req.clone() as Req
    req.conn = connInfo!
    const res: DummyResponse = {
      _init: {
        headers: new Headers(
          this.settings.xPoweredBy
            ? {
              'X-Powered-By': typeof this.settings.xPoweredBy === 'string'
                ? this.settings.xPoweredBy
                : 'tinyhttp',
            }
            : {},
        ),
      },
      _body: undefined,
      locals: {},
    }
    try {
      await this.#prepare(req, res)
    } catch (e) {
      return await this.onError(e, req)
    }
    return new Response(res._body, res._init)
  }
  /**
   * Creates HTTP server and dispatches middleware
   * @param port server listening port
   * @param host server listening host
   * @param Server callback after server starts listening
   */
  async listen(port: number, hostname?: string, cb?: (error: any) => void) {
    const listener = Deno.listen({ hostname, port })

    const denoListener = async () => {
      for await (const conn of listener) {
        const requests = Deno.serveHttp(conn)
        for await (const { request, respondWith } of requests) {
          const response = await this.handler.bind(this, request, conn)()
          if (response) {
            respondWith(response)
          }
        }
      }
    }
    await denoListener.bind(this)().catch(error => cb!(error))
    return listener
  }
}
