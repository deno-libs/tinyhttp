import { compile } from '../deps.ts'

type TrustValue = ((...args: any[]) => any) | boolean | string | number | string[]

export function compileTrust(value: TrustValue) {
  if (typeof value === 'function') return value
  if (value === true) return () => true // Support plain true / false
  if (typeof value === 'number') return (_: unknown, i: number) => i < (value as unknown as number) // Support trusting hop count
  if (typeof value === 'string') value = value.split(/ *, */) // Support comma-separated values

  return compile(value || [])
}
