import { assertEquals } from 'https://deno.land/std@0.128.0/testing/asserts.ts'
import { Accepts } from '../../../utils/accepts.ts'

const { test } = Deno

function createRequest(charset?: string) {
  const header = new Headers()
  if (charset !== undefined) {
    header.set('accept-charset', charset)
  }
  return header
}

test('accepts.charsets() with no arguments when Accept-Charset is populated should return accepted types', function () {
  const header = createRequest('utf-8, iso-8859-1;q=0.2, utf-7;q=0.5')
  const accept = new Accepts(header)
  assertEquals(accept.charsets(), ['utf-8', 'utf-7', 'iso-8859-1'])
})

test('accepts.charsets() when Accept-Charset is not in request should return *', function () {
  const header = createRequest()
  const accept = new Accepts(header)
  assertEquals(accept.charsets(), ['*'])
})

test('accepts.charsets() when Accept-Charset is empty should return an empty array', function () {
  const header = createRequest('')
  const accept = new Accepts(header)
  assertEquals(accept.charsets(), [])
})

test('accepts.charsets() with multiple arguments when Accept-Charset is populated if any types match should return the best fit', function () {
  const header = createRequest('utf-8, iso-8859-1;q=0.2, utf-7;q=0.5')
  const accept = new Accepts(header)
  assertEquals(accept.charsets(['utf-7', 'utf-8']), 'utf-8')
})

test('accepts.charsets() with multiple arguments when Accept-Charset is populated if no types match should return []', function () {
  const header = createRequest('utf-8, iso-8859-1;q=0.2, utf-7;q=0.5')
  const accept = new Accepts(header)
  assertEquals(accept.charsets(['utf-16']), false)
})

test('accepts.charsets() with multiple arguments when Accept-Charset is populated when Accept-Charset is not populated should return the first type', function () {
  const header = createRequest()
  const accept = new Accepts(header)
  assertEquals(accept.charsets(['utf-7', 'utf-8']), 'utf-7')
})

test('accepts.charsets() with an array should return the best fit', function () {
  const header = createRequest('utf-8, iso-8859-1;q=0.2, utf-7;q=0.5')
  const accept = new Accepts(header)
  assertEquals(accept.charsets(['utf-7', 'utf-8']), 'utf-8')
})
