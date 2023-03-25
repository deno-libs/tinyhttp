import { THResponse } from '../../../response.ts'

/**
 * Sets the HTTP status for the response. It is a chainable alias of Node’s `response.statusCode`.
 *
 * @param res Response
 */
export const status =
  <Response extends THResponse = THResponse>(res: Response) =>
  (status: number): Response => {
    res._init.status = status

    return res
  }
