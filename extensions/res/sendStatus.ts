import { Request } from '../../request.ts'
import { Response } from '../../response.ts'
import { send } from './send.ts'
import { status } from 'https://deno.land/x/status@0.1.0/status.ts'

export const sendStatus = (req: Request, res: Response) => (statusCode: number): Response => {
  const body = status(statusCode)

  res.status = statusCode

  res.headers.set('Content-Type', 'text/plain')

  return send(req, res)(body)
}
