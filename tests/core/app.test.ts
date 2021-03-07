import { describe, it, expect, run } from 'https://deno.land/x/wizard@0.1.0/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno, InitAppAndTest } from '../util.ts'

describe('Testing App', () => {
  it('should launch a basic server', async () => {
    const { fetch } = InitAppAndTest((_req, res) => void res.send('Hello World'))

    await fetch.get('/').expect(200, 'Hello World')
  })
  it('should chain middleware', () => {
    const app = new App()

    app.use((_req, _res, next) => next()).use((_req, _res, next) => next())

    expect(app.middleware.length).toBe(2)
  })
  it('app.locals are get and set', () => {
    const app = new App()

    app.locals.hello = 'world'

    expect(app.locals.hello).toBe('world')
  })
  it('Custom noMatchHandler works', async () => {
    const { fetch } = InitAppAndTest(
      (_req, _res, next) => {
        next()
      },
      undefined,
      {
        noMatchHandler: (req) => {
          req.respond({
            status: 404,
            body: `Oopsie! Page ${req.url} is lost.`
          })
        }
      }
    )

    await fetch.get('/').expect(404, 'Oopsie! Page / is lost.')
  })
  it('Custom onError works', async () => {
    const app = new App({
      onError: (err, req) => {
        req.respond({
          status: 500,
          body: `Ouch, ${err} hurt me on ${req.url} page.`
        })
      }
    })

    app.use((_req, _res, next) => next('you'))

    const fetch = BindToSuperDeno(app)

    await fetch.get('/').expect(500, 'Ouch, you hurt me on / page.')
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
})

describe('Testing App routing', () => {
  it('should respond on matched route', async () => {
    const { fetch } = InitAppAndTest((_req, res) => void res.send('Hello world'), '/route')

    await fetch.get('/route').expect(200, 'Hello world')
  })
  it('should match wares containing base path', async () => {
    const app = new App()

    app.use('/abc', (_req, res) => void res.send('Hello world'))

    const fetch = BindToSuperDeno(app)

    await fetch.get('/abc/def').expect(200, 'Hello world')
  })
  it('"*" should catch all undefined routes', async () => {
    const app = new App()

    app
      .get('/route', (_req, res) => void res.send('A different route'))
      .all('*', (_req, res) => void res.send('Hello world'))

    const fetch = BindToSuperDeno(app)

    await fetch.get('/test').expect(200, 'Hello world')
  })
  it('should throw 404 on no routes', async () => {
    await BindToSuperDeno(new App()).get('/').expect(404)
  })
})

run()
