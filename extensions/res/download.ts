import { sendFile, SendFileOptions } from './send/sendFile.ts'
import { setContentType, setHeader } from './headers.ts'
import { DummyResponse } from '../../response.ts'
import { basename, contentDisposition, extname } from '../../deps.ts'

export type DownloadOptions =
  & SendFileOptions
  & Partial<{
    headers: Record<string, unknown>
  }>

export const download = <
  Req extends Request = Request,
  Res extends DummyResponse = DummyResponse,
>(req: Req, res: Res) =>
async (
  path: string,
  filename?: string,
  options: DownloadOptions = {},
): Promise<Res> => {
  const name: string | null = filename as string
  let opts: DownloadOptions = options

  // set Content-Disposition when file is sent
  const headers: Record<string, string> = {
    'Content-Disposition': contentDisposition(name || path),
  }

  // merge user-provided headers
  if (opts.headers) {
    for (const key of Object.keys(opts.headers)) {
      if (key.toLowerCase() !== 'content-disposition') {
        headers[key] = opts.headers[key]
      }
    }
  }

  // merge user-provided options
  opts = { ...opts, headers }

  // send file

  return await sendFile<Req, Res>(req, res)(path, opts)
}

export const attachment =
  <Res extends DummyResponse = DummyResponse>(res: Res) =>
  (filename?: string): Res => {
    if (filename) {
      setContentType(res)(extname(filename))
      filename = basename(filename)
    }
    setHeader(res)('Content-Disposition', contentDisposition(filename))

    return res
  }
