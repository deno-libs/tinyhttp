import { App } from '../../mod.ts'

new App({
  noMatchHandler: (req) => {
    req.respond({
      status: 404,
      body: '<h1>Not Found</h1>'
    })
  }
})
  .get('/', (_, res) => void res.send('<h1>Hello World</h1>'))
  .listen(3000)
