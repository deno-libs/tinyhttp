import { Response as Res } from '../../response.ts'

export const json = <Response extends Res = Res>(res: Response) => <T = unknown>(body: T): Response => {
  res.headers.set('Content-Type', 'application/json')
  if (typeof body === 'object' && body != null) res.end(JSON.stringify(body, null, 2))
  else if (typeof body === 'string') res.end(body)
  else if (body == null) {
    res.headers.delete('Content-Length')
    res.headers.delete('Transfer-Encoding')
    res.end(null)
  }

  return res
}
