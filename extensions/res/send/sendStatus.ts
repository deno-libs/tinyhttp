import { THResponse } from '../../../response.ts'
import { status } from '../../../deps.ts'

export const sendStatus =
  <Response extends THResponse = THResponse>(res: Response) =>
  (statusCode: number): Response => {
    res._init.status = statusCode
    res.end(status.pretty(statusCode).toString())
    return res
  }
