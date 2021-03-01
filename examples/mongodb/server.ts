import { App, Handler } from '../../app.ts'
import { Request } from '../../request.ts'
import { MongoClient, Bson } from 'https://deno.land/x/mongo@v0.21.2/mod.ts'
import * as dotenv from 'https://deno.land/x/tiny_env@1.0.0/mod.ts'

dotenv.load()

type Req = Request & {
  bodyResult: any
}

const app = new App<any, Req>()
const port = parseInt(Deno.env.get('PORT') || '') || 3000

// connect to mongodb
const client = new MongoClient()

await client.connect(Deno.env.get('DB_URI') || '')

const db = client.database('notes')
const coll = db.collection('notes')

// get all notes
app.get('/notes', async (_, res, next) => {
  try {
    const r = await coll.find({}).toArray()

    res.send(r)
    next()
  } catch (err) {
    next(err)
  }
})

const bodyParser: Handler<Req> = async (req, _res, next) => {
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
app.use(bodyParser)

// add new note
app.post('/notes', async (req, res, next) => {
  try {
    const { title, desc } = req.bodyResult
    await coll.insertOne({ title, desc })

    res.send(`Note with title of "${title}" has been added`)
  } catch (err) {
    next(err)
  }
})

// delete note
app.delete('/notes', async (req, res, next) => {
  try {
    const { id } = req.bodyResult
    await coll.deleteOne({ _id: new Bson.ObjectId(id) })

    res.send(`Note with id of ${id} has been deleted`)
  } catch (err) {
    next(err)
  }
})

// update existing note
app.put('/notes', async (req, res, next) => {
  try {
    const { title, desc, id } = req.bodyResult
    await coll.updateOne({ _id: new Bson.ObjectId(id) }, { $set: { title, desc } })
    res.send(`Note with title of ${title} has been updated`)
  } catch (err) {
    next(err)
  }
})

app.listen(port, () => console.log(`Started on http://localhost:${port}`))
