import { describe, it, expect, run } from 'https://deno.land/x/wizard/mod.ts'
import { Ranges } from '../../../types.ts'
import { InitAppAndTest } from '../../util.ts'
import { getRangeFromHeader } from '../../../extensions/req/mod.ts'

describe('req.range', () => {
  it('should return parsed ranges', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const range = getRangeFromHeader(req)
      const array = range(300)

      res.send(JSON.stringify(array))
    })

    await fetch.get('/').set('Range', 'bytes=0-1000').expect(`[{"start":0,"end":299}]`)
  })
  it('should cap to the given size', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const range = getRangeFromHeader(req)
      const size = 300
      expect((range(size) as Ranges)?.[0].end).toBe(size - 1)
      res.end()
    })

    await fetch.get('/').set('Range', 'bytes=0-1000')
  })
  it('should cap to the given size when open-ended', async () => {
    const { fetch } = InitAppAndTest((req, res) => {
      const range = getRangeFromHeader(req)
      const size = 300
      expect((range(size) as Ranges)?.[0].end).toBe(size - 1)
      res.end()
    })

    await fetch.get('/').set('Range', 'bytes=0-')
  })
})
run()
