import { ConnInfo, path, ServeInit } from './deps.ts'
import { pushMiddleware, Router, UseMethodParams } from './router.ts'
import { THResponse } from './response.ts'
import { extendMiddleware } from './extend.ts'
import { THRequest } from './request.ts'
import type {
  AppConstructor,
  AppSettings,
  Handler,
  Middleware,
  NextFunction,
  TemplateEngineOptions,
  TemplateFunc,
} from './types.ts'
import { onErrorHandler } from './onError.ts'

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
      next(e)
    }
  }

const notFound: Handler = (req, res) =>
  void res.status(404).send(`Cannot ${req.method} ${new URL(req.url).pathname}`)

const mount = (fn: App | Handler) => (fn instanceof App ? fn.attach : fn)

export class App<
  RenderOptions = any,
  Req extends THRequest = THRequest,
  Res extends THResponse<RenderOptions> = THResponse<RenderOptions>,
> extends Router<App, Req, Res> {
  middleware: Middleware<Req, Res>[]
  settings: AppSettings & Record<string, any>
  locals: Record<string, string> = {}
  engines: Record<string, TemplateFunc<RenderOptions>> = {}
  onError: (err: unknown) => Response | Promise<Response>
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
   * Render a template
   * @param file What to render
   * @param data data that is passed to a template
   * @param options Template engine options
   * @param cb Callback that consumes error and html
   */
  render(
    file: string,
    data: Record<string, unknown> = {},
    cb: (err: unknown, html: unknown) => void,
    options: TemplateEngineOptions<RenderOptions> = {},
  ) {
    options.viewsFolder = options.viewsFolder || `${Deno.cwd()}/views`
    options.ext = options.ext || file.slice(file.lastIndexOf('.') + 1) || 'ejs'

    options._locals = options._locals || {}

    let locals = { ...data, ...this.locals }

    if (options._locals) locals = { ...locals, ...options._locals }

    if (!file.endsWith(`.${options.ext}`)) file = `${file}.${options.ext}`

    const dest = options.viewsFolder
      ? path.join(options.viewsFolder, file)
      : file

    this.engines[options.ext](dest, locals, options.renderOptions || {}, cb)

    return this
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
          mw.fullPath = handlerPathBase + lead(mw.path!) // hotfix
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
      // @ts-ignore
      handlers: handlerFunctions.slice(1).map(mount),
      fullPaths: handlerPaths,
    })

    return this
  }
  #find(url: string) {
    const { pathname } = new URL(url)
    const result = this.middleware.filter((m) => {
      const path = m.fullPath || m.path
      if (m.type === 'mw') {
        return pathname.startsWith(path!)
      } else {
        const pattern = new URLPattern({ pathname: path })
        return pattern.test(url)
      }
    })

    return result
  }
  /**
   * Extends Req / Res objects, pushes 404 and 500 handlers, dispatches middleware
   * @param req Request object
   */
  async #prepare(
    req: Req,
    res: { _init?: ResponseInit } = { _init: {} },
  ) {
    const exts = extendMiddleware<RenderOptions>(this as unknown as App)

    const matched = this.#find(req.url).filter((x) =>
      req.method === 'HEAD' || (x.method ? x.method === req.method : true)
    )

    const mw: Middleware<Req, Res>[] = [
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
        handler: (req, res, next) => {
          if (req.method === 'HEAD') {
            res.status(204).end('')
          } else next()
        },
        path: '/',
      })
    }
    mw.push({ type: 'mw', handler: this.notFound, path: '/' })

    let idx = 0, err
    const next: NextFunction = (error) => {
      if (error) err = error
      return loop()
    }
    const loop = async () => (idx < mw.length &&
      await applyHandler<Req, Res>(mw[idx++].handler)(
        req,
        res as Res,
        next,
      ))

    await loop()
    if (err) throw err
  }
  handler = async (_req: Request, connInfo?: ConnInfo) => {
    const req = _req.clone() as Req
    req.conn = connInfo!
    const res = {
      _init: {
        headers: new Headers({
          'X-Powered-By': typeof this.settings.xPoweredBy === 'string'
            ? this.settings.xPoweredBy
            : 'tinyhttp',
        }),
      },
      _body: undefined,
    }
    try {
      await this.#prepare(req, res)
    } catch (e) {
      return this.onError(e)
    }
    return new Response(res._body, res._init)
  }
  /**
   * Creates HTTP server and dispatches middleware
   * @param port server listening port
   * @param Server callback after server starts listening
   * @param host server listening host
   */
  async listen(port: number, cb?: () => void, hostname?: string) {
    const listener = Deno.listen({ hostname, port })
    for await (const conn of listener) {
      ;(async () => {
        const requests = Deno.serveHttp(conn)
        for await (const { request, respondWith } of requests) {
          const response = await this.handler(request, conn)
          if (response) {
            respondWith(response)
          }
        }
      })
    }
  }
}
