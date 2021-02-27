import { App } from '../../app.ts'

const app = new App()

app.get('/:name/', (req, res) => {
  res.send(`Hello on ${req.url} from Deno v${Deno.version.deno} and tinyhttp! 🦕`)
})

app.listen(3000, () => console.log(`Started on :3000`))
