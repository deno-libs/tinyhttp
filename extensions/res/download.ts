import { contentDisposition } from 'https://esm.sh/@tinyhttp/content-disposition'
import { SendFileOptions, sendFile } from './sendFile.ts'
import { resolve, extname } from 'https://deno.land/std@0.88.0/path/mod.ts'
import { setContentType, setHeader } from './headers.ts'
import { Request as Req } from '../../request.ts'
import { Response as Res } from '../../response.ts'

export type DownloadOptions = SendFileOptions &
  Partial<{
    headers: Record<string, any>
  }>

type Callback = (err?: any) => void

export const download = <Request extends Req = Req, Response extends Res = Res>(req: Request, res: Response) => (
  path: string,
  filename?: string | Callback,
  options?: DownloadOptions | Callback,
  cb?: Callback
): Response => {
  let done = cb
  let name: string | null = filename as string
  let opts: DownloadOptions | null = options as DownloadOptions

  // support function as second or third arg
  if (typeof filename === 'function') {
    done = filename
    name = null
  } else if (typeof options === 'function') {
    done = options
    opts = null
  }

  // set Content-Disposition when file is sent
  const headers: Record<string, any> = {
    'Content-Disposition': contentDisposition(name || path)
  }

  // merge user-provided headers
  if (opts && opts.headers) {
    for (const key of Object.keys(opts.headers)) {
      if (key.toLowerCase() !== 'content-disposition') headers[key] = opts.headers[key]
    }
  }

  // merge user-provided options
  opts = { ...opts, headers }

  // send file

  return sendFile<Request, Response>(req, res)(
    opts.root ? path : resolve(path),
    opts,
    done || (() => undefined)
  ) as Response
}

export const attachment = <Response extends Res = Res>(res: Response) => (filename?: string): Response => {
  if (filename) setContentType(res)(extname(filename))

  setHeader(res)('Content-Disposition', contentDisposition(filename))

  return res
}
