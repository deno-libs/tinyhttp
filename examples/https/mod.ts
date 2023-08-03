import { App } from '../../app.ts'

const app = new App()

app.get('/', async (req, res) => {
  await res.send(`Hello World from ${req.protocol}`)
})

Deno.serve(
  {
    port: 3000,
    cert: await Deno.readTextFile('./cert.pem'),
    key: await Deno.readTextFile('./key.pem'),
  },
  (req) => app.handler(req),
)
