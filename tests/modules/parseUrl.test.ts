import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts'
import { getPathname, getQueryParams, getURLParams } from '../../utils/parseUrl.ts'
import { describe, it } from '../util.ts'
import { rg } from '../../deps.ts'

describe('getQueryParams(url)', () => {
  it('parses query params the same way as url.parse(str, true)', () => {
    const str = '/hello?world=42'

    expect(getQueryParams(str)).toEqual({
      world: '42'
    })
  })
})

describe('getURLParams(reqUrl, url)', () => {
  it('returns empty object if none matched', () => {
    const reqUrl = '/'

    const regex = rg('/:a/:b')

    expect(getURLParams(regex, reqUrl)).toEqual({})
  })
  it('parses URL params and returns an object with matches', () => {
    const reqUrl = '/hello/world'

    const regex = rg('/:a/:b')

    expect(getURLParams(regex, reqUrl)).toEqual({
      a: 'hello',
      b: 'world'
    })
  })
})

describe('getPathname(url)', () => {
  it('extracts pathname from string', () => {
    expect(getPathname('/hello?world=42')).toBe('/hello')
  })
  it('works with nested paths', () => {
    expect(getPathname('/hello/world?num=42')).toBe('/hello/world')
  })
})
