import { App } from '../app.ts'

const app = new App()

app.use('/', (req, res, next) => {
  console.log(`${req.method} ${req.url}`)

  res.headers.set('Test-Header', 'Value')

  next()
})

app.get('/:name/', (req, res) => {
  res.send(`Hello on ${req.url} from Deno and tinyhttp! 🦕`)
})

app.listen(3000, () => console.log(`Started on :3000`))
