import type { App } from '../app.ts'
import type { THResponse } from '../response.ts'

/**
 * Function that processes the template
 */
export type TemplateFunc<O> = (
  path: string,
  locals: Record<string, any>,
  opts: TemplateEngineOptions<O>,
  cb: (err: Error | null, html: unknown) => void,
) => void

export type TemplateEngineOptions<O = any> = Partial<{
  cache: boolean
  ext: string
  renderOptions: Partial<O>
  viewsFolder: string
  _locals: Record<string, any>
}>

export const renderTemplate =
  <O = any, Res extends THResponse = THResponse>(res: Res, app: App) =>
  (
    file: string,
    data?: Record<string, any>,
    options?: TemplateEngineOptions<O>,
  ): THResponse => {
    app.render(
      file,
      data,
      (err: unknown, html: unknown) => {
        if (err) throw err

        res.send(html)
      },
      options,
    )

    return res
  }
