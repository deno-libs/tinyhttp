import { format, parse } from 'https://deno.land/x/content_type/mod.ts'
import { etag as eTag } from 'https://deno.land/x/opine@1.1.0/src/utils/etag.ts'

export const createETag = (body: Parameters<typeof eTag>[0]) => {
  return eTag(body, { weak: true })
}

export function setCharset(type: string, charset: string) {
  const parsed = parse(type)
  if (parsed.parameters) parsed.parameters.charset = charset

  return format(parsed)
}
