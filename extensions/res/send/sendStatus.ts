import { DummyResponse } from '../../../response.ts'
import { status } from '../../../deps.ts'

export const sendStatus =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (statusCode: number): Res => {
    res._init.status = statusCode
    res._body = status.pretty(statusCode).toString()
    return res
  }
