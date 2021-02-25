import { App } from '../app.ts'

const __dirname = new URL('.', import.meta.url).pathname

const app = new App()

app.get('/', (_, res) => {
  const path = __dirname + 'mod.ts'

  res.sendFile(path)
})

app.listen(3000, () => console.log(`Started on :3000`))
