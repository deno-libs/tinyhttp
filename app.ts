import type { THRequest as Req } from './request.ts'
import type { THResponse } from './response.ts'
import { Handler, METHODS, Middleware, NextFunction, Router } from './router.ts'
import { ErrorHandler, onError } from './onError.ts'
import { AppConstructor, AppSettings } from './types.ts'

const getURLParams = (pattern: URLPattern, pathname: string) => pattern.exec(pathname)?.pathname.groups

const applyHandler =
  <Req extends Request = Request>(h: Handler<Req>) =>
  async (req: Req, res: THResponse, next: NextFunction) => {
    try {
      if (h.constructor.name === 'AsyncFunction') {
        await h(req, res, next)
      } else h(req, res, next)
    } catch (e) {
      next(e)
    }
  }

const mountSubapp = (app: App, subapp: App, path = '/') => {
  subapp.mountpath = path
  app.apps[path] = subapp
  subapp.parent = app
  app.middleware = [
    ...app.middleware,
    ...subapp.middleware.map((m) => {
      m.pattern = new URLPattern({ pathname: `${path}${m.pattern.hostname === '*' ? '' : m.pattern.hostname}*?` })

      return m
    })
  ]
  for (const method of METHODS) {
    app.routes[method] = [
      ...app.routes[method],
      ...subapp.routes[method].map((m) => {
        m.pattern = new URLPattern({ pathname: `${path}${m.pattern.hostname === '*' ? '' : m.pattern.hostname}` })

        return m
      })
    ]
  }
}

export class App extends Router<Req> {
  noMatchHandler: Handler<Req>
  onError: ErrorHandler
  mountpath = '/'
  apps: Record<string, App> = {}
  parent?: App
  settings: AppSettings

  constructor(options: AppConstructor<Req, THResponse> = {}) {
    super()
    this.onError = options.onError || onError
    this.noMatchHandler = options.noMatchHandler || onError.bind(null, { code: 404 })
    this.settings = options.settings || { xPoweredBy: true }
  }

  use(base: string | Handler<Req> | App, ...handlers: (Handler<Req> | App)[]) {
    const apps = handlers.filter((h) => h instanceof App) as App[]
    if (base instanceof App) {
      mountSubapp(this, base, '/')
    } else if (apps.length !== 0 && typeof base === 'string') {
      apps.forEach((app) => mountSubapp(this, app, base))
    } else super.use(base, ...(handlers as Handler<Req>[]))

    return this
  }

  handler(_req: Request, next?: NextFunction): Response {
    const res: Pick<THResponse, 'bodyInit' | 'init' | 'headers'> = { bodyInit: '', init: {}, headers: new Headers({}) }

    /* Set X-Powered-By header */
    const { xPoweredBy } = this.settings
    if (xPoweredBy) res.headers.set('X-Powered-By', typeof xPoweredBy === 'string' ? xPoweredBy : 'tinyhttp')

    let req = _req as Req
    req.params = {}

    const mw = [...this.middleware, ...this.routes[req.method]].filter((m) =>
      m.pattern.test({
        pathname: new URL(_req.url).pathname
      })
    )

    // no match handler
    mw.push({
      handler: this.noMatchHandler,
      pattern: new URLPattern({ pathname: '/*?' })
    })

    let idx = 0

    next = next || ((err: any) => (err ? this.onError(err, req, res as THResponse) : loop()))

    const handle = (mw: Middleware<Req>) => async (req: Req, res: THResponse, next: NextFunction) => {
      const { pattern, handler } = mw

      const params = getURLParams(pattern, req.url)

      req.params = { ...req.params, ...params }

      await applyHandler<Req>(handler)(req, res, next)
    }

    const loop = () => idx < mw.length && handle(mw[idx++])(req, res as THResponse, next!)

    loop()

    return new Response(res.bodyInit, {
      ...res.init,
      headers: new Headers({ ...res.init.headers, ...res.headers })
    })
  }
  async listen(port: number) {
    const server = Deno.listen({ port })

    for await (const conn of server) {
      ;(async () => {
        const httpConn = Deno.serveHttp(conn)
        for await (const requestEvent of httpConn) {
          requestEvent.respondWith(this.handler(requestEvent.request))
        }
      })()
    }
  }
}
