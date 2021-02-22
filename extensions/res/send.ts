import { Request } from '../../request.ts'
import { Response } from '../../response.ts'

export const send = (req: Request, res: Response) => (body: string) => {
  req.respond({ ...res, body })
  return res
}
