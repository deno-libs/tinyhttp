import type { App } from '../app.ts'
import type { THResponse } from '../response.ts'

/**
 * Function that processes the template
 */
export type TemplateFunc<O> = (
  path: string,
  data: Record<string, any>,
  opts?: TemplateEngineOptions<O>,
  cb?: (err: Error | null, html: string) => void,
) => void

export type TemplateEngineOptions<O> = Partial<{
  cache: boolean
  ext: string
  renderOptions: Partial<O>
  viewsFolder: string
  _locals: Record<string, any>
}>

export const renderTemplate = <O>(res: THResponse, app: App) =>
(
  file: string,
  data?: Record<string, any>,
  options?: TemplateEngineOptions<O>,
): THResponse => {
  app.render(
    file,
    data ? { ...data, ...res.locals } : res.locals,
    (err: Error | null, html: string) => {
      if (err) throw err
      res.end(html)
    },
    options,
  )
  return res
}
