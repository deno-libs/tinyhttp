import { status, STATUS_CODES } from './deps.ts'
import { THResponse } from './response.ts'

export type ErrorHandler = (err: any, request: Request, response: THResponse) => void

export const onError: ErrorHandler = (err, _req, res) => {
  const code = err.code || err.status

  if (typeof err === 'string') {
    res.init = {
      status: code || 500
    }
    res.bodyInit = err
  } else if (Object.values(STATUS_CODES).includes(code!)) {
    res.init = { status: code }
    res.bodyInit = status.pretty(code!).toString()
  } else {
    res.init = { status: 500 }
    res.bodyInit = err.message
  }
}
