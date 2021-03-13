import { describe, it, run } from 'https://deno.land/x/wizard/mod.ts'
import { InitAppAndTest } from '../util.ts'
import { setHeader } from '../../extensions/res/mod.ts'

describe('res.set(field, val)', () => {
  it('should set a string header with a string value', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('hello', 'World')
      res.end()
    })

    await fetch.get('/').expect('hello', 'World')
  })
  it('should set an array of header values', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('foo', ['bar', 'baz'])
      res.end()
    })

    await fetch.get('/').expect('foo', 'bar,baz')
  })
  it('should throw if `Content-Type` header is passed as an array', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      try {
        setHeader(res)('content-type', ['foo', 'bar'])
      } catch (e) {
        res.status = 500
        res.end((e as TypeError).message)
      }
    })
    await fetch.get('/').expect(500, 'Content-Type cannot be set to an Array')
  })
  it('if the first argument is object, then map keys to values', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)({ foo: 'bar' })
      res.end()
    })

    await fetch.get('/').expect('foo', 'bar')
  })
  it('should not set a charset of one is already set', async () => {
    const { fetch } = InitAppAndTest((_, res) => {
      setHeader(res)('content-type', 'text/plain; charset=UTF-8')
      res.end()
    })

    await fetch.get('/').expect('content-type', 'text/plain; charset=UTF-8')
  })
})

run()
