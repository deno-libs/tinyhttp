import { App } from '../../app.ts'
import { serveTls } from 'https://deno.land/std@0.181.0/http/server.ts'
import { THRequest } from '../../request.ts'

const app = new App()

app.get('/', (req, res) => void res.send(`Hello World from ${req.protocol}`))

await serveTls(async (_req, connInfo) => {
  const req = _req.clone() as THRequest
  req.conn = connInfo
  return await app.handler(req)
}, {
  port: 3000,
  onError: app.onError,
  certFile: './cert.pem',
  keyFile: './key.pem',
})
