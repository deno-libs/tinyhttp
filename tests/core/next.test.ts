import { describe, it, run } from 'https://deno.land/x/wizard/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno, InitAppAndTest } from '../util.ts'

describe('next(err)', () => {
  it('next function skips current middleware', async () => {
    const app = new App()

    app.locals['log'] = 'test'

    app
      .use((req, _res, next) => {
        app.locals['log'] = req.url
        next()
      })
      .use((_req, res) => void res.json({ ...app.locals }))

    await BindToSuperDeno(app).get('/').expect(200, '{\n  "log": "/"\n}')
  })
  it('next function handles errors', async () => {
    const app = new App()

    app.use((req, res, next) => {
      if (req.url === '/broken') {
        next('Your appearance destroyed this world.')
      } else {
        res.send('Welcome back')
      }
    })

    await BindToSuperDeno(app).get('/broken').expect(500, 'Your appearance destroyed this world.')
  })
  it("next function sends error message if it's not an HTTP status code or string", async () => {
    const app = new App()

    app.use((req, res, next) => {
      if (req.url === '/broken') {
        next(new Error('Your appearance destroyed this world.'))
      } else {
        res.send('Welcome back')
      }
    })

    await BindToSuperDeno(app).get('/broken').expect(500, 'Your appearance destroyed this world.')
  })
  it('errors in async wares do not destroy the app', async () => {
    const app = new App()

    app.use(async (_req, _res) => {
      throw `bruh`
    })

    await BindToSuperDeno(app).get('/').expect(500, 'bruh')
  })

  it('errors in sync wares do not destroy the app', async () => {
    const app = new App()

    app.use((_req, _res) => {
      throw `bruh`
    })

    await BindToSuperDeno(app).get('/').expect(500, 'bruh')
  })
})

run()
