import { App } from '../../mod.ts'

const app = new App()

app
  .get('/', (req, res) => {
    const greeting = `Hello on ${req.url} from Deno v${Deno.version.deno} and tinyhttp! 🦕`
    res.format({
      text: (_, res) => res.send(greeting),
      html: (_, res) => res.send(`<h1>${greeting}</h1>`)
    })
  })
  .get('/page/:page/', (req, res) => {
    res.status = 200
    res.send(`
  <h1>Some cool page</h1>
  <h2>URL</h2>
  ${req.url}
  <h2>Params</h2>
  ${JSON.stringify(req.params, null, 2)}
`)
  })

app.listen(3000, () => console.log(`Listening on http://localhost:3000`))
