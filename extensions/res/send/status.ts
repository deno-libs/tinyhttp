import { DummyResponse } from '../../../response.ts'

/**
 * Sets the HTTP status for the response. It is a chainable alias of Node’s `response.statusCode`.
 *
 * @param res Response
 */
export const status =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (status: number): Res => {
    res._init.status = status

    return res
  }
