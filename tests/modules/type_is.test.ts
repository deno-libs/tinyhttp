import { assertStrictEquals } from 'https://deno.land/std@0.112.0/testing/asserts.ts'
import { hasBody, is, typeofrequest } from '../../utils/type_is.ts'

const { test } = Deno

test('typeofrequest(header, types) should ignore params', function () {
  const header = createHeader('text/html; charset=utf-8')
  assertStrictEquals(typeofrequest(header, ['text/*']), 'text/html')
})

test('typeofrequest(header, types) should ignore params LWS', function () {
  const header = createHeader('text/html ; charset=utf-8')
  assertStrictEquals(typeofrequest(header, ['text/*']), 'text/html')
})

test('typeofrequest(header, types) should ignore casing', function () {
  const header = createHeader('text/HTML')
  assertStrictEquals(typeofrequest(header, ['text/*']), 'text/html')
})

test('typeofrequest(header, types) should fail invalid type', function () {
  const header = createHeader('text/html**')
  assertStrictEquals(typeofrequest(header, ['text/*']), false)
})

test('typeofrequest(header, types) should not match invalid type', function () {
  const header = createHeader('text/html')
  assertStrictEquals(typeofrequest(header, ['text/html/']), false)
})

test('typeofrequest(header, types) when no body is given should return null', function () {
  const header = new Headers()

  assertStrictEquals(typeofrequest(header), null)
  assertStrictEquals(typeofrequest(header, ['image/*']), null)
  assertStrictEquals(typeofrequest(header, ['image/*', 'text/*']), null)
})

test('typeofrequest(header, types) when no content type is given should return false', function () {
  const header = createHeader()
  assertStrictEquals(typeofrequest(header), false)
  assertStrictEquals(typeofrequest(header, ['image/*']), false)
  assertStrictEquals(typeofrequest(header, ['text/*', 'image/*']), false)
})

test('typeofrequest(header, types) give no types should return the mime type', function () {
  const header = createHeader('image/png')
  assertStrictEquals(typeofrequest(header), 'image/png')
})

test('typeofrequest(header, types) given one type should return the type or false', function () {
  const header = createHeader('image/png')

  assertStrictEquals(typeofrequest(header, ['png']), 'png')
  assertStrictEquals(typeofrequest(header, ['.png']), '.png')
  assertStrictEquals(typeofrequest(header, ['image/png']), 'image/png')
  assertStrictEquals(typeofrequest(header, ['image/*']), 'image/png')
  assertStrictEquals(typeofrequest(header, ['*/png']), 'image/png')

  assertStrictEquals(typeofrequest(header, ['jpeg']), false)
  assertStrictEquals(typeofrequest(header, ['.jpeg']), false)
  assertStrictEquals(typeofrequest(header, ['image/jpeg']), false)
  assertStrictEquals(typeofrequest(header, ['text/*']), false)
  assertStrictEquals(typeofrequest(header, ['*/jpeg']), false)

  assertStrictEquals(typeofrequest(header, ['bogus']), false)
  assertStrictEquals(typeofrequest(header, ['something/bogus*']), false)
})

test('typeofrequest(header, types) given multiple types should return the first match or false', function () {
  const header = createHeader('image/png')

  assertStrictEquals(typeofrequest(header, ['png']), 'png')
  assertStrictEquals(typeofrequest(header, ['.png']), '.png')
  assertStrictEquals(typeofrequest(header, ['text/*', 'image/*']), 'image/png')
  assertStrictEquals(typeofrequest(header, ['image/*', 'text/*']), 'image/png')
  assertStrictEquals(typeofrequest(header, ['image/*', 'image/png']), 'image/png')
  assertStrictEquals(typeofrequest(header, ['image/png', 'image/*']), 'image/png')

  assertStrictEquals(typeofrequest(header, ['jpeg']), false)
  assertStrictEquals(typeofrequest(header, ['.jpeg']), false)
  assertStrictEquals(typeofrequest(header, ['text/*', 'application/*']), false)
  assertStrictEquals(typeofrequest(header, ['text/html', 'text/plain', 'application/json']), false)
})

test('typeofrequest(header, types) given +suffix should match suffix types', function () {
  const header = createHeader('application/vnd+json')

  assertStrictEquals(typeofrequest(header, ['+json']), 'application/vnd+json')
  assertStrictEquals(typeofrequest(header, ['application/vnd+json']), 'application/vnd+json')
  assertStrictEquals(typeofrequest(header, ['application/*+json']), 'application/vnd+json')
  assertStrictEquals(typeofrequest(header, ['*/vnd+json']), 'application/vnd+json')
  assertStrictEquals(typeofrequest(header, ['application/json']), false)
  assertStrictEquals(typeofrequest(header, ['text/*+json']), false)
})

test('typeofrequest(header, types) given "*/*" should match any content-type', function () {
  assertStrictEquals(typeofrequest(createHeader('text/html'), ['*/*']), 'text/html')
  assertStrictEquals(typeofrequest(createHeader('text/xml'), ['*/*']), 'text/xml')
  assertStrictEquals(typeofrequest(createHeader('application/json'), ['*/*']), 'application/json')
  assertStrictEquals(typeofrequest(createHeader('application/vnd+json'), ['*/*']), 'application/vnd+json')
})

test('typeofrequest(header, types) given "*/*" should not match invalid content-type', function () {
  assertStrictEquals(typeofrequest(createHeader('bogus'), ['*/*']), false)
})

test('typeofrequest(header, types) given "*/*" should not match body-less request', function () {
  const header = new Headers([['content-type', 'text/html']])
  assertStrictEquals(typeofrequest(header, ['*/*']), null)
})

test('should match "urlencoded"', function () {
  const header = createHeader('application/x-www-form-urlencoded')

  assertStrictEquals(typeofrequest(header, ['urlencoded']), 'urlencoded')
  assertStrictEquals(typeofrequest(header, ['json', 'urlencoded']), 'urlencoded')
  assertStrictEquals(typeofrequest(header, ['urlencoded', 'json']), 'urlencoded')
})

test('typeofrequest(header, types) when Content-Type: multipart/form-data should match "multipart/*"', function () {
  const header = createHeader('multipart/form-data')

  assertStrictEquals(typeofrequest(header, ['multipart/*']), 'multipart/form-data')
})

test('typeofrequest(header, types) when Content-Type: multipart/form-data should match "multipart"', function () {
  const header = createHeader('multipart/form-data')

  assertStrictEquals(typeofrequest(header, ['multipart']), 'multipart')
})

test('hasBody(req) content-length should indicate body', function () {
  const header = new Headers([['content-length', '1']])
  assertStrictEquals(hasBody(header), true)
})

test('hasBody(req) content-length should be true when 0', function () {
  const header = new Headers([['content-length', '0']])
  assertStrictEquals(hasBody(header), true)
})

test('hasBody(req) content-length should be false when bogus', function () {
  const header = new Headers([['content-length', 'bogus']])
  assertStrictEquals(hasBody(header), false)
})

test('hasBody(req) transfer-encoding should indicate body', function () {
  const header = new Headers([['transfer-encoding', '1']])
  assertStrictEquals(hasBody(header), true)
})

test('is(mediaType, types) should ignore params', function () {
  assertStrictEquals(is('text/html; charset=utf-8', ['text/*']), 'text/html')
})

test('is(mediaType, types) should ignore casing', function () {
  assertStrictEquals(is('text/HTML', ['text/*']), 'text/html')
})

test('is(mediaType, types) should fail invalid type', function () {
  assertStrictEquals(is('text/html**', ['text/*']), false)
})

test('is(mediaType, types) given no types should return the mime type', function () {
  assertStrictEquals(is('image/png'), 'image/png')
})

test('is(mediaType, types) given one type should return the type or false', function () {
  assertStrictEquals(is('image/png', ['png']), 'png')
  assertStrictEquals(is('image/png', ['.png']), '.png')
  assertStrictEquals(is('image/png', ['image/png']), 'image/png')
  assertStrictEquals(is('image/png', ['image/*']), 'image/png')
  assertStrictEquals(is('image/png', ['*/png']), 'image/png')

  assertStrictEquals(is('image/png', ['jpeg']), false)
  assertStrictEquals(is('image/png', ['.jpeg']), false)
  assertStrictEquals(is('image/png', ['image/jpeg']), false)
  assertStrictEquals(is('image/png', ['text/*']), false)
  assertStrictEquals(is('image/png', ['*/jpeg']), false)

  assertStrictEquals(is('image/png', ['bogus']), false)
  assertStrictEquals(is('image/png', ['something/bogus*']), false)
})

test('is(mediaType, types) given multiple types should return the first match or false', function () {
  assertStrictEquals(is('image/png', ['png']), 'png')
  assertStrictEquals(is('image/png', ['.png']), '.png')
  assertStrictEquals(is('image/png', ['text/*', 'image/*']), 'image/png')
  assertStrictEquals(is('image/png', ['image/*', 'text/*']), 'image/png')
  assertStrictEquals(is('image/png', ['image/*', 'image/png']), 'image/png')
  assertStrictEquals(is('image/png', ['image/png', 'image/*']), 'image/png')

  assertStrictEquals(is('image/png', ['jpeg']), false)
  assertStrictEquals(is('image/png', ['.jpeg']), false)
  assertStrictEquals(is('image/png', ['text/*', 'application/*']), false)
  assertStrictEquals(is('image/png', ['text/html', 'text/plain', 'application/json']), false)
})

test('is(mediaType, types) given +suffix should match suffix types', function () {
  assertStrictEquals(is('application/vnd+json', ['+json']), 'application/vnd+json')
  assertStrictEquals(is('application/vnd+json', ['application/vnd+json']), 'application/vnd+json')
  assertStrictEquals(is('application/vnd+json', ['application/*+json']), 'application/vnd+json')
  assertStrictEquals(is('application/vnd+json', ['*/vnd+json']), 'application/vnd+json')
  assertStrictEquals(is('application/vnd+json', ['application/json']), false)
  assertStrictEquals(is('application/vnd+json', ['text/*+json']), false)
})

test('is(mediaType, types) given "*/*" should match any media type', function () {
  assertStrictEquals(is('text/html', ['*/*']), 'text/html')
  assertStrictEquals(is('text/xml', ['*/*']), 'text/xml')
  assertStrictEquals(is('application/json', ['*/*']), 'application/json')
  assertStrictEquals(is('application/vnd+json', ['*/*']), 'application/vnd+json')
})

test('is(mediaType, types) given "*/*" should not match invalid media type', function () {
  assertStrictEquals(is('bogus', ['*/*']), false)
})

test('is(mediaType, types) when media type is application/x-www-form-urlencoded should match "urlencoded"', function () {
  assertStrictEquals(is('application/x-www-form-urlencoded', ['urlencoded']), 'urlencoded')
  assertStrictEquals(is('application/x-www-form-urlencoded', ['json', 'urlencoded']), 'urlencoded')
  assertStrictEquals(is('application/x-www-form-urlencoded', ['urlencoded', 'json']), 'urlencoded')
})

test('is(mediaType, types) when media type is multipart/form-data should match "multipart/*"', function () {
  assertStrictEquals(is('multipart/form-data', ['multipart/*']), 'multipart/form-data')
})

test('is(mediaType, types) when media type is multipart/form-data should match "multipart"', function () {
  assertStrictEquals(is('multipart/form-data', ['multipart']), 'multipart')
})

function createHeader(type?: string): Headers {
  const header = new Headers([['transfer-encoding', 'chunked']])
  if (type) {
    header.set('content-type', type)
  }
  return header
}
