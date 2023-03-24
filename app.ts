import { ConnInfo, serve } from './deps.ts'
import { Router } from './router.ts'
import { THResponse } from './response.ts'
import { extendMiddleware } from './extend.ts'
import { THRequest } from './request.ts'
import type { Middleware } from './types.ts'

export class App<RenderOptions = any> extends Router<Request, THResponse> {
  middleware: Middleware[]
  constructor() {
    super()
    this.middleware = []
  }

  async handler(_req: Request, connInfo: ConnInfo): Promise<Response> {
    const exts = extendMiddleware<RenderOptions>()

    const req = _req.clone() as THRequest
    req._connInfo = connInfo
    const res: { _body?: BodyInit; _init?: ResponseInit } = {}

    let idx = 0
    const next = () => loop()
    const mw = [{
      handler: exts,
      type: 'mw',
      path: '/',
    }, ...this.middleware]

    const loop = async () => (idx < mw.length &&
      await mw[idx++].handler(req, res as any, next))

    await loop()

    return new Response(res._body, res._init)
  }
  async listen(port: number) {
    await serve(app.handler.bind(this), { port })
  }
}

const app = new App()

app.use('/', (_req, _res, next) => {
  console.log('hey')
  next()
})

app.use('/', (req, res) => {
  res.end(req.url)
})

await app.listen(3000)
