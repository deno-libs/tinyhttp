import type { THResponse } from '../../../response.ts'
export const writeHead =
  (res: THResponse) => (status: number, headers?: Record<string, string>) => {
    res.status = status
    for (const k in headers) {
      res.headers.set(k, headers[k])
    }
    return res
  }
