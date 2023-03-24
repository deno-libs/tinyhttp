import { STATUS_CODES } from 'https://deno.land/x/status@0.1.0/maps.ts'
import { serve, ConnInfo } from 'https://deno.land/std@0.181.0/http/server.ts'

type Handler = (req: Request, res: {body?: BodyInit, init?: ResponseInit}, next: () => void) => void | Promise<void>

interface Middleware {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
  handler: Handler
  path?: string
  type: 'mw' | 'route'
  pattern?: URLPattern
  fullPath?: string
}

class App {
  middleware: Middleware[]
  constructor() {
    this.middleware = []
  }
  use(path: string, handler: Handler) {
    this.middleware.push({ handler, type: 'mw', path: path })
  }
 async handler(_req: Request, connInfo: ConnInfo): Promise<Response> {
    const req = _req.clone() as Request & { _connInfo: ConnInfo}
    req._connInfo = connInfo
    const res: {body?: BodyInit, init?: ResponseInit} = {}

    let idx = 0
    const next = () => loop()
    const mw =this.middleware

    const loop = async () => (idx < mw.length &&  await mw[idx++].handler(req, res, next))

    await loop()

    return new Response(res.body, res.init)
  }
  async listen(port: number) {
   await serve(app.handler.bind(this), {port})
  }
}

const app = new App()

app.use('/', (_req, _res, next) => {
  console.log('hey')
  next()
})

app.use('/', (req, res) => {
  res.body = req.url
})

await app.listen(3000)