import { App } from '../../mod.ts'
import { getNumericDate, Payload, Header, create, verify } from 'https://deno.land/x/djwt/mod.ts'

const SECRET = 'my_secret'

const payload: Payload = {
  iss: 'joe',
  exp: getNumericDate(60)
}

const header: Header = {
  alg: 'HS256',
  typ: 'JWT'
}

const app = new App()

app.get('/secret', async (req, res) => {
  req.respond({
    body: await create(header, payload, SECRET)
  })
})

app.post('/protected', async (req, res) => {
  const jwt = new TextDecoder().decode(await Deno.readAll(req.body))

  await verify(jwt, SECRET, 'HS256')
    .then(() => req.respond({ body: 'Valid JWT\n' }))
    .catch(() => req.respond({ body: 'Invalid JWT\n', status: 401 }))
})

await app.listen(3000)
