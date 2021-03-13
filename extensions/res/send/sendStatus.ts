import { Req, Res } from '../../../deps.ts'
import { send } from './send.ts'
import { status } from 'https://deno.land/x/status/status.ts'

export const sendStatus = <Request extends Req = Req, Response extends Res = Res>(req: Request, res: Response) => (
  statusCode: number
): Response => {
  const body = status(statusCode)

  res.status = statusCode

  res.headers?.set('Content-Type', 'text/plain')

  return send(req, res)(body)
}
