import { assertEquals } from 'https://deno.land/std@0.104.0/testing/asserts.ts'
import { Accepts } from '../../../utils/accepts.ts'

const { test } = Deno

test('accepts.languages() with no arguments when Accept-Language is populated should return accepted types', function () {
  const header = createRequest('en;q=0.8, es, pt')
  const accept = new Accepts(header)
  assertEquals(accept.languages(), ['es', 'pt', 'en'])
})

test('accepts.languages() with no arguments when Accept-Language is not in request should return *', function () {
  const header = createRequest()
  const accept = new Accepts(header)
  assertEquals(accept.languages(), ['*'])
})

test('accepts.languages() with no arguments when Accept-Language is empty should return an empty array', function () {
  const header = createRequest('')
  const accept = new Accepts(header)
  assertEquals(accept.languages(), [])
})

test('accepts.languages() with multiple arguments when Accept-Language is populated if any types types match should return the best fit', function () {
  const header = createRequest('en;q=0.8, es, pt')
  const accept = new Accepts(header)
  assertEquals(accept.languages(['es', 'en']), 'es')
})

test('accepts.languages() with multiple arguments when Accept-Language is populated if no types match should return []', function () {
  const header = createRequest('en;q=0.8, es, pt')
  const accept = new Accepts(header)
  assertEquals(accept.languages(['fr', 'au']), false)
})

test('accepts.languages() with multiple arguments when Accept-Language is not populated should return the first type', function () {
  const header = createRequest()
  const accept = new Accepts(header)
  assertEquals(accept.languages(['es', 'en']), 'es')
})

test('accepts.languages() with an array should return the best fit', function () {
  const header = createRequest('en;q=0.8, es, pt')
  const accept = new Accepts(header)
  assertEquals(accept.languages(['es', 'en']), 'es')
})

function createRequest(language?: string) {
  const header = new Headers()
  if (language !== undefined) {
    header.set('accept-language', language)
  }
  return header
}
