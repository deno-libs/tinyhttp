// deno-lint-ignore-file

import { Response as ServerResponse } from 'https://deno.land/std@0.87.0/http/server.ts'
import type { SendFileOptions } from './extensions/res/sendFile.ts'
import type { TemplateEngineOptions, App } from './app.ts'
import type { FormatProps } from './extensions/format.ts'

export const renderTemplate = <O = any, Res extends Response = Response>(res: Res, app: App) => (
  file: string,
  data?: Record<string, any>,
  options?: TemplateEngineOptions<O>
): Response => {
  app.render(
    file,
    data,
    (err: unknown, html: unknown) => {
      if (err) throw err

      res.send(html)
    },
    options
  )

  return res
}

export interface Response<O = any> extends ServerResponse {
  headers: Headers
  app: App
  send(body: unknown): Response
  sendFile(path: string, options?: SendFileOptions, cb?: (err?: any) => void): Response
  end(body?: unknown): Response
  json(body: unknown): Response
  sendStatus(status: number): Response
  setHeader(
    field: string | Record<string, string | number | string[]>,
    val?: string | number | readonly string[]
  ): Response
  set(field: string | Record<string, string | number | string[]>, val?: string | number | readonly string[]): Response
  location(url: string): Response
  status: number
  get(field: string): string | number | string[] | null
  append(field: string, value: any): Response
  render(file: string, data?: Record<string, any>, options?: TemplateEngineOptions<O>): Response
  links(links: { [key: string]: string }): Response
  type(type: string): Response
  format(obj: FormatProps): Response
  vary(field: string): Response
}
