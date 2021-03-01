import { Req, Res } from '../../deps.ts'

export const end = <Request extends Req = Req, Response extends Res = Res>(req: Request, res: Response) => (
  body: any = ''
) => {
  req.respond({ ...res, body })
  return res
}
