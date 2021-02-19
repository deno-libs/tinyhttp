# tinyhttp

[![nest badge](https://nest.land/badge.svg)](https://nest.land/package/tinyhttp)

Deno port of [tinyhttp](https://github.com/talentlessguy/tinyhttp), 0-legacy, tiny &amp; fast web framework as a replacement of Express.

> **WARNING!** This port is very unstable and lacks features. It also doesn't have all of the tinyhttp's original extensions.

## Example

```ts
import { App } from 'https://deno.land/x/tinyhttp@v0.0.3/app.ts'

const app = new App()

app.use('/', (req, next) => {
  console.log(`${req.method} ${req.url}`)

  next()
})

app.get('/:name/', (req) => {
  req.respond({ body: `Hello ${req.params.name}!` })
})

app.listen(3000, () => console.log(`Started on :3000`))
```

## Changes

Because Deno doesn't have the same API for HTTP server, there's no `res` argument. To send responses use `req.respond` instead.
