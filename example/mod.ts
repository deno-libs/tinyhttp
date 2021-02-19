import { App } from '../app.ts'

const app = new App()

app.use('/', (req, next) => {
  console.log(`${req.method} ${req.url}`)

  next()
})

app.get('/:name/', (req) => {
  req.respond({ body: `Hello ${req.params.name}!` })
})

app.listen(3000, () => console.log(`Started on :3000`))
