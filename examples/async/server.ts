import { App } from '../../mod.ts'

const app = new App()

app.get('/', async (_, res) => {
  const decoder = new TextDecoder('utf-8')
  const file = await Deno.readFile(`test.txt`)

  res.end(file)
})

app.listen(3000, () => console.log('Started on http://localhost:3000'))
