import { formatResponse } from './format.ts'
import { setLocationHeader } from './headers.ts'
import { escapeHtml, Status, STATUS_TEXT } from '../../deps.ts'
import { DummyResponse } from '../../response.ts'
import { NextFunction } from '../../types.ts'

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  )
}

export const redirect = <
  Res extends DummyResponse = DummyResponse,
  Next extends NextFunction = NextFunction,
>(
  req: Request,
  res: Res,
  next: Next,
) =>
(url: string, status: Status = Status.Found) => {
  let address = url

  let body = ''

  address = setLocationHeader(req, res)(address)._init.headers.get(
    'Location',
  ) as string

  const statusMessage = toTitleCase(
    (STATUS_TEXT[status] as string).replace('_', ' '),
  )

  formatResponse(
    req,
    res,
    next,
  )({
    'text/plain': () => {
      body = statusMessage + '. Redirecting to ' + address
    },
    'text/html': () => {
      const u = escapeHtml(address)

      body = `<p>${statusMessage}. Redirecting to <a href="${u}">${u}</a></p>`
    },
  })

  res._init.headers.set('Content-Length', body.length.toString())

  res._init.status = status

  if (req.method !== 'HEAD') {
    res._body = body
  }

  return res
}
