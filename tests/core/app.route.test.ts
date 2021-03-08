import { describe, it, run } from 'https://deno.land/x/wizard/mod.ts'
import { App } from '../../app.ts'
import { BindToSuperDeno } from '../util.ts'

describe('app.route(path)', () => {
  it('app.route works properly', async () => {
    const app = new App()

    app.route('/').get((req, res) => res.end(req.url))

    await BindToSuperDeno(app).get('/').expect(200)
  })
  it('app.route supports chaining route methods', async () => {
    const app = new App()

    app.route('/').get((req, res) => res.end(req.url))

    await BindToSuperDeno(app).get('/').expect(200)
  })
  it('app.route supports chaining route methods', async () => {
    const app = new App()

    app
      .route('/')
      .get((_, res) => res.send('GET request'))
      .post((_, res) => res.send('POST request'))

    await BindToSuperDeno(app).post('/').expect(200, 'POST request')
  })
})

run()
