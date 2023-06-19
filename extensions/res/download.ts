import { sendFile, SendFileOptions } from './send/sendFile.ts'
import { setContentType, setHeader } from './headers.ts'
import { DummyResponse } from '../../response.ts'
import { basename, contentDisposition, extname } from '../../deps.ts'

export type DownloadOptions =
  & SendFileOptions
  & Partial<{
    headers: Record<string, unknown>
  }>

type Callback = (err?: any) => void

export const download = <
  Req extends Request = Request,
  Res extends DummyResponse = DummyResponse,
>(req: Req, res: Res) =>
async (
  path: string,
  filename?: string | Callback,
  options?: DownloadOptions | Callback,
  cb?: Callback,
): Promise<Res> => {
  let name: string | null = filename as string
  let done = cb
  let opts: DownloadOptions = (options || null) as DownloadOptions
  if (typeof filename === 'function') {
    done = filename
    name = null
  } else if (typeof options === 'function') {
    done = options
  }
  opts = opts || {}
  // set Content-Disposition when file is sent
  const headers: Record<string, string> = {
    'Content-Disposition': contentDisposition(basename(name || path)),
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

  return await sendFile<Req, Res>(req, res)(
    path,
    opts,
    done || (() => undefined),
  )
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
