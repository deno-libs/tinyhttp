import { compile } from '../deps.ts'

type TrustValue = ((...args: any[]) => any) | boolean | string | number | string[]

export function compileTrust(value: TrustValue) {
  if (typeof value === 'function') return value

  if (value === true) {
    // Support plain true / false
    return () => true
  }

  if (typeof value === 'number') {
    // Support trusting hop count
    return function (_: unknown, i: number) {
      return i < ((value as unknown) as number)
    }
  }

  if (typeof value === 'string') {
    // Support comma-separated values
    value = value.split(/ *, */)
  }

  return compile(value || [])
}
