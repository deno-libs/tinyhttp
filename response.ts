import { Response as ServerResponse } from 'https://deno.land/std@0.87.0/http/server.ts'
import type { SendFileOptions } from './extensions/res/sendFile.ts'
export interface Response extends ServerResponse {
  headers: Headers
  send(body: unknown): Response
  sendFile(path: string, options?: SendFileOptions, cb?: (err?: any) => void): Response
  end(body: unknown): Response
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
}
