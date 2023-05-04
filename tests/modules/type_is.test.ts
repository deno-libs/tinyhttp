import { describe, expect, it, run } from '../../dev_deps.ts'
import { is as typeIs } from '../../utils/type_is.ts'

describe('typeIs', () => {
  it('should return false when value is falsy', () => {
    expect(typeIs('')).toBe(false)
    expect(typeIs(null as unknown as string)).toBe(false)
    expect(typeIs(undefined as unknown as string)).toBe(false)
  })

  it('should return value if types are empty', () => {
    expect(typeIs('application/json')).toBe('application/json')
  })

  it('shouldn\'t depend on case', () => {
    expect(typeIs('Application/Json')).toBe('application/json')
  })

  it('should return value if types are empty', () => {
    expect(typeIs('application/json', ['application/json'])).toBe(
      'application/json',
    )
  })

  it('should return value if matched type starts with plus', () => {
    expect(typeIs('application/ld+json', ['+json'])).toBe('application/ld+json')
  })

  it('should return false if there is no match', () => {
    expect(typeIs('application/ld+json', ['application/javascript'])).toBe(
      false,
    )
  })

  it('should return false if there is no match', () => {
    expect(typeIs('text/html', ['application/javascript'])).toBe(false)
  })

  it('should return matched value for urlencoded shorthand', () => {
    expect(typeIs('application/x-www-form-urlencoded', ['urlencoded'])).toBe(
      'urlencoded',
    )
  })

  it('should return matched value for urlencoded shorthand', () => {
    expect(typeIs('multipart/form-data', ['multipart'])).toBe('multipart')
  })

  it('should return false if expected type has wrong format', () => {
    expect(typeIs('multipart/form-data', ['application/javascript/wrong']))
      .toBe(false)
  })
})

run()
