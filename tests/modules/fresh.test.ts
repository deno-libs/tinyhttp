// Source: https://github.com/jshttp/fresh/blob/master/test/fresh.js

import { describe, expect, it, run } from '../../dev_deps.ts'
import { fresh } from '../../utils/fresh.ts'

describe('fresh(reqHeaders, resHeaders)', () => {
  it('when a non-conditional GET is performed should be stale', () => {
    expect(fresh(new Headers(), new Headers())).toBe(false)
  })
  it('when requested with If-None-Match and when ETags match should be fresh', () => {
    expect(fresh(
      new Headers({
        'if-none-match': '"foo"',
      }),
      new Headers({ etag: '"foo"' }),
    )).toBe(true)
  })
  it('when ETags mismatch should be stale', () => {
    expect(fresh(
      new Headers({
        'if-none-match': '"foo"',
      }),
      new Headers({ etag: '"bar"' }),
    )).toBe(false)
  })
  it('when at least one matches should be fresh', () => {
    expect(fresh(
      new Headers({
        'if-none-match': ' "bar" , "foo"',
      }),
      new Headers({ etag: '"bar"' }),
    )).toBe(true)
  })
  it('when etag is missing should be stale', () => {
    expect(fresh(
      new Headers({
        'if-none-match': '"foo"',
      }),
      new Headers({ etag: '"bar"' }),
    )).toBe(false)
  })
  describe('when ETag is weak', () => {
    it('should be fresh on exact match', () => {
      expect(
        fresh(
          new Headers({ 'if-none-match': 'W/"foo"' }),
          new Headers({ etag: 'W/"foo"' }),
        ),
      ).toBe(true)
    })

    it('should be fresh on strong match', () => {
      expect(
        fresh(
          new Headers({ 'if-none-match': 'W/"foo"' }),
          new Headers({ etag: '"foo"' }),
        ),
      ).toBe(
        true,
      )
    })
  })
  describe('when ETag is strong', () => {
    it('should be fresh on exact match', () => {
      expect(
        fresh(
          new Headers({ 'if-none-match': '"foo"' }),
          new Headers({ etag: '"foo"' }),
        ),
      ).toBe(true)
    })

    it('should be fresh on weak match', () => {
      expect(
        fresh(
          new Headers({ 'if-none-match': '"foo"' }),
          new Headers({ etag: 'W/"foo"' }),
        ),
      ).toBe(true)
    })
  })
  describe('when * is given', () => {
    it('should be fresh', () => {
      expect(
        fresh(
          new Headers({ 'if-none-match': '*' }),
          new Headers({ etag: '"foo"' }),
        ),
      ).toBe(true)
    })

    it('should get ignored if not only value', () => {
      expect(
        fresh(
          new Headers({ 'if-none-match': '*, "bar"' }),
          new Headers({ etag: '"foo"' }),
        ),
      ).toBe(false)
    })
  })
})

run()
