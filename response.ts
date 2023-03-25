import { App } from './app.ts'
import { DownloadOptions } from './extensions/res/download.ts'
import { FormatProps } from './extensions/res/format.ts'
import type { SendFileOptions } from './extensions/res/send/sendFile.ts'
import { THRequest } from './request.ts'
import type { TemplateEngineOptions } from './types.ts'

export const renderTemplate =
  <O, Res extends THResponse = THResponse>(res: Res, app: App) =>
  (
    file: string,
    data?: Record<string, any>,
    options?: TemplateEngineOptions<O>,
  ): THResponse => {
    app.render(
      file,
      data ? { ...data, ...res.locals } : res.locals,
      (err: unknown, html: unknown) => {
        if (err) throw err
        res.send(html)
      },
      options,
    )
    return res
  }

export interface THResponse<O = any, B = any> {
  _body?: BodyInit
  _init: ResponseInit & { headers: Headers }
  locals: Record<string, unknown>
  send(body: B): THResponse<O, B>
  sendFile(path: string, opts?: SendFileOptions): THResponse<O, B>
  end(body?: BodyInit): THResponse<O, B>
  links(links: { [key: string]: string }): THResponse<O, B>
  render(
    file: string,
    data?: Record<string, any>,
    options?: TemplateEngineOptions<O>,
  ): THResponse<O, B>
  vary(field: string): THResponse<O, B>
  format(obj: FormatProps): THResponse<O, B>
  redirect(url: string, status?: number): THResponse<O, B>
  type(type: string): THResponse<O, B>
  download(
    path: string,
    filename: string,
    options?: DownloadOptions,
    cb?: (err?: any) => void,
  ): THResponse<O, B>
  attachment(filename?: string): THResponse<O, B>
  json(body: B): THResponse<O, B>
  status(status: number): THResponse<O, B>
  sendStatus(statusCode: number): THResponse<O, B>
  append(field: string, value: unknown): THResponse<O, B>
}
