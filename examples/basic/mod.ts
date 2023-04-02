import { App } from '../../app.ts'

const app = new App()

app
  .get('/', async (_, res) => void await res.send('<h1>Hello World</h1>'))
  .get('/page/:page', async (req, res) => {
    await res.status(200).send(`
<h1>Some cool page</h1>
<h2>URL</h2>
${req.url}
<h2>Params</h2>
${JSON.stringify(req.params, null, 2)}
  `)
  }).listen(3000)
