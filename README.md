<p align="center">
  <img src="logo.svg"  />
  <h1 align="center">tinyhttp</h1>
</p>

[![nest badge](https://nest.land/badge.svg)](https://nest.land/package/tinyhttp) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/talentlessguy/tinyhttp-deno?style=flat-square)

This is a [Deno](https://deno.land) port of [tinyhttp](https://github.com/talentlessguy/tinyhttp), 0-legacy, tiny &amp; fast web framework as a replacement of Express.

> **WARNING!** This port is very unstable and lacks features. It also doesn't have all of the tinyhttp's original extensions. Wait for the v2 release of tinyhttp for a better version (see [talentlessguy/tinyhttp#198](https://github.com/talentlessguy/tinyhttp/issues/198))

## Example

```ts
import { App } from 'https://deno.land/x/tinyhttp@v0.0.5/app.ts'

const app = new App()

app.use('/', (req, res, next) => {
  console.log(`${req.method} ${req.url}`)

  res.set('Test-Header', 'Value')

  next()
})

app.get('/:name/', (req, res) => {
  res.send(`Hello on ${req.url} from Deno and tinyhttp! 🦕`)
})

app.listen(3000, () => console.log(`Started on :3000`))
```
