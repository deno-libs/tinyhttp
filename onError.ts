import { status, STATUS_CODES } from './deps.ts'
import { THRequest } from './request.ts'
import { THResponse } from './response.ts'

export type ErrorHandler = (err: any, request: THRequest, response: THResponse) => void

export const onErrorHandler: ErrorHandler = (err, _req, res) => {
  const code = err.code || err.status

  if (typeof err === 'string') {
    res.status = code || 500
    res.body = err
  } else if (Object.values(STATUS_CODES).includes(code!)) {
    res.status = code
    res.body = status.pretty(code!).toString()
  } else {
    res.status = 500
    res.body = err.message
  }
}
