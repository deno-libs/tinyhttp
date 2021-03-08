import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { InitAppAndTest } from '../../util.ts'

import { getAccepts, getAcceptsEncodings } from '../../../extensions/req/mod.ts'

describe('req.accepts()', () => {
  it('should detect an "Accept" header', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const accepts = getAccepts(req)()

      res.send(Array.isArray(accepts) ? accepts[0] : accepts)
    })

    await fetch.get('/').set('Accept', 'text/plain').expect('text/plain')
  })
  it('should parse multiple values', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const accepts = getAccepts(req)()

      res.end((accepts as string[]).join(' | '))
    })

    await fetch.get('/').set('Accept', 'text/plain, text/html').expect('text/plain | text/html')
  })
})

describe('req.acceptsEncodings()', () => {
  it('should detect "Accept-Encoding" header', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const encodings = getAcceptsEncodings(req)()

      res.send(Array.isArray(encodings) ? encodings[0] : encodings)
    })

    await fetch.get('/').set('Accept-Encoding', 'gzip').expect('gzip')
  })
  it('should parse multiple values', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const encodings = getAcceptsEncodings(req)()

      res.end((encodings as string[]).join(' | '))
    })

    await fetch.get('/').set('Accept-Encoding', 'gzip, br').expect('gzip | br | identity')
  })
})

run()
