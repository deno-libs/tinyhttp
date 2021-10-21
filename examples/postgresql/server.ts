import { App } from '../../mod.ts'
import { Client } from 'https://deno.land/x/postgres@v0.13.0/mod.ts'
import { json } from 'https://deno.land/x/parsec@0.1.1/mod.ts'

const app = new App()
const port = parseInt(Deno.env.get('PORT') || '', 10) || 3000

const client = new Client({
  user: 'user',
  database: 'notes',
  hostname: 'localhost',
  port: 5432
})
await client.connect()

app.get('/notes', async (_, res) => {
  const query = await client.queryObject('SELECT * FROM NOTES', { fields: ['id', 'name'] })
  res.send(query.rows)
})

app.use(json).post('/notes', async (req, res) => {
  const { title, desc } = req.parsedBody!

  const query = await client.queryObject(`INSERT INTO users(title, desc) VALUES (${title}, ${desc});`)

  res.send(query.rows)
})

app.listen(port, () => console.log(`Started on http://localhost:${port}`))
