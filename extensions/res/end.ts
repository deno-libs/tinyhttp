import { Request } from '../../request.ts'
import { Response } from '../../response.ts'

export const end = (req: Request, res: Response) => (body: any) => {
  req.respond({ ...res, body })
  return res
}
