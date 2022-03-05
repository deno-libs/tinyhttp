import type { SendFileOptions, DownloadOptions } from './extensions/res/mod.ts'
import type { Cookie } from 'https://deno.land/std@0.128.0/http/cookie.ts'
import type { FormatProps } from './extensions/res/format.ts'
import type { TemplateEngineOptions } from './utils/template.ts'
import type { App } from './app.ts'

export interface THResponse<O = any> extends ResponseInit {
  body: any
  headers: Headers
  app: App

  end(body?: BodyInit | number | boolean | null | undefined): THResponse
  json(body: Record<string, any>): THResponse
  send(body: any): THResponse
  sendFile(path: string, options?: SendFileOptions, cb?: (err?: any) => void): THResponse
  sendStatus(status: number): THResponse
  setHeader(
    field: string | Record<string, string | number | string[]>,
    val?: string | number | readonly string[]
  ): THResponse
  set(field: string | Record<string, string | number | string[]>, val?: string | number | readonly string[]): THResponse
  location(url: string): THResponse
  get(field: string): string | null | undefined
  append(field: string, value: any): THResponse
  render(file: string, data?: Record<string, any>, options?: TemplateEngineOptions<O>): THResponse
  links(links: { [key: string]: string }): THResponse
  type(type: string): THResponse
  format(obj: FormatProps): THResponse
  vary(field: string): THResponse
  locals: Record<string, any>
  download(path: string, filename: string, options?: DownloadOptions, cb?: (err?: any) => void): THResponse
  attachment(filename?: string): THResponse

  cookie(name: string, value: string | Record<string, unknown>, options?: Omit<Cookie, 'name' | 'value'>): THResponse
  clearCookie(name: string): THResponse
  jsonp(obj: any): THResponse

  redirect(url: string, status?: number): THResponse
}
