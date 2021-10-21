import { App } from '../../mod.ts'
import { MongoClient, Bson } from 'https://deno.land/x/mongo@v0.27.0/mod.ts'
import * as dotenv from 'https://deno.land/x/tiny_env@1.0.0/mod.ts'
import { json } from 'https://deno.land/x/parsec@0.1.1/mod.ts'

dotenv.load()

const app = new App()
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

app.use(json)

// add new note
app.post('/notes', async (req, res, next) => {
  try {
    const { title, desc } = req.parsedBody!
    await coll.insertOne({ title, desc })

    res.end(`Note with title of "${title}" has been added`)
  } catch (err) {
    next(err)
  }
})

// delete note
app.delete('/notes', async (req, res, next) => {
  try {
    const { id } = req.parsedBody!
    await coll.deleteOne({ _id: new Bson.ObjectId(id) })

    res.end(`Note with id of ${id} has been deleted`)
  } catch (err) {
    next(err)
  }
})

// update existing note
app.put('/notes', async (req, res, next) => {
  try {
    const { title, desc, id } = req.parsedBody!
    await coll.updateOne({ _id: new Bson.ObjectId(id) }, { $set: { title, desc } })
    res.end(`Note with title of ${title} has been updated`)
  } catch (err) {
    next(err)
  }
})

app.listen(port, () => console.log(`Started on http://localhost:${port}`))
