import { App } from '../../app.ts'

new App({
  noMatchHandler: (_req, res) => {
    res.status = 404
    return res.send('<h1>Not Found</h1>')
  }
})
  .get('/', (_, res) => void res.send('<h1>Hello World</h1>'))
  .listen(3000)
