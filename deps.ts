export { default as ipaddr, IPv4, IPv6 } from 'https://esm.sh/ipaddr.js'
import { default as parseRange, Options } from 'https://esm.sh/range-parser@1.2.1'
export { parseRange }
export type { Options as ParseRangeOptions }
export { escapeHtml } from 'https://deno.land/x/escape_html@1.0.0/mod.ts'
export { vary } from 'https://deno.land/x/vary@1.0.0/mod.ts'
export { isIP } from 'https://deno.land/x/isIP@1.0.0/mod.ts'
export { Accepts } from 'https://deno.land/x/accepts@2.1.0/mod.ts'
export { encodeUrl } from 'https://deno.land/x/encodeurl@1.0.0/mod.ts'
export { charset, contentType, lookup } from 'https://deno.land/x/media_types@v2.9.1/mod.ts'
export { parse as rg } from 'https://deno.land/x/regexparam@v2.0.0/src/index.js'
export { forwarded } from 'https://deno.land/x/forwarded@0.0.8/mod.ts'
export * from 'https://deno.land/x/proxy_addr@0.0.9/mod.ts'
import type { ServerRequest as Req, Response as ServerResponse } from 'https://deno.land/std@0.100.0/http/server.ts'

interface Res extends ServerResponse {
  headers: Headers
}

export type { Req, Res }

export { serve, Server } from 'https://deno.land/std@0.100.0/http/server.ts'

export { Router, pushMiddleware } from 'https://esm.sh/@tinyhttp/router@1.3.3'
