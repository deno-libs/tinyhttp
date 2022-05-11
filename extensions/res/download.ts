import { contentDisposition } from 'https://cdn.skypack.dev/@tinyhttp/content-disposition@2'
import { SendFileOptions, sendFile } from './send/sendFile.ts'
import { extname } from 'https://deno.land/std@0.130.0/path/mod.ts'
import { setContentType, setHeader } from './headers.ts'
import { THRequest } from '../../request.ts'
import { THResponse } from '../../response.ts'

export type DownloadOptions = SendFileOptions &
  Partial<{
    headers: Record<string, unknown>
  }>

export const download =
  <Request extends THRequest = THRequest, Response extends THResponse = THResponse>(req: Request, res: Response) =>
  (path: string, filename?: string, options: DownloadOptions = {}): Response => {
    const name: string | null = filename as string
    let opts: DownloadOptions = options

    // set Content-Disposition when file is sent
    const headers: Record<string, string> = {
      'Content-Disposition': contentDisposition(name || path)
    }

    // merge user-provided headers
    if (opts.headers) {
      for (const key of Object.keys(opts.headers)) {
        if (key.toLowerCase() !== 'content-disposition') headers[key] = opts.headers[key]
      }
    }

    // merge user-provided options
    opts = { ...opts, headers }

    // send file

    return sendFile<Request, Response>(req, res)(path, opts) as Response
  }

export const attachment =
  <Response extends THResponse = THResponse>(res: Response) =>
  (filename?: string): Response => {
    if (filename) setContentType(res)(extname(filename))

    setHeader(res)('Content-Disposition', contentDisposition(filename))

    return res
  }
