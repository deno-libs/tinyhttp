import { expect } from 'https://deno.land/x/expect/mod.ts'
import { App } from '../../mod.ts'
import { BindToSuperDeno, it, describe, InitAppAndTest } from '../util.ts'

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
  /* it('Custom noMatchHandler works', async () => {
    const { fetch } = InitAppAndTest(() => {}, undefined, {
      noMatchHandler: (req) => {
        req.respond({
          status: 404,
          body: `Oopsie! Page ${req.url} is lost.`
        })
      }
    })

    await fetch.get('/').expect(404, 'Oopsie! Page / is lost.')
  }) */
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
})
