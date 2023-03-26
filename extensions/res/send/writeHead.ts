import type { THResponse } from '../../../response.ts'
export const writeHead =
  (res: THResponse) => (status: number, headers?: Record<string, string>) => {
    res._init.status = status
    for (const k in headers) {
      res._init.headers.set(k, headers[k])
    }
    return res
  }
