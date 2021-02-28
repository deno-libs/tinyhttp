import { NextFunction } from 'https://esm.sh/@tinyhttp/router'
import { formatResponse } from './format.ts'
import { setLocationHeader } from './headers.ts'
import { Request as Req } from '../../request.ts'
import { Response as Res } from '../../response.ts'
import { status as getStatus } from 'https://deno.land/x/status/status.ts'
import { escapeHTML } from 'https://esm.sh/es-escape-html'

export const redirect = <
  Request extends Req = Req,
  Response extends Res = Res,
  Next extends NextFunction = NextFunction
>(
  req: Request,
  res: Response,
  next: Next
) => (url: string, status = 302) => {
  let address = url

  let body = ''

  address = setLocationHeader(req, res)(address).headers.get('Location') as string

  formatResponse(
    req,
    res,
    next
  )({
    text: () => {
      body = getStatus(status) + '. Redirecting to ' + address
    },
    html: () => {
      const u = escapeHTML(address)

      body = `<p>${getStatus(status)}. Redirecting to <a href="${u}">${u}</a></p>`
    }
  })

  res.setHeader('Content-Length', body.length)

  res.status = status

  if (req.method === 'HEAD') res.end()
  else res.end(body)

  return res
}
