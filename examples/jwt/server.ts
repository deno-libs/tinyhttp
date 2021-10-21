import { App } from '../../mod.ts'
import { getNumericDate, Payload, Header, create, verify } from 'https://deno.land/x/djwt@v2.2/mod.ts'

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

app.get('/secret', async (_req, res) => {
  res.end(await create(header, payload, SECRET))
})

app.post('/protected', async (req, res) => {
  const jwt = await req.text()

  await verify(jwt, SECRET, 'HS256')
    .then(() => res.end('Valid JWT\n'))
    .catch(() => {
      res.status = 401
      res.end('Invalid JWT\n')
    })
})

await app.listen(3000)
