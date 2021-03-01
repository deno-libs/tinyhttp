import { App } from '../../app.ts'
// import { MongoClient, Bson } from 'https://deno.land/x/mongo@v0.21.0/mod.ts'
// import * as dotenv from 'https://deno.land/x/dotenv/mod.ts'

// dotenv.config()

const app = new App()
const port = parseInt(Deno.env.get('PORT') || '') || 3000

// connect to mongodb
/* const client = new MongoClient()

await client.connect(Deno.env.get('DB_URI') || '')

const db = client.database('notes')
const coll = db.collection('notes') */

app.get(async (req, res) => {
  const buf: Uint8Array = await Deno.readAll(req.body)

  console.log(buf.toString())

  res.send('bruh')
})

/* // get all notes
app.get('/notes', async (_, res, next) => {
  try {
    const r = await coll.find({}).toArray()
    res.send(r)
    next()
  } catch (err) {
    next(err)
  }
})

// add new note
app.post('/notes', async (req, res, next) => {
  try {


    if (result?.value) {
      const { title, desc } = result.value
      const r = await coll.insertOne({ title, desc })
      assertStrictEquals(1, r.insertedCount)
      res.send(`Note with title of "${title}" has been added`)
    } else {
      next('No body provided')
    }
  } catch (err) {
    next(err)
  }
})
 */
/* // delete note
app.delete('/notes', async (req, res, next) => {
  try {
    const { id } = req.body
    const r = await coll.deleteOne({ _id: new Bson.ObjectId(id) })
    assertStrictEquals(1, r)
    res.send(`Note with id of ${id} has been deleted`)
  } catch (err) {
    next(err)
  }
})

// update existing note
app.put('/notes', async (req, res, next) => {
  try {
    const { title, desc, id } = req.body
    await coll.findOneAndUpdate(
      { _id: new mongodb.ObjectId(id) },
      { $set: { title, desc } },
      { returnOriginal: false, upsert: true }
    )
    res.send(`Note with title of ${title} has been updated`)
  } catch (err) {
    next(err)
  }
})
 */
app.listen(port, () => console.log(`Started on http://localhost:${port}`))
