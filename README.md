<div align="center">
  <img src="https://raw.githubusercontent.com/deno-libs/tinyhttp/master/logo.svg"  />
  <h1 align="center">tinyhttp</h1>
  
  [![nest badge][nest-badge]](https://nest.land/package/tinyhttp) [![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Codecov][codecov-badge]][codecov] [![][docs-badge]][docs] [![][code-quality-img]][code-quality] ![Dependency count][deps]
</div>

> **WARNING!** The Deno port project is frozen for now. Please help us to move to native Deno http, see [#11](https://github.com/deno-libs/tinyhttp/issues/11)

This is a [Deno](https://deno.land) port of [tinyhttp](https://github.com/talentlessguy/tinyhttp), 0-legacy, tiny &amp; fast web framework as a replacement of Express.

## Example

```ts
import { App } from 'https://deno.land/x/tinyhttp/app.ts'

const app = new App()

app.get('/:name/', (req, res) => {
  return res.send(`Hello on ${req.url} from Deno v${Deno.version.deno} and tinyhttp! 🦕`)
})

app.listen(3000, () => console.log(`Started on :3000`))
```

[docs-badge]: https://img.shields.io/github/v/release/deno-libs/tinyhttp?label=Docs&logo=deno&style=for-the-badge&color=B06892
[docs]: https://doc.deno.land/https/deno.land/x/tinyhttp/mod.ts
[gh-actions-img]: https://img.shields.io/github/workflow/status/deno-libs/tinyhttp/CI?style=for-the-badge&logo=github&label=&color=B06892
[codecov]: https://coveralls.io/github/deno-libs/tinyhttp
[github-actions]: https://github.com/deno-libs/tinyhttp/actions
[codecov-badge]: https://img.shields.io/coveralls/github/deno-libs/tinyhttp?style=for-the-badge&color=B06892&
[nest-badge]: https://img.shields.io/badge/publushed%20on-nest.land-B06892?style=for-the-badge
[code-quality-img]: https://img.shields.io/codefactor/grade/github/deno-libs/tinyhttp?style=for-the-badge&color=B06892
[code-quality]: https://www.codefactor.io/repository/github/deno-libs/tinyhttp
[deps]: https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fdep-count%2Fhttps%2Fx.nest.land%2Ftinyhttp%400.1.23%2Fmod.ts&style=for-the-badge&color=B06892
