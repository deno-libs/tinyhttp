import { assertEquals } from 'https://deno.land/std@0.106.0/testing/asserts.ts'
import { Accepts } from '../../../utils/accepts.ts'

const { test } = Deno

test('accepts.types() with no arguments when Accept is populated should return all accepted types', function () {
  const header = createRequest('application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain')
  const accept = new Accepts(header)
  assertEquals(accept.types(), ['text/html', 'text/plain', 'image/jpeg', 'application/*'])
})

test('accepts.types() with no arguments when Accept not in request should return */*', function () {
  const header = createRequest()
  const accept = new Accepts(header)
  assertEquals(accept.types(), ['*/*'])
})

test('accepts.types() with no arguments when Accept is empty should returnfalse', function () {
  const header = createRequest('')
  const accept = new Accepts(header)
  assertEquals(accept.types(), [])
})

test('accepts.types() with no valid types when Accept is populated should returnfalse', function () {
  const header = createRequest('application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain')
  const accept = new Accepts(header)
  assertEquals(accept.types(['image/png', 'image/tiff']), false)
})

test('accepts.types() with no valid types when Accept is not populated should return the first type', function () {
  const header = createRequest()
  const accept = new Accepts(header)
  assertEquals(accept.types(['text/html', 'text/plain', 'image/jpeg', 'application/*']), 'text/html')
})

test('accepts.types() when extensions are given should convert to mime types', function () {
  const header = createRequest('text/plain, text/html')
  const accept = new Accepts(header)
  assertEquals(accept.types(['html']), 'html')
  assertEquals(accept.types(['.html']), '.html')
  assertEquals(accept.types(['txt']), 'txt')
  assertEquals(accept.types(['.txt']), '.txt')
  assertEquals(accept.types(['png']), false)
  assertEquals(accept.types(['bogus']), false)
})

test('accepts.types() when an array is given should return the first match', function () {
  const header = createRequest('text/plain, text/html')
  const accept = new Accepts(header)
  assertEquals(accept.types(['png', 'text', 'html']), 'text')
  assertEquals(accept.types(['png', 'html']), 'html')
  assertEquals(accept.types(['bogus', 'html']), 'html')
})

test('accepts.types() when present in Accept as an exact match should return the type', function () {
  const header = createRequest('text/plain, text/html')
  const accept = new Accepts(header)
  assertEquals(accept.types(['text/html']), 'text/html')
  assertEquals(accept.types(['text/plain']), 'text/plain')
})

test('accepts.types() when present in Accept as a type match should return the type', function () {
  const header = createRequest('application/json, */*')
  const accept = new Accepts(header)
  assertEquals(accept.types(['text/html']), 'text/html')
  assertEquals(accept.types(['text/plain']), 'text/plain')
  assertEquals(accept.types(['image/png']), 'image/png')
})

test('accepts.types() when present in Accept as a subtype match should return the type', function () {
  const header = createRequest('application/json, text/*')
  const accept = new Accepts(header)
  assertEquals(accept.types(['text/html']), 'text/html')
  assertEquals(accept.types(['text/plain']), 'text/plain')
  assertEquals(accept.types(['image/png']), false)
})

function createRequest(type?: string) {
  const header = new Headers()
  if (type !== undefined) {
    header.set('accept', type)
  }
  return header
}
