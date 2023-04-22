import type { DummyResponse } from '../../response.ts'
import { getResponseHeader, setHeader } from './headers.ts'

export const append =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (field: string, value: string | number | string[]): Res => {
    const prevVal = getResponseHeader<Res>(res)(field)
    let newVal = value

    if (prevVal && typeof newVal !== 'number' && typeof prevVal !== 'number') {
      newVal = Array.isArray(prevVal)
        ? prevVal.concat(newVal)
        : Array.isArray(newVal)
        ? [prevVal].concat(newVal)
        : [prevVal, newVal]
    }
    setHeader(res)(field, newVal)
    return res
  }
