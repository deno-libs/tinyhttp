<p align="center">
  <img src="https://raw.githubusercontent.com/deno-libs/tinyhttp/master/logo.svg"  />
  <h1 align="center">tinyhttp</h1>
</p>

[![nest badge](https://nest.land/badge.svg)](https://nest.land/package/tinyhttp) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/deno-libs/tinyhttp?style=flat-square) [![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Codecov][codecov-badge]][codecov] [![][docs-badge]][docs]

This is a [Deno](https://deno.land) port of [tinyhttp](https://github.com/talentlessguy/tinyhttp), 0-legacy, tiny &amp; fast web framework as a replacement of Express.

> **WARNING!** This port is very unstable and is not well tested yet. Wait for the v2 release of tinyhttp for a complete version (see [talentlessguy/tinyhttp#198](https://github.com/talentlessguy/tinyhttp/issues/198))

## Example

```ts
import { App } from 'https://deno.land/x/tinyhttp/app.ts'

const app = new App()

app.get('/:name/', (req, res) => {
  res.send(`Hello on ${req.url} from Deno v${Deno.version.deno} and tinyhttp! 🦕`)
})

app.listen(3000, () => console.log(`Started on :3000`))
```

## Donate

[![PayPal](https://img.shields.io/badge/PayPal-cyan?style=flat-square&logo=paypal)](https://paypal.me/v1rtl) [![ko-fi](https://img.shields.io/badge/kofi-pink?style=flat-square&logo=ko-fi)](https://ko-fi.com/v1rtl) [![Qiwi](https://img.shields.io/badge/qiwi-white?style=flat-square&logo=qiwi)](https://qiwi.com/n/V1RTL) [![Yandex Money](https://img.shields.io/badge/Yandex_Money-yellow?style=flat-square&logo=yandex)](https://money.yandex.ru/to/410014774355272)

[![Bitcoin](https://badge-crypto.vercel.app/api/badge?coin=btc&address=3PxedDftWBXujWtr7TbWQSiYTsZJoMD8K5)](https://badge-crypto.vercel.app/btc/3PxedDftWBXujWtr7TbWQSiYTsZJoMD8K5) [![Ethereum](https://badge-crypto.vercel.app/api/badge?coin=eth&address=0x9d9236DC024958D7fB73Ad9B178BD5D372D82288)
](https://badge-crypto.vercel.app/eth/0x9d9236DC024958D7fB73Ad9B178BD5D372D82288) [![ChainLink](https://badge-crypto.vercel.app/api/badge?coin=link&address=0x9d9236DC024958D7fB73Ad9B178BD5D372D82288)](https://badge-crypto.vercel.app/link/0xcd0da1c9b0DA7D2b862bbF813cB50f76F2fB4F5d)

[gh-actions-img]: https://img.shields.io/github/workflow/status/talentlessguy/tinyhttp/CI?style=flat-square
[codecov]: https://codecov.io/gh/deno-libs/tinyhttp
[github-actions]: https://github.com/deno-libs/tinyhttp/actions
[license]: https://github.com/deno-libs/tinyhttp/blob/master/LICENSE
[codecov-badge]: https://img.shields.io/codecov/c/gh/deno-libs/tinyhttp?style=flat-square
[docs-badge]: https://img.shields.io/github/v/release/deno-libs/tinyhttp?color=yellow&label=Docs&logo=deno&style=flat-square
[docs]: https://doc.deno.land/https/deno.land/x/tinyhttp/mod.ts
