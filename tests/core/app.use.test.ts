import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno } from '../util.ts'

describe('app.use(path, h)', () => {
  it('should chain middleware', () => {
    const app = new App()

    app.use((_req, _res, next) => next()).use((_req, _res, next) => next())

    expect(app.middleware.length).toBe(2)
  })
  it('req and res inherit properties from previous middlewares', async () => {
    const app = new App()

    app
      .use((_req, res, next) => {
        res.locals.hello = 'world'

        next()
      })
      .get('/', (_, res) => {
        res.send(res.locals)
      })

    const fetch = BindToSuperDeno(app)

    await fetch.get('/').expect(200, '{\n  "hello": "world"\n}')
  })
  it('should flatten the array of wares', async () => {
    const app = new App()

    let counter = 1

    app.use('/abc', [(_1, _2, next) => counter++ && next(), (_1, _2, next) => counter++ && next()], (_req, res) => {
      expect(counter).toBe(3)
      res.send('Hello World')
    })

    const fetch = BindToSuperDeno(app)

    await fetch.get('/abc').expect(200, 'Hello World')
  })
})

run()
