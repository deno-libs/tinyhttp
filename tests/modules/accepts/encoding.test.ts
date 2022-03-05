import { assertEquals } from 'https://deno.land/std@0.128.0/testing/asserts.ts'
import { Accepts } from '../../../utils/accepts.ts'

const { test } = Deno

test('accepts.encodings() with no arguments when Accept-Encoding is populated should return accepted types', function () {
  const header = createRequest('gzip, compress;q=0.2')
  var accept = new Accepts(header)
  assertEquals(accept.encodings(), ['gzip', 'compress', 'identity'])
  assertEquals(accept.encodings(['gzip', 'compress']), 'gzip')
})

test('accepts.encodings() with no arguments when Accept-Encoding is not in request should return identity', function () {
  const header = createRequest()
  var accept = new Accepts(header)
  assertEquals(accept.encodings(), ['identity'])
  assertEquals(accept.encodings(['gzip', 'deflate', 'identity']), 'identity')
})

test('accepts.encodings() with no arguments when Accept-Encoding is not in request when identity is not included should return []', function () {
  const header = createRequest()
  var accept = new Accepts(header)
  assertEquals(accept.encodings(['gzip', 'deflate']), false)
})

test('accepts.encodings() with no arguments when Accept-Encoding is empty should return identity', function () {
  const header = createRequest('')
  var accept = new Accepts(header)
  assertEquals(accept.encodings(), ['identity'])
  assertEquals(accept.encodings(['gzip', 'deflate', 'identity']), 'identity')
})

test('accepts.encodings() with no arguments when Accept-Encoding is empty when identity is not included should return []', function () {
  const header = createRequest('')
  var accept = new Accepts(header)
  assertEquals(accept.encodings(['gzip', 'deflate']), false)
})

test('accepts.encodings() with multiple arguments should return the best fit', function () {
  const header = createRequest('gzip, compress;q=0.2')
  var accept = new Accepts(header)
  assertEquals(accept.encodings(['compress', 'gzip']), 'gzip')
  assertEquals(accept.encodings(['gzip', 'compress']), 'gzip')
})

test('accepts.encodings() with an array should return the best fit', function () {
  const header = createRequest('gzip, compress;q=0.2')
  var accept = new Accepts(header)
  assertEquals(accept.encodings(['compress', 'gzip']), 'gzip')
})

function createRequest(encoding?: string) {
  const header = new Headers()
  if (encoding !== undefined) {
    header.set('accept-encoding', encoding)
  }
  return header
}
