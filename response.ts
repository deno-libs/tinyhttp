import { App } from './app.ts'
import { SetCookieOptions } from './extensions/res/cookie.ts'
import { DownloadOptions } from './extensions/res/download.ts'
import { FormatProps } from './extensions/res/format.ts'
import type { SendFileOptions } from './extensions/res/send/sendFile.ts'
import type { TemplateEngineOptions } from './types.ts'

export const renderTemplate =
  <O, Res extends THResponse = THResponse>(res: Res, app: App) =>
  (
    file: string,
    data?: Record<string, unknown>,
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
  send(body: B): Promise<THResponse<O, B>>
  sendFile(path: string, opts?: SendFileOptions): Promise<THResponse<O, B>>
  end(body?: BodyInit): THResponse<O, B>
  links(links: { [key: string]: string }): THResponse<O, B>
  render(
    file: string,
    data?: Record<string, unknown>,
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
    cb?: (err?: unknown) => void,
  ): THResponse<O, B>
  attachment(filename?: string): THResponse<O, B>
  json(body: B): THResponse<O, B>
  status(status: number): THResponse<O, B>
  sendStatus(statusCode: number): THResponse<O, B>
  append(field: string, value: unknown): THResponse<O, B>
  cookie(
    name: string,
    value: string | Record<string, unknown>,
    options?: SetCookieOptions,
  ): THResponse<O, B>
  clearCookie(name: string): THResponse<O, B>
  location(url: string): THResponse<O, B>
  header(
    field: string | Record<string, string | number | string[]>,
    val?: string | number | readonly string[],
  ): THResponse<O, B>
  set(
    field: string | Record<string, string | number | string[]>,
    val?: string | number | readonly string[],
  ): THResponse<O, B>
  get(field: string): string | null
}
