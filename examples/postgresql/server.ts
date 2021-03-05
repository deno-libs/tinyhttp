import { App, RHandler, Request } from '../../mod.ts'
import { Client } from 'https://deno.land/x/postgres@v0.8.0/mod.ts'

interface Req extends Request {
  bodyResult: Record<string, unknown>
}

const app = new App<unknown, Req>()
const port = parseInt(Deno.env.get('PORT') || '', 10) || 3000

const client = new Client({
  user: 'user',
  database: 'notes',
  hostname: 'localhost',
  port: 5432
})
await client.connect()

const bodyParser: RHandler<Req> = async (req, _, next) => {
  const buf = await Deno.readAll(req.body)

  const dec = new TextDecoder()

  const body = dec.decode(buf)

  try {
    const result = JSON.parse(body)
    req.bodyResult = result
  } catch (e) {
    next(e)
  }
  next()
}

app.get('/notes', async (_, res) => {
  const query = await client.queryObject('SELECT * FROM NOTES', { fields: ['id', 'name'] })
  res.send(query.rows)
})

app.use(bodyParser).post('/notes', async (req, res) => {
  const { title, desc } = req.bodyResult

  const query = await client.queryObject(`INSERT INTO users(title, desc) VALUES (${title}, ${desc});`)

  res.send(query.rows)
})

app.listen(port, () => console.log(`Started on http://localhost:${port}`))
