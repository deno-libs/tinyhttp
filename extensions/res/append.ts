import { THResponse } from '../../response.ts'
import { getResponseHeader, setHeader } from './headers.ts'

export const append =
  <Response extends THResponse = THResponse>(res: Response) =>
  (field: string, value: string | number | string[]): Response => {
    const prevVal = getResponseHeader<THResponse>(res)(field)
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
