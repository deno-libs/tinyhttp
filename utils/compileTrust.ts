import { compile } from '../deps.ts'

type TrustValue = ((...args: any[]) => any) | boolean | string | number | string[]

export function compileTrust(value: TrustValue) {
  if (typeof value === 'function') return value

  // Support plain true / false
  if (value === true) return () => true

  // Support trusting hop count
  if (typeof value === 'number') return (_: unknown, i: number) => i < (value as unknown as number)

  // Support comma-separated values
  if (typeof value === 'string') value = value.split(/ *, */)

  return compile(value || [])
}
