import { Response as ServerResponse } from 'https://deno.land/std@0.87.0/http/server.ts'

export interface Response extends ServerResponse {
  headers: Headers
  send(body: string): Response
}
