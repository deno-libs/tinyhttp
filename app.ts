import { ConnInfo, path, serve, ServeInit } from './deps.ts'
import { Router } from './router.ts'
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

const applyHandler =
  <Req extends Request = Request, Res extends THResponse = THResponse>(
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

export class App<
  RenderOptions = any,
  Req extends THRequest = THRequest,
  Res extends THResponse<RenderOptions> = THResponse<RenderOptions>,
> extends Router<Req, Res> {
  middleware: Middleware<Req, Res>[]
  settings: AppSettings & Record<string, any>
  locals: Record<string, string> = {}
  engines: Record<string, TemplateFunc<RenderOptions>> = {}
  onError: ServeInit['onError']
  notFound: Handler<Req, Res>
  constructor(options: AppConstructor<Req, Res> = {}) {
    super()
    this.settings = options.settings || { xPoweredBy: true }
    this.middleware = []
    this.onError = options?.onError || onErrorHandler
    this.notFound = options?.noMatchHandler || notFound
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
  find(url: string) {
    const { pathname } = new URL(url)
    const result = this.middleware.filter((mw) => {
      if (mw.type === 'mw') {
        return pathname.startsWith(mw.path)
      } else {
        const pattern = new URLPattern({ pathname: mw.path })
        return pattern.test(url)
      }
    })

    return result
  }
  /**
   * Extends Req / Res objects, pushes 404 and 500 handlers, dispatches middleware
   * @param req Request object
   */
  async handler(_req: Request, connInfo: ConnInfo): Promise<Response> {
    const exts = extendMiddleware<RenderOptions>(app)

    const req = _req.clone() as Req
    req.conn = connInfo

    const res: Pick<Res, '_body' | '_init'> = {
      _init: {
        headers: new Headers({
          'X-Powered-By': typeof this.settings.xPoweredBy === 'string'
            ? this.settings.xPoweredBy
            : 'tinyhttp',
        }),
      },
    }

    const matched = this.find(req.url).filter((x) =>
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

    let idx = 0, err: unknown | null = null
    const next: NextFunction = (error) => {
      if (error) err = error
      return loop()
    }
    const loop = async () => (idx < mw.length &&
      await applyHandler<Req, Res>(mw[idx++].handler)(req, res as Res, next))

    await loop()

    if (err) throw err // so that serve catches it

    return new Response(res._body, res._init)
  }
  /**
   * Creates HTTP server and dispatches middleware
   * @param port server listening port
   * @param Server callback after server starts listening
   * @param host server listening host
   */
  async listen(port: number, cb?: () => void, hostname?: string) {
    await serve(this.handler.bind(this), {
      port,
      onListen: cb,
      hostname,
      onError: this.onError,
    })
  }
}

const app = new App()

app.get('/', (req, res, next) => {
  res.redirect('/re')
})
app.get('/re', (req, res) => void res.send('redir'))
await app.listen(3000)
