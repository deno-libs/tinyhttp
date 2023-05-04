import PouchDB from 'https://deno.land/x/pouchdb_deno@2.1.3-PouchDB+7.3.0/modules/pouchdb/mod.ts'
import { App, THRequest } from '../../mod.ts'

const app = new App<unknown, THRequest & { _body: Record<string, string> }>()

const db = new PouchDB('todos')

app.use(async (req, _, next) => {
  if (req.method === 'POST') req._body = await req.json()
  await next()
})

// get all tasks
app.get('/todos', async (_, res) => {
  const { rows } = await db.allDocs({ include_docs: true })
  await res.send(rows.map((x) => x.doc))
})

// add a new task
app.post('/todos', async (req, res) => {
  const { task, date } = req._body
  await db.put({ task, date, _id: task })
  await res.send(`New task "${task}" has been added!`)
})

// update an existing task
app.put('/todos', async (req, res) => {
  const { _id, _rev, task, date } = req._body
  await db.put({ _id, _rev, task, date })
  await res.send(`Task ${task} has been updated!`)
})

// delete a existing task
app.delete('/todos', async (req, res) => {
  const { _id, _rev, task } = req._body
  await db.remove({ _id, _rev })
  res.send(`Task "${task} has been removed!"`)
})

app.listen(3000, () => console.log(`Started on http://localhost:3000`))
