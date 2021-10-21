import { etag } from '../../utils/etag.ts'
import { describe, it, expect, run } from 'https://deno.land/x/tincan@1.0.0/mod.ts'

describe('etag(body)', function () {
  it('should support strings', function () {
    expect(etag('tinyhttp!')).toEqual('"9-ad99f9c3966def6d6e3097673fb"')
  })

  it('should support utf8 strings', function () {
    expect(etag('tinyhttp❤')).toEqual('"b-02d5d5faf86e1ae003fd0dc7d60"')
  })

  it('should support Uint8Array', function () {
    const encoder = new TextEncoder()
    expect(etag(encoder.encode('tinyhttp!'))).toEqual('"9-ad99f9c3966def6d6e3097673fb"')
  })

  it('should support empty string', function () {
    expect(etag('')).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
  })
})

run()
